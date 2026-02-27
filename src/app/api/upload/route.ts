import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed" }, { status: 400 });
        }

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        // Upload using UploadThing's UTApi
        const response = await utapi.uploadFiles(file);

        if (response.error) {
            throw new Error(response.error.message);
        }

        return NextResponse.json({
            success: true,
            url: response.data.url
        });

    } catch (error: any) {
        console.error("UploadThing Upload Error:", error);
        return NextResponse.json(
            { error: "Upload failed", details: error.message },
            { status: 500 }
        );
    }
}
