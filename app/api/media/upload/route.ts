/**
 * POST /api/media/upload
 * Upload media files (images, PDFs, videos) to MinIO
 * 
 * Works with multipart/form-data
 * Required fields:
 *  - file: File
 *  - type: 'image' | 'pdf' | 'video'
 *  - productId (optional): UUID of associated product
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/minio";
import { insert } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_TYPES = ["image", "pdf", "video"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get("admin_auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "image";
    const productId = (formData.get("productId") as string) || null;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = uuidv4().split("-")[0];
    const extension = file.name.split(".").pop() || "bin";
    const objectName = `${type}s/${timestamp}-${randomId}.${extension}`;

    // Upload to MinIO
    const bucket = process.env.MINIO_BUCKET || "angebae-media";
    const uploadResult = await uploadFile(bucket, objectName, fileBuffer, {
      "Content-Type": file.type,
      "Original-Name": file.name,
    });

    // Create media record in database
    const mediaId = uuidv4();
    const media = await insert("media", {
      id: mediaId,
      type,
      url: `/api/media/${mediaId}`,
      minio_key: objectName,
      file_size: file.size,
      mime_type: file.type,
      product_id: productId,
      metadata: {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        media: {
          id: mediaId,
          type,
          url: `/api/media/${mediaId}`,
          minioKey: objectName,
          fileSize: file.size,
          mimeType: file.type,
          productId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
