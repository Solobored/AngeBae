import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { products, resultId } = await request.json()

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Productos requeridos" }, { status: 400 })
    }

    let imported = 0
    const errors = []

    for (const product of products) {
      try {
        // Skip duplicates
        if (product.duplicate) {
          continue
        }

        // Find or create category
        let categoryId = null
        if (product.category && product.category !== "general") {
          const { data: existingCategory } = await supabase
            .from("categories")
            .select("id")
            .eq("name", product.category)
            .single()

          if (existingCategory) {
            categoryId = existingCategory.id
          } else {
            // Create new category
            const { data: newCategory } = await supabase
              .from("categories")
              .insert({ name: product.category, slug: product.category.toLowerCase().replace(/\s+/g, "-") })
              .select("id")
              .single()

            if (newCategory) {
              categoryId = newCategory.id
            }
          }
        }

        // Generate slug
        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim()

        // Insert product
        const { error } = await supabase.from("products").insert({
          name: product.name,
          slug: `${slug}-${Date.now()}`,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          category_id: categoryId,
          stock: 10, // Default stock
          is_flash_sale: false,
          is_best_seller: false,
          is_active: true,
          imported_from_pdf: true,
          pdf_confidence: product.confidence,
        })

        if (error) {
          errors.push(`Error importing ${product.name}: ${error.message}`)
        } else {
          imported++
        }
      } catch (error) {
        errors.push(`Error importing ${product.name}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: products.length,
    })
  } catch (error) {
    console.error("Error importing products:", error)
    return NextResponse.json({ error: "Error al importar productos" }, { status: 500 })
  }
}
