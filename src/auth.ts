import NextAuth, { type NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { sendWelcomeEmail, sendLoginEmail } from "@/lib/email";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkLoginRateLimit, recordFailedLogin, resetLoginRateLimit } from "@/lib/rateLimit";

const BCRYPT_SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string, legacySalt?: string): Promise<boolean> {
    if (legacySalt) {
        // Fallback for legacy PBKDF2 hashes (backward compatibility)
        const check = crypto.pbkdf2Sync(password, legacySalt, 10000, 64, "sha512").toString("hex");
        return check === hash;
    }
    return bcrypt.compare(password, hash);
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
                    throw new Error("Invalid credentials.");
                }

                const email = rawEmail.trim().toLowerCase();
                const password = String(rawPassword);
                const name = credentials?.name?.trim() || email.split("@")[0];
                const action = credentials?.action || "signin";

                // Enforce rate limiting to block brute force attacks (OWASP A07:2021)
                const rateCheck = checkLoginRateLimit(email);
                if (!rateCheck.isAllowed) {
                    throw new Error(`Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`);
                }

                if (password.length < 6) {
                    recordFailedLogin(email);
                    throw new Error("Invalid credentials.");
                }

                if (isFirebaseConfigured && db) {
                    try {
                        const usersRef = db.collection("users");
                        const snapshot = await usersRef.where("email", "==", email).limit(1).get();

                        if (snapshot.empty) {
                            if (action === "signin") {
                                recordFailedLogin(email);
                                throw new Error("Invalid credentials.");
                            }

                            // User sign-up -> hash password using bcrypt with 12 salt rounds
                            const docRef = usersRef.doc();
                            const passwordHash = await hashPassword(password);
                            const newUser = {
                                id: docRef.id,
                                email,
                                name,
                                image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                                passwordHash,
                                createdAt: new Date(),
                            };
                            await docRef.set(newUser);
                            resetLoginRateLimit(email);
                            return {
                                id: docRef.id,
                                name: newUser.name,
                                email: newUser.email,
                                image: newUser.image,
                            };
                        }

                        const userDoc = snapshot.docs[0];
                        const userData = userDoc.data();

                        if (action === "signup") {
                            recordFailedLogin(email);
                            // Generic message prevents account enumeration
                            throw new Error("Invalid credentials or account cannot be registered.");
                        }

                        if (userData.passwordHash) {
                            const isValid = await verifyPassword(password, userData.passwordHash, userData.salt);
                            if (!isValid) {
                                recordFailedLogin(email);
                                throw new Error("Invalid credentials.");
                            }

                            // If user was using legacy PBKDF2 hash, automatically upgrade to bcrypt
                            if (userData.salt) {
                                const newHash = await hashPassword(password);
                                await userDoc.ref.update({
                                    passwordHash: newHash,
                                    salt: null,
                                }).catch(() => {});
                            }
                        } else {
                            // Existing OAuth account without local password -> link password using bcrypt
                            const passwordHash = await hashPassword(password);
                            await userDoc.ref.update({
                                passwordHash,
                                name: userData.name || name,
                            });
                        }

                        resetLoginRateLimit(email);
                        return {
                            id: userDoc.id,
                            name: userData.name || name,
                            email: userData.email || email,
                            image: userData.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
                        };
                    } catch (e: any) {
                        if (e?.message?.includes("Invalid credentials") || e?.message?.includes("Too many login attempts")) {
                            throw e;
                        }
                        recordFailedLogin(email);
                        console.warn("[credentials] Firestore auth error, falling back to local user:", e);
                        throw new Error("Invalid credentials.");
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "production"
        ? (() => { throw new Error("CRITICAL SECURITY VIOLATION: NEXTAUTH_SECRET is required in production environment."); })()
        : "development-runtime-secret-only"),
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
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
