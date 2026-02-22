import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { query, querySingle } from "@/lib/db"

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const categories = await query<CategoryRow>(
      `SELECT
         id::text AS id,
         name,
         slug,
         description,
         active AS is_active,
         created_at,
         updated_at
       FROM categories
       ORDER BY name ASC`,
    )

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, is_active = true } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug son requeridos" }, { status: 400 })
    }

    const existing = await querySingle<{ id: string }>("SELECT id::text AS id FROM categories WHERE slug = $1", [slug])
    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 409 })
    }

    const category = await querySingle<CategoryRow>(
      `INSERT INTO categories (name, slug, description, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING
         id::text AS id,
         name,
         slug,
         description,
         active AS is_active,
         created_at,
         updated_at`,
      [name, slug, description || null, Boolean(is_active)],
    )

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}
