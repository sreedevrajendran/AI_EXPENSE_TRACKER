import NextAuth from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

const GUEST_SESSION = {
    user: {
        id: "guest-user",
        name: "Guest User",
        email: "guest@floww.local",
        image: null,
    },
    expires: new Date(Date.now() + 30 * 86400000).toISOString(),
};

async function handler(req: NextRequest, ctx: any) {
    const res = await nextAuthHandler(req, ctx);
    const { pathname } = req.nextUrl;
    if (pathname.endsWith("/session")) {
        try {
            const clone = res.clone();
            const data = await clone.json();
            if (!data || Object.keys(data).length === 0 || !data.user) {
                return NextResponse.json(GUEST_SESSION);
            }
        } catch {
            return NextResponse.json(GUEST_SESSION);
        }
    }
    return res;
}

export { handler as GET, handler as POST };
