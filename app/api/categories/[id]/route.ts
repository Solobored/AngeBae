import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, slug, description, is_active } = body

    const { data: category, error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if category has products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", params.id)
      .eq("is_active", true)

    if (productsError) {
      console.error("Error checking products:", productsError)
      return NextResponse.json({ error: "Error al verificar productos" }, { status: 500 })
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene productos asignados" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", params.id)

    if (error) {
      console.error("Error deleting category:", error)
      return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
