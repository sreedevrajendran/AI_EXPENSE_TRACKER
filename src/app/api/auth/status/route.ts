import { NextResponse } from "next/server";

export async function GET() {
    const isGoogleConfigured = Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_ID.trim().length > 5 &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_SECRET.trim().length > 5
    );

    return NextResponse.json({
        isGoogleConfigured,
    });
}
