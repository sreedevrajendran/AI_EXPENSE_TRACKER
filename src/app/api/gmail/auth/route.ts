import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Official Google OAuth 2.0 endpoint
    const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

    // Highly reliable way to get the true external URL from Netlify edge functions
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const rawBaseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.URL || new URL(request.url).origin);

    const baseUrl = rawBaseUrl.replace(/\/$/, ""); // Remove any trailing slash to avoid double slashes
    const redirectUri = `${baseUrl}/api/gmail/callback`;

    // Cross-site cookie issues sometimes drop the NextAuth session when returning 
    // from Google. Let's store a secure HttpOnly cookie just for this flow.
    const cookieStore = await cookies();
    cookieStore.set("gmail_oauth_state", session.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutes
        path: "/",
    });

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/gmail.readonly",
        access_type: "offline",
        prompt: "consent", // Force consent to guarantee a refresh token
        state: session.user.id, // Use userId as state for security bridging
    });

    return NextResponse.redirect(`${oauth2Endpoint}?${params.toString()}`);
}
