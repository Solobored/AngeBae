import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keepProductId, removeProductIds } = body

    if (!keepProductId || !removeProductIds || !Array.isArray(removeProductIds)) {
      return NextResponse.json({ error: "IDs de productos requeridos" }, { status: 400 })
    }

    // Obtener información del producto que se mantendrá
    const { data: keepProduct, error: keepError } = await supabase
      .from("products")
      .select("*")
      .eq("id", keepProductId)
      .single()

    if (keepError || !keepProduct) {
      return NextResponse.json({ error: "Producto principal no encontrado" }, { status: 404 })
    }

    // Obtener información de los productos que se eliminarán
    const { data: removeProducts, error: removeError } = await supabase
      .from("products")
      .select("*")
      .in("id", removeProductIds)

    if (removeError) {
      return NextResponse.json({ error: "Error al obtener productos a eliminar" }, { status: 500 })
    }

    // Combinar información relevante (stock, descripciones, etc.)
    let combinedStock = keepProduct.stock || 0
    let combinedDescription = keepProduct.description || ""

    for (const product of removeProducts || []) {
      // Sumar stock
      combinedStock += product.stock || 0

      // Combinar descripciones si son diferentes
      if (product.description && product.description !== combinedDescription) {
        if (combinedDescription && !combinedDescription.includes(product.description)) {
          combinedDescription += `\n\n${product.description}`
        } else if (!combinedDescription) {
          combinedDescription = product.description
        }
      }
    }

    // Actualizar el producto principal con la información combinada
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock: combinedStock,
        description: combinedDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", keepProductId)

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar producto principal" }, { status: 500 })
    }

    // Marcar productos duplicados como inactivos en lugar de eliminarlos
    const { error: deactivateError } = await supabase
      .from("products")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", removeProductIds)

    if (deactivateError) {
      return NextResponse.json({ error: "Error al desactivar productos duplicados" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Productos fusionados exitosamente. Stock combinado: ${combinedStock}`,
      mergedProduct: {
        id: keepProductId,
        name: keepProduct.name,
        stock: combinedStock,
        description: combinedDescription,
      },
      removedCount: removeProductIds.length,
    })
  } catch (error) {
    console.error("Error merging products:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
