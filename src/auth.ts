import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { sendWelcomeEmail, sendLoginEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    session: {
        strategy: "database",
    },
    callbacks: {
        session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
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
