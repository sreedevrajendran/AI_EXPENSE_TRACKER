import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/firebase/admin";
import sharp from "sharp";

export const maxDuration = 60; // Allow sufficient processing time

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "guest-user";

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/heic", "application/pdf"];
        if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Invalid file type. Only images and PDF files are allowed." },
                { status: 400 }
            );
        }

        // Limit size to 15MB
        if (file.size > 15 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let finalBuffer: any = buffer;
        let mimeType = file.type || "image/jpeg";

        // Optimize image with sharp
        if (file.type.startsWith("image/") || file.name.match(/\.(jpe?g|png|webp|heic)$/i)) {
            try {
                finalBuffer = await sharp(buffer)
                    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
                mimeType = "image/webp";
            } catch (sharpError) {
                console.warn("Sharp optimization failed, using original buffer:", sharpError);
            }
        }

        // Save to Firestore receipt_files collection
        const base64Data = finalBuffer.toString("base64");
        const docRef = await db.collection("receipt_files").add({
            userId,
            fileName: file.name || "receipt.webp",
            mimeType,
            data: base64Data,
            size: finalBuffer.length,
            createdAt: new Date().toISOString(),
        });

        const receiptUrl = `/api/receipts/${docRef.id}`;

        return NextResponse.json({
            success: true,
            url: receiptUrl,
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to upload file. Please try again." },
            { status: 500 }
        );
    }
}
