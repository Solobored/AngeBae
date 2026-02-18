/**
 * GET /api/ocr/jobs/:id
 * Get OCR job status and results
 */

import { NextRequest, NextResponse } from "next/server";
import { querySingle } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ocrJobId = params.id;

    // Get OCR job details
    const ocrJob = await querySingle(
      `SELECT id, source_media_id, status, result, error_message, 
              confidence_scores, created_at, updated_at, completed_at
       FROM ocr_jobs WHERE id = $1`,
      [ocrJobId]
    );

    if (!ocrJob) {
      return NextResponse.json({ error: "OCR job not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: ocrJob.id,
      mediaId: ocrJob.source_media_id,
      status: ocrJob.status,
      result: ocrJob.result,
      errorMessage: ocrJob.error_message,
      confidenceScores: ocrJob.confidence_scores,
      createdAt: ocrJob.created_at,
      updatedAt: ocrJob.updated_at,
      completedAt: ocrJob.completed_at,
    });
  } catch (err) {
    console.error("Get OCR job error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve OCR job" },
      { status: 500 }
    );
  }
}
