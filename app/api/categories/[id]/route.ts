import { type NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { querySingle } from "@/lib/db"

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de categoría inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { name, slug, description, is_active } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug son requeridos" }, { status: 400 })
    }

    const existing = await querySingle<{ id: string }>(
      "SELECT id::text AS id FROM categories WHERE slug = $1 AND id <> $2::uuid",
      [slug, id],
    )

    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 409 })
    }

    const category = await querySingle<CategoryRow>(
      `UPDATE categories
       SET name = $1,
           slug = $2,
           description = $3,
           active = $4,
           updated_at = NOW()
      WHERE id = $5::uuid
       RETURNING
         id::text AS id,
         name,
         slug,
         description,
         active AS is_active,
         created_at,
         updated_at`,
      [name, slug, description || null, Boolean(is_active), id],
    )

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de categoría inválido" }, { status: 400 })
    }

    const categoryUsage = await querySingle<{ product_count: string }>(
      "SELECT COUNT(*)::text AS product_count FROM products WHERE category_id = $1::uuid AND active = true",
      [id],
    )

    const productCount = Number(categoryUsage?.product_count || "0")
    if (productCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene productos asignados" },
        { status: 400 },
      )
    }

    const category = await querySingle<{ id: string }>(
      "UPDATE categories SET active = false, updated_at = NOW() WHERE id = $1::uuid RETURNING id::text AS id",
      [id],
    )

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}
