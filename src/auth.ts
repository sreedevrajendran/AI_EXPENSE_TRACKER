import NextAuth, { type NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { sendWelcomeEmail, sendLoginEmail } from "@/lib/email";

import crypto from "crypto";

function hashPassword(password: string, existingSalt?: string) {
    const salt = existingSalt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string) {
    const check = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return check === hash;
}

export const authOptions: NextAuthOptions = {
    // Note: Do NOT use FirestoreAdapter here because when Firestore daily quota is exhausted,
    // the adapter fails all OAuth callbacks with RESOURCE_EXHAUSTED and aborts sign in.
    // Instead, we use stateless JWT sessions with resilient non-blocking user profile sync.
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        CredentialsProvider({
            id: "google-native",
            name: "Native Google Account",
            credentials: {
                email: { label: "Email", type: "email" },
                name: { label: "Name", type: "text" },
                image: { label: "Image", type: "text" },
                idToken: { label: "idToken", type: "text" },
            },
            async authorize(credentials) {
                const rawEmail = credentials?.email;
                if (!rawEmail) {
                    throw new Error("No Google email provided.");
                }

                const email = rawEmail.trim().toLowerCase();
                const name = credentials?.name?.trim() || email.split("@")[0];
                const image = credentials?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
                const defaultId = `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;

                if (isFirebaseConfigured && db) {
                    try {
                        const usersRef = db.collection("users");
                        const snapshot = await usersRef.where("email", "==", email).limit(1).get();

                        if (snapshot.empty) {
                            const docRef = usersRef.doc(defaultId);
                            const newUser = {
                                id: defaultId,
                                email,
                                name,
                                image,
                                createdAt: new Date(),
                            };
                            await docRef.set(newUser);
                            return newUser;
                        }

                        const userDoc = snapshot.docs[0];
                        const userData = userDoc.data();
                        return {
                            id: userDoc.id,
                            name: userData.name || name,
                            email: userData.email || email,
                            image: userData.image || image,
                        };
                    } catch (e) {
                        console.warn("[google-native] Firestore user sync failed, using local profile:", e);
                    }
                }

                return {
                    id: defaultId,
                    name,
                    email,
                    image,
                };
            },
        }),
        CredentialsProvider({
            id: "credentials",
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                name: { label: "Name", type: "text" },
                action: { label: "Action", type: "text" },
            },
            async authorize(credentials) {
                const rawEmail = credentials?.email;
                const rawPassword = credentials?.password;

                if (!rawEmail || !rawPassword) {
                    throw new Error("Please enter both email and password.");
                }

                const email = rawEmail.trim().toLowerCase();
                const password = String(rawPassword);
                const name = credentials?.name?.trim() || email.split("@")[0];
                const action = credentials?.action || "signin";

                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters.");
                }

                if (isFirebaseConfigured && db) {
                    try {
                        const usersRef = db.collection("users");
                        const snapshot = await usersRef.where("email", "==", email).limit(1).get();

                        if (snapshot.empty) {
                            // User does not exist yet -> automatically create new account
                            const docRef = usersRef.doc();
                            const { hash, salt } = hashPassword(password);
                            const newUser = {
                                id: docRef.id,
                                email,
                                name,
                                image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                                passwordHash: hash,
                                salt,
                                createdAt: new Date(),
                            };
                            await docRef.set(newUser);
                            return {
                                id: docRef.id,
                                name: newUser.name,
                                email: newUser.email,
                                image: newUser.image,
                            };
                        }

                        const userDoc = snapshot.docs[0];
                        const userData = userDoc.data();

                        if (action === "signup" && userData.passwordHash) {
                            throw new Error("An account with this email already exists. Please sign in.");
                        }

                        if (userData.passwordHash && userData.salt) {
                            const isValid = verifyPassword(password, userData.passwordHash, userData.salt);
                            if (!isValid) {
                                throw new Error("Incorrect password. Please verify and try again.");
                            }
                        } else {
                            // Existing account without password -> link password now
                            const { hash, salt } = hashPassword(password);
                            await userDoc.ref.update({
                                passwordHash: hash,
                                salt,
                                name: userData.name || name,
                            });
                        }

                        return {
                            id: userDoc.id,
                            name: userData.name || name,
                            email: userData.email || email,
                            image: userData.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                        };
                    } catch (e: any) {
                        if (e?.message?.includes("Incorrect password") || e?.message?.includes("already exists")) {
                            throw e;
                        }
                        console.warn("[credentials] Firestore auth error, falling back to local user:", e);
                    }
                }

                // Offline fallback
                return {
                    id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
                    name,
                    email,
                    image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                };
            },
        }),
        CredentialsProvider({
            id: "guest",
            name: "Guest Access",
            credentials: {
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
                return {
                    id: "guest-user",
                    name: credentials?.name || "Guest User",
                    email: credentials?.email || "guest@floww.local",
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "floww-secret-jwt-key-2026-safe-production",
    callbacks: {
        async signIn({ user }) {
            if (isFirebaseConfigured && db && user?.email) {
                try {
                    const email = user.email.toLowerCase();
                    const usersRef = db.collection("users");
                    const snapshot = await usersRef.where("email", "==", email).limit(1).get();
                    if (snapshot.empty) {
                        const userId = user.id || `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
                        await usersRef.doc(userId).set({
                            id: userId,
                            email,
                            name: user.name || email.split("@")[0],
                            image: user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                            createdAt: new Date(),
                        });
                    }
                } catch (e) {
                    console.warn("[NextAuth signIn] Background user profile sync skipped:", e);
                }
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }
            return token;
        },
        session({ session, user, token }) {
            if (session.user) {
                session.user.id = user?.id || (token?.id as string) || (token?.sub as string);
                if (token?.email) session.user.email = token.email as string;
                if (token?.name) session.user.name = token.name as string;
                if (token?.picture) session.user.image = token.picture as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            try {
                const targetUrl = new URL(url);
                const baseObj = new URL(baseUrl);
                if (targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1") {
                    if (baseObj.hostname !== "localhost" && baseObj.hostname !== "127.0.0.1") {
                        targetUrl.protocol = baseObj.protocol;
                        targetUrl.host = baseObj.host;
                        return targetUrl.toString();
                    }
                }
                return url;
            } catch {
                return baseUrl;
            }
        },
    },
    pages: {
        signIn: "/login",
    },
    events: {
        async createUser({ user }) {
            try {
                if (user.email && user.name) {
                    await sendWelcomeEmail(user.email, user.name);
                }
            } catch {
                // Ignore email failure
            }
        },
        async signIn({ user, isNewUser }) {
            try {
                if (!isNewUser && user.email && user.name) {
                    await sendLoginEmail(user.email, user.name);
                }
            } catch {
                // Ignore email failure
            }
        }
    }
};

export default NextAuth(authOptions);
