import NextAuth, { type NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { sendWelcomeEmail, sendLoginEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
    adapter: isFirebaseConfigured && db ? (FirestoreAdapter(db) as any) : undefined,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
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
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, user, token }) {
            if (session.user) {
                session.user.id = user?.id || (token?.id as string) || (token?.sub as string);
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
            if (user.email && user.name) {
                await sendWelcomeEmail(user.email, user.name);
            }
        },
        async signIn({ user, isNewUser }) {
            // We only send the login email if it's NOT a brand new user (since they will already get a welcome email).
            // Note: The `isNewUser` flag is only available in the `signIn` event if using a database adapter.
            if (!isNewUser && user.email && user.name) {
                await sendLoginEmail(user.email, user.name);
            }
        }
    }
};

export default NextAuth(authOptions);
