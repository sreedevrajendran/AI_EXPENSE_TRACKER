import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/firebase/admin";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }
        const currentUserId = session.user.id;

        const resolvedParams = await context.params;
        const id = resolvedParams.id;
        if (!id) {
            return new Response("Not found", { status: 404 });
        }

        const doc = await db.collection("receipt_files").doc(id).get();
        if (!doc.exists) {
            return new Response("Receipt not found", { status: 404 });
        }

        const receipt = doc.data();
        if (!receipt || !receipt.data) {
            return new Response("Corrupted receipt data", { status: 500 });
        }

        // Enforce strict ownership: user can only view their own receipts
        if (receipt.userId && receipt.userId !== currentUserId) {
            return new Response("Forbidden: You do not have permission to view this file", { status: 403 });
        }

        const buffer = Buffer.from(receipt.data, "base64");

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": receipt.mimeType || "image/webp",
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
        });
    } catch (error: any) {
        console.error("Error serving receipt:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
