import { NextRequest, NextResponse } from "next/server"
import { type PoolClient } from "pg"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool, querySingle } from "@/lib/db"

interface ProductRow {
  id: string
  name: string
  description: string | null
  category_id: string | null
  image_url: string | null
  is_flash_sale: boolean
  is_best_seller: boolean
  is_active: boolean
  provider_id?: string | null
  provider_slug?: string | null
  provider_name?: string | null
  created_at: string
  updated_at: string
  price: number
  original_price: number | null
  stock: number
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : NaN
}

function toInt(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : NaN
}

function mapProduct(row: ProductRow) {
  return {
    ...row,
    provider_id: row.provider_id ?? null,
    provider_slug: row.provider_slug ?? null,
    provider_name: row.provider_name ?? null,
    slug: slugify(row.name),
  }
}

async function getProductById(productId: string, client?: PoolClient) {
  const sql = `SELECT
      p.id::text AS id,
      p.title AS name,
      p.description,
      p.category_id::text AS category_id,
      p.main_image_url AS image_url,
      p.is_flash_sale,
      p.is_best_seller,
      p.active AS is_active,
      p.provider_id::text AS provider_id,
      pr.slug AS provider_slug,
      pr.name AS provider_name,
      p.created_at,
      p.updated_at,
      COALESCE(v.price_numeric, 0)::float8 AS price,
      v.original_price_numeric::float8 AS original_price,
      COALESCE(v.stock_int, 0)::int AS stock
    FROM products p
    LEFT JOIN providers pr ON pr.id = p.provider_id
    LEFT JOIN LATERAL (
      SELECT id, price_numeric, original_price_numeric, stock_int
      FROM product_variants
      WHERE product_id = p.id AND active = true
      ORDER BY created_at ASC
      LIMIT 1
    ) v ON true
    WHERE p.id = $1::uuid`

  if (client) {
    const result = await client.query<ProductRow>(sql, [productId])
    return result.rows[0] ? mapProduct(result.rows[0]) : null
  }

  const row = await querySingle<ProductRow>(sql, [productId])
  return row ? mapProduct(row) : null
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const product = await getProductById(id)
    if (!product || !product.is_active) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const { id } = await context.params
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const body = await request.json()
    const currentProduct = await getProductById(id, client)
    if (!currentProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const nextName = body.name ?? currentProduct.name
    const nextDescription = body.description ?? currentProduct.description
    const nextCategoryId =
      body.category_id === ""
        ? null
        : body.category_id !== undefined
          ? body.category_id
          : currentProduct.category_id
    const nextIsFlashSale =
      body.is_flash_sale === undefined ? currentProduct.is_flash_sale : Boolean(body.is_flash_sale)
    const nextIsBestSeller =
      body.is_best_seller === undefined ? currentProduct.is_best_seller : Boolean(body.is_best_seller)
    const nextPrice = body.price === undefined ? currentProduct.price : toNumber(body.price)
    const nextOriginalPrice =
      body.original_price === undefined || body.original_price === ""
        ? currentProduct.original_price
        : toNumber(body.original_price)
    const nextStock = body.stock === undefined ? currentProduct.stock : toInt(body.stock)

    if (!nextName) {
      return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 })
    }

    if (!Number.isFinite(nextPrice) || !Number.isFinite(nextStock)) {
      return NextResponse.json({ error: "Precio y stock deben ser válidos" }, { status: 400 })
    }

    if (nextOriginalPrice !== null && !Number.isFinite(nextOriginalPrice)) {
      return NextResponse.json({ error: "Precio original inválido" }, { status: 400 })
    }

    if (nextCategoryId && !isUuid(nextCategoryId)) {
      return NextResponse.json({ error: "ID de categoría inválido" }, { status: 400 })
    }

    await client.query("BEGIN")

    await client.query(
      `UPDATE products
       SET title = $1,
           description = $2,
           category_id = $3::uuid,
           is_flash_sale = $4,
           is_best_seller = $5,
           updated_at = NOW()
       WHERE id = $6::uuid`,
      [nextName, nextDescription ?? null, nextCategoryId, nextIsFlashSale, nextIsBestSeller, id],
    )

    const existingVariant = await client.query<{ id: string }>(
      `SELECT id::text AS id
       FROM product_variants
       WHERE product_id = $1::uuid AND active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [id],
    )

    if (existingVariant.rows[0]) {
      await client.query(
        `UPDATE product_variants
         SET price_numeric = $1,
             original_price_numeric = $2,
             stock_int = $3,
             updated_at = NOW()
         WHERE id = $4::uuid`,
        [nextPrice, nextOriginalPrice, nextStock, existingVariant.rows[0].id],
      )
    } else {
      await client.query(
        `INSERT INTO product_variants (
           product_id,
           price_numeric,
           original_price_numeric,
           stock_int,
           active,
           created_at,
           updated_at
         )
         VALUES ($1::uuid, $2, $3, $4, true, NOW(), NOW())`,
        [id, nextPrice, nextOriginalPrice, nextStock],
      )
    }

    await client.query("COMMIT")

    const updatedProduct = await getProductById(id)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  } finally {
    client.release()
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
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const pool = getPool()
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const productResult = await client.query<{ id: string }>(
        `UPDATE products
         SET active = false,
             updated_at = NOW()
         WHERE id = $1::uuid
         RETURNING id::text AS id`,
        [id],
      )

      if (!productResult.rows[0]) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
      }

      await client.query(
        `UPDATE product_variants
         SET active = false,
             updated_at = NOW()
         WHERE product_id = $1::uuid`,
        [id],
      )

      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
