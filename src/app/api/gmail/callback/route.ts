import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // this is the userId we passed
    const error = url.searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL(`/settings?error=${error}`, request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL("/settings?error=missing_code", request.url));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== state) {
        return NextResponse.redirect(new URL("/login?error=unauthorized_callback", request.url));
    }

    try {
        // Exchange authorization code for refresh token
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${url.origin}/api/gmail/callback`,
                grant_type: "authorization_code",
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gmail OAuth exchange error:", data);
            return NextResponse.redirect(new URL("/settings?error=oauth_exchange", request.url));
        }

        // We specifically need the refresh token. If it's missing, it means they already 
        // granted consent before but we lost tracking. We forced `prompt=consent` so it should be there.
        if (data.refresh_token) {
            await db.user.update({
                where: { id: session.user.id },
                data: { gmailRefreshToken: data.refresh_token },
            });
        }

        // Redirect back to settings with success param
        return NextResponse.redirect(new URL("/settings?gmail_connected=true", request.url));
    } catch (err) {
        console.error("Failed to process Gmail callback:", err);
        return NextResponse.redirect(new URL("/settings?error=unknown_callback", request.url));
    }
}
