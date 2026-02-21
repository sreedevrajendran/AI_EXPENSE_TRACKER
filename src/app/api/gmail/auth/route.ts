import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Official Google OAuth 2.0 endpoint
    const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

    // Use the request host to dynamically build the redirect URL
    // This perfectly matches what the browser is using (localhost vs 127.0.0.1)
    const baseUrl = new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/gmail/callback`;

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
