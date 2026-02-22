import { NextRequest, NextResponse } from "next/server"
import { type PoolClient } from "pg"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool, query, querySingle } from "@/lib/db"

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

export async function GET(request: NextRequest) {
  try {
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true"
    const providerFilter = request.nextUrl.searchParams.get("providerId")

    const conditions: string[] = []
    const params: unknown[] = []

    if (!includeInactive) {
      conditions.push("p.active = true")
    }
    if (providerFilter) {
      conditions.push(`p.provider_id = $${params.length + 1}`)
      params.push(providerFilter)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const products = await query<ProductRow>(
      `SELECT
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
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params,
    )

    const mapped = products.map((row) => ({
      ...mapProduct(row),
      provider_id: (row as any).provider_id ?? null,
      provider_slug: (row as any).provider_slug ?? null,
      provider_name: (row as any).provider_name ?? null,
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
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
    const { name, description, price, original_price, category_id, stock, is_flash_sale, is_best_seller } = body

    if (!name) {
      return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 })
    }

    const parsedPrice = toNumber(price)
    const parsedOriginalPrice =
      original_price === undefined || original_price === null || original_price === ""
        ? null
        : toNumber(original_price)
    const parsedStock = toInt(stock)

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) {
      return NextResponse.json({ error: "Precio y stock deben ser valores válidos" }, { status: 400 })
    }

    if (parsedOriginalPrice !== null && !Number.isFinite(parsedOriginalPrice)) {
      return NextResponse.json({ error: "Precio original inválido" }, { status: 400 })
    }

    if (category_id && !isUuid(category_id)) {
      return NextResponse.json({ error: "ID de categoría inválido" }, { status: 400 })
    }

    await client.query("BEGIN")

    const productResult = await client.query<{ id: string }>(
      `INSERT INTO products (
         title,
         description,
         category_id,
         is_flash_sale,
         is_best_seller,
         active,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3::uuid, $4, $5, true, NOW(), NOW())
       RETURNING id::text AS id`,
      [name, description || null, category_id || null, Boolean(is_flash_sale), Boolean(is_best_seller)],
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
       VALUES ($1::uuid, $2, $3, $4, true, NOW(), NOW())`,
      [productId, parsedPrice, parsedOriginalPrice, parsedStock],
    )

    await client.query("COMMIT")

    const product = await getProductById(productId)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  } finally {
    client.release()
  }
}
