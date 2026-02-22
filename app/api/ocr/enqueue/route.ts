/**
 * POST /api/ocr/enqueue
 * Enqueue a media file for OCR processing
 * 
 * Request body:
 *  - mediaId: UUID of the media file
 */

import { NextRequest, NextResponse } from "next/server";
import { insert, querySingle } from "@/lib/db";
import { enqueueOCRJob } from "@/lib/jobs";
import { getPresignedUrl } from "@/lib/minio";
import { v4 as uuidv4 } from "uuid";
import { getAdminSessionFromRequest, getProviderSessionFromRequest, isProvidersFeatureEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request);
    const providerSession = await getProviderSessionFromRequest(request);

    if (!admin && !providerSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProvidersFeatureEnabled() && providerSession) {
      return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 });
    }

    const body = await request.json();
    const { mediaId, provider_id: providerFromBody } = body;

    let providerId: string | null = null;
    if (providerSession) {
      providerId = providerSession.providerId;
    } else if (admin && providerFromBody) {
      providerId = providerFromBody;
    }

    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    // Check if media exists
    const media = await querySingle(
      "SELECT id, type, minio_key, provider_id FROM media WHERE id = $1",
      [mediaId]
    );

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.type !== "pdf") {
      return NextResponse.json(
        { error: "Only PDF files can be processed with OCR" },
        { status: 400 }
      );
    }

    if (providerId && media.provider_id && providerId !== String(media.provider_id)) {
      return NextResponse.json({ error: "Media pertenece a otro proveedor" }, { status: 403 });
    }

    // Create OCR job record
    const ocrJobId = uuidv4();
    const ocrJob = await insert("ocr_jobs", {
      id: ocrJobId,
      source_media_id: mediaId,
      provider_id: providerId,
      status: "pending",
      created_at: new Date(),
    });

    // Get presigned URL for the file
    const bucket = process.env.MINIO_BUCKET || "angebae-media";
    const fileUrl = await getPresignedUrl(bucket, media.minio_key, 3600);

    // Enqueue job to Redis/Celery (Bull fallback)
    const job = await enqueueOCRJob(mediaId, ocrJobId, fileUrl, "pdf", providerId || undefined);

    return NextResponse.json(
      {
        success: true,
        ocrJob: {
          id: ocrJobId,
          status: "pending",
          mediaId,
          jobQueueId: job?.id,
          createdAt: new Date(),
          providerId: providerId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("OCR enqueue error:", err);
    return NextResponse.json(
      { error: "Failed to enqueue OCR job" },
      { status: 500 }
    );
  }
}
