import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest, getProviderSessionFromRequest, isProvidersFeatureEnabled } from "@/lib/auth"
import { querySingle } from "@/lib/db"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const jobId = params.id

  const job = await querySingle<{
    id: string
    source_media_id: string
    status: string
    result: unknown
    error_message: string | null
    created_at: string
    updated_at: string
    provider_id: string | null
  }>(
    `SELECT id::text, source_media_id::text, status, result, error_message, created_at, updated_at, provider_id::text
     FROM ocr_jobs
     WHERE id = $1`,
    [jobId],
  )

  if (!job) {
    return NextResponse.json({ error: "Job no encontrado" }, { status: 404 })
  }

  const admin = await getAdminSessionFromRequest(_request)
  const providerSession = await getProviderSessionFromRequest(_request)
  if (!admin) {
    if (!providerSession || (job.provider_id && providerSession.providerId !== job.provider_id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.json(job)
}
