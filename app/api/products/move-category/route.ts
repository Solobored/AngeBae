import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, categoryId } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "IDs de productos requeridos" }, { status: 400 })
    }

    // Update products with new category
    const { data: updatedProducts, error } = await supabase
      .from("products")
      .update({
        category_id: categoryId || null,
        updated_at: new Date().toISOString(),
      })
      .in("id", productIds)
      .select()

    if (error) {
      console.error("Error moving products:", error)
      return NextResponse.json({ error: "Error al mover productos" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: updatedProducts?.length || 0,
      products: updatedProducts,
    })
  } catch (error) {
    console.error("Error moving products:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
