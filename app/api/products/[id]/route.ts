import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, price, original_price, category_id, stock, is_flash_sale, is_best_seller } = body

    const { data: product, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        price: Number.parseFloat(price),
        original_price: original_price ? Number.parseFloat(original_price) : null,
        category_id: category_id ? Number.parseInt(category_id) : null,
        stock: Number.parseInt(stock),
        is_flash_sale: Boolean(is_flash_sale),
        is_best_seller: Boolean(is_best_seller),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", params.id)

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
