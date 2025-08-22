import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, original_price, category_id, stock, is_flash_sale, is_best_seller } = body

    // Generar slug único
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        slug: `${slug}-${Date.now()}`,
        description,
        price: Number.parseFloat(price),
        original_price: original_price ? Number.parseFloat(original_price) : null,
        category_id: category_id ? Number.parseInt(category_id) : null,
        stock: Number.parseInt(stock),
        is_flash_sale: Boolean(is_flash_sale),
        is_best_seller: Boolean(is_best_seller),
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
