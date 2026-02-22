import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { query } from "@/lib/db"

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productIds, categoryId } = body as { productIds: string[]; categoryId?: string | null }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "IDs de productos requeridos" }, { status: 400 })
    }

    const invalidIds = productIds.filter((id) => !isUuid(id))
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: "Uno o más IDs de producto son inválidos" }, { status: 400 })
    }

    if (categoryId && !isUuid(categoryId)) {
      return NextResponse.json({ error: "ID de categoría inválido" }, { status: 400 })
    }

    const updatedProducts = await query<{ id: string }>(
      `UPDATE products
       SET category_id = $1::uuid,
           updated_at = NOW()
       WHERE id = ANY($2::uuid[]) AND active = true
       RETURNING id::text AS id`,
      [categoryId || null, productIds],
    )

    return NextResponse.json({
      success: true,
      updated: updatedProducts.length,
      products: updatedProducts,
    })
  } catch (error) {
    console.error("Error moving products:", error)
    return NextResponse.json({ error: "Error al mover productos" }, { status: 500 })
  }
}
