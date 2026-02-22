import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    const cookieStore = await cookies();
    const backupStateId = cookieStore.get("gmail_oauth_state")?.value;

    const finalUserId = session?.user?.id || backupStateId;

    if (!finalUserId || finalUserId !== state) {
        return NextResponse.redirect(new URL("/login?error=unauthorized_callback", request.url));
    }

    try {
        // Construct the EXACT same redirect URI using HTTP headers
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
        const rawBaseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.URL || url.origin);
        const baseUrl = rawBaseUrl.replace(/\/$/, "");
        const redirectUri = `${baseUrl}/api/gmail/callback`;

        // Exchange authorization code for refresh token
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: redirectUri,
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
                where: { id: finalUserId },
                data: { gmailRefreshToken: data.refresh_token },
            });
        }

        // Clean up cookie
        cookieStore.delete("gmail_oauth_state");

        // Redirect back to settings with success param
        return NextResponse.redirect(new URL("/settings?gmail_connected=true", request.url));
    } catch (err) {
        console.error("Failed to process Gmail callback:", err);
        return NextResponse.redirect(new URL("/settings?error=unknown_callback", request.url));
    }
}
