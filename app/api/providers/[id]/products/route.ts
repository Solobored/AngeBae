import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest, getProviderSessionFromRequest, isProvidersFeatureEnabled } from "@/lib/auth"
import { getPool, querySingle } from "@/lib/db"

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : NaN
}

function toInt(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : NaN
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isProvidersFeatureEnabled()) {
    return NextResponse.json({ error: "Providers feature disabled" }, { status: 503 })
  }

  const providerId = params.id
  const admin = await getAdminSessionFromRequest(request)
  const providerSession = await getProviderSessionFromRequest(request)

  if (!admin && (!providerSession || providerSession.providerId !== providerId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, original_price, category_id, stock, is_flash_sale, is_best_seller, main_image_url } =
    body

  if (!name) {
    return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 })
  }

  const parsedPrice = toNumber(price)
  const parsedOriginalPrice =
    original_price === undefined || original_price === null || original_price === "" ? null : toNumber(original_price)
  const parsedStock = toInt(stock)

  if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) {
    return NextResponse.json({ error: "Precio y stock deben ser válidos" }, { status: 400 })
  }

  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const productResult = await client.query<{ id: string }>(
      `INSERT INTO products (
         title,
         description,
         category_id,
         is_flash_sale,
         is_best_seller,
         active,
         main_image_url,
         provider_id,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3::uuid, $4, $5, true, $6, $7::uuid, now(), now())
       RETURNING id::text AS id`,
      [name, description || null, category_id || null, Boolean(is_flash_sale), Boolean(is_best_seller), main_image_url || null, providerId],
    )

    const productId = productResult.rows[0]?.id
    if (!productId) {
      throw new Error("Product insert failed")
    }

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
       VALUES ($1::uuid, $2, $3, $4, true, now(), now())`,
      [productId, parsedPrice, parsedOriginalPrice, parsedStock],
    )

    await client.query("COMMIT")

    const product = await querySingle(
      `SELECT p.id::text AS id, p.title, p.description, p.main_image_url, p.is_flash_sale, p.is_best_seller, p.active,
              COALESCE(v.price_numeric, 0)::float8 AS price,
              v.original_price_numeric::float8 AS original_price,
              COALESCE(v.stock_int, 0)::int AS stock
       FROM products p
       LEFT JOIN LATERAL (
         SELECT price_numeric, original_price_numeric, stock_int
         FROM product_variants
         WHERE product_id = p.id AND active = true
         ORDER BY created_at ASC LIMIT 1
       ) v ON true
       WHERE p.id = $1`,
      [productId],
    )

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Provider product create error:", error)
    return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 })
  } finally {
    client.release()
  }
}
