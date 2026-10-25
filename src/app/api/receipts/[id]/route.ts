import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
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

        const buffer = Buffer.from(receipt.data, "base64");

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": receipt.mimeType || "image/webp",
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error: any) {
        console.error("Error serving receipt:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
