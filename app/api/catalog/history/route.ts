import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { query } from "@/lib/db"

interface RunRow {
  id: string
  file_id: string
  filename: string
  status: "processing" | "completed" | "error"
  created_at: string
}

interface ProductRow {
  id: string
  run_id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  category: string | null
  confidence: number
  duplicate: boolean
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const runs = await query<RunRow>(
      `SELECT
         id::text AS id,
         file_id,
         filename,
         status,
         created_at
       FROM catalog_processing_runs
       ORDER BY created_at DESC`,
    )

    if (runs.length === 0) {
      return NextResponse.json([])
    }

    const runIds = runs.map((run) => run.id)
    const products = await query<ProductRow>(
      `SELECT
         id::text AS id,
         run_id::text AS run_id,
         name,
         description,
         price::float8 AS price,
         original_price::float8 AS original_price,
         category,
         confidence::float8 AS confidence,
         duplicate
       FROM catalog_processing_products
       WHERE run_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
      [runIds],
    )

    const byRun = new Map<string, ProductRow[]>()
    for (const product of products) {
      const list = byRun.get(product.run_id) || []
      list.push(product)
      byRun.set(product.run_id, list)
    }

    return NextResponse.json(
      runs.map((run) => ({
        id: run.id,
        fileId: run.file_id,
        filename: run.filename,
        status: run.status,
        products: (byRun.get(run.id) || []).map((product) => ({
          name: product.name,
          description: product.description || "",
          price: product.price,
          original_price: product.original_price ?? undefined,
          category: product.category || "general",
          confidence: product.confidence,
          duplicate: product.duplicate,
        })),
        created_at: run.created_at,
      })),
    )
  } catch (error) {
    console.error("Error fetching processing history:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}
