import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest, getProviderSessionFromRequest, isProvidersFeatureEnabled } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const providerId = params.id
  const admin = await getAdminSessionFromRequest(request)
  const providerSession = await getProviderSessionFromRequest(request)

  if (!admin && (!providerSession || providerSession.providerId !== providerId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") || 50)
  const offset = Number(request.nextUrl.searchParams.get("offset") || 0)

  const candidates = await query<{
    id: string
    ocr_job_id: string
    raw_json: unknown
    confidence: number | null
    extracted_title: string | null
    extracted_price: number | null
    extracted_sku: string | null
    created_at: string
    resolved: boolean
  }>(
    `SELECT pc.id::text,
            pc.ocr_job_id::text,
            pc.raw_json,
            pc.confidence::float8,
            pc.extracted_title,
            pc.extracted_price::float8,
            pc.extracted_sku,
            pc.created_at,
            pc.resolved
     FROM product_candidates pc
     LEFT JOIN ocr_jobs oj ON oj.id = pc.ocr_job_id
     WHERE COALESCE(pc.provider_id, oj.provider_id) = $1
     ORDER BY pc.created_at DESC
     LIMIT $2 OFFSET $3`,
    [providerId, limit, offset],
  )

  return NextResponse.json({ items: candidates, count: candidates.length })
}
