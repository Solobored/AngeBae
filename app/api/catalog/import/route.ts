import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool } from "@/lib/db"

interface CatalogProductInput {
  name: string
  description?: string
  price: number
  original_price?: number
  category?: string
  confidence?: number
  duplicate?: boolean
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : NaN
}

export async function POST(request: NextRequest) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { products, resultId } = body as {
      products?: CatalogProductInput[]
      resultId?: string
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Productos requeridos" }, { status: 400 })
    }

    await client.query("BEGIN")

    if (resultId) {
      await client.query(
        "UPDATE catalog_processing_runs SET updated_at = NOW() WHERE id = $1::uuid",
        [resultId],
      )
    }

    let imported = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        if (product.duplicate) {
          continue
        }

        if (!product.name) {
          errors.push("Producto sin nombre omitido")
          continue
        }

        const price = toNumber(product.price)
        const originalPrice =
          product.original_price === undefined || product.original_price === null
            ? null
            : toNumber(product.original_price)

        if (!Number.isFinite(price)) {
          errors.push(`Precio inválido para ${product.name}`)
          continue
        }

        const existingProduct = await client.query<{ id: string }>(
          "SELECT id::text AS id FROM products WHERE LOWER(title) = LOWER($1) AND active = true LIMIT 1",
          [product.name],
        )

        if (existingProduct.rows[0]) {
          continue
        }

        let categoryId: string | null = null
        const categoryName = (product.category || "general").trim()
        if (categoryName) {
          const categorySlug = slugify(categoryName)
          const existingCategory = await client.query<{ id: string }>(
            "SELECT id::text AS id FROM categories WHERE slug = $1 LIMIT 1",
            [categorySlug],
          )

          if (existingCategory.rows[0]) {
            categoryId = existingCategory.rows[0].id
          } else {
            const createdCategory = await client.query<{ id: string }>(
              `INSERT INTO categories (name, slug, active, created_at, updated_at)
               VALUES ($1, $2, true, NOW(), NOW())
               RETURNING id::text AS id`,
              [categoryName, categorySlug],
            )
            categoryId = createdCategory.rows[0]?.id || null
          }
        }

        const createdProduct = await client.query<{ id: string }>(
          `INSERT INTO products (
             title,
             description,
             category_id,
             active,
             is_flash_sale,
             is_best_seller,
             created_at,
             updated_at
           )
           VALUES ($1, $2, $3::uuid, true, false, false, NOW(), NOW())
           RETURNING id::text AS id`,
          [product.name, product.description || null, categoryId],
        )

        const productId = createdProduct.rows[0]?.id
        if (!productId) {
          errors.push(`No se pudo crear producto ${product.name}`)
          continue
        }

        await client.query(
          `INSERT INTO product_variants (
             product_id,
             price_numeric,
             original_price_numeric,
             stock_int,
             active,
             attributes,
             created_at,
             updated_at
           )
           VALUES ($1::uuid, $2, $3, 10, true, $4::jsonb, NOW(), NOW())`,
          [productId, price, originalPrice, JSON.stringify({ imported_from_catalog: true, confidence: product.confidence ?? null })],
        )

        imported += 1
      } catch (error) {
        errors.push(`Error importando ${product.name}: ${String(error)}`)
      }
    }

    await client.query("COMMIT")

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: products.length,
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error importing catalog products:", error)
    return NextResponse.json({ error: "Error al importar productos" }, { status: 500 })
  } finally {
    client.release()
  }
}
