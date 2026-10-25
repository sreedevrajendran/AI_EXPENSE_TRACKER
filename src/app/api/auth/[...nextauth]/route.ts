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
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.") ? "http" : "https");
    const currentOrigin = `${proto}://${host}`;

    // Dynamically synchronize NEXTAUTH_URL with the incoming request host
    process.env.NEXTAUTH_URL = currentOrigin;

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

    // Intercept redirect responses and rewrite any localhost:3000 target to currentOrigin
    const location = res.headers.get("location");
    if (location && currentOrigin) {
        try {
            const parsedLoc = new URL(location);
            if (
                (parsedLoc.hostname === "localhost" || parsedLoc.hostname === "127.0.0.1") &&
                !host.includes("localhost") &&
                !host.includes("127.0.0.1")
            ) {
                const originObj = new URL(currentOrigin);
                parsedLoc.protocol = originObj.protocol;
                parsedLoc.host = originObj.host;

                const newHeaders = new Headers(res.headers);
                newHeaders.set("location", parsedLoc.toString());

                return new Response(res.body, {
                    status: res.status,
                    statusText: res.statusText,
                    headers: newHeaders,
                });
            }
        } catch (e) {
            // Ignore if invalid URL
        }
    }

    return res;
}

export { handler as GET, handler as POST };
