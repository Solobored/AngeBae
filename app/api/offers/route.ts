import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { querySingle, query } from "@/lib/db"

interface OfferRow {
  id: string
  product_id: string
  product_name: string
  product_description: string | null
  product_image: string | null
  original_price: number | null
  offer_price: number
  start_date: string
  end_date: string
  is_active: boolean
  position: number
  created_at: string
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : NaN
}

function mapOffer(row: OfferRow) {
  const originalPrice = row.original_price ?? row.offer_price
  const discountPercentage =
    originalPrice > 0 ? Math.max(0, Math.round(((originalPrice - row.offer_price) / originalPrice) * 100)) : 0

  return {
    ...row,
    product_image: row.product_image || "/placeholder.svg?height=200&width=300",
    product_description: row.product_description || "",
    original_price: originalPrice,
    discount_percentage: discountPercentage,
  }
}

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get("active") === "true"
    const nowFilter = activeOnly ? "AND o.is_active = true AND o.start_date <= NOW() AND o.end_date >= NOW()" : ""

    const offers = await query<OfferRow>(
      `SELECT
         o.id::text AS id,
         o.product_id::text AS product_id,
         p.title AS product_name,
         p.description AS product_description,
         p.main_image_url AS product_image,
         COALESCE(v.original_price_numeric, v.price_numeric, o.offer_price)::float8 AS original_price,
         o.offer_price::float8 AS offer_price,
         o.start_date,
         o.end_date,
         o.is_active,
         o.position,
         o.created_at
       FROM offers o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN LATERAL (
         SELECT price_numeric, original_price_numeric
         FROM product_variants
         WHERE product_id = p.id AND active = true
         ORDER BY created_at ASC
         LIMIT 1
       ) v ON true
       WHERE p.active = true
       ${nowFilter}
       ORDER BY o.position ASC, o.created_at DESC`,
    )

    return NextResponse.json({ offers: offers.map(mapOffer) })
  } catch (error) {
    console.error("Error fetching offers:", error)
    return NextResponse.json({ error: "Error al obtener ofertas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, offer_price, start_date, end_date, is_active = true, position = 1 } = body

    if (!product_id || !offer_price || !start_date || !end_date) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    if (!isUuid(product_id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const parsedPrice = toNumber(offer_price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Precio de oferta inválido" }, { status: 400 })
    }

    const created = await querySingle<{ id: string }>(
      `INSERT INTO offers (
         product_id,
         offer_price,
         start_date,
         end_date,
         is_active,
         position,
         created_at,
         updated_at
       )
       VALUES ($1::uuid, $2, $3::timestamp, $4::timestamp, $5, $6, NOW(), NOW())
       RETURNING id::text AS id`,
      [product_id, parsedPrice, start_date, end_date, Boolean(is_active), Number(position) || 1],
    )

    if (!created) {
      throw new Error("Offer creation failed")
    }

    const offer = await querySingle<OfferRow>(
      `SELECT
         o.id::text AS id,
         o.product_id::text AS product_id,
         p.title AS product_name,
         p.description AS product_description,
         p.main_image_url AS product_image,
         COALESCE(v.original_price_numeric, v.price_numeric, o.offer_price)::float8 AS original_price,
         o.offer_price::float8 AS offer_price,
         o.start_date,
         o.end_date,
         o.is_active,
         o.position,
         o.created_at
       FROM offers o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN LATERAL (
         SELECT price_numeric, original_price_numeric
         FROM product_variants
         WHERE product_id = p.id AND active = true
         ORDER BY created_at ASC
         LIMIT 1
       ) v ON true
       WHERE o.id = $1::uuid`,
      [created.id],
    )

    return NextResponse.json({ offer: offer ? mapOffer(offer) : null }, { status: 201 })
  } catch (error) {
    console.error("Error creating offer:", error)
    return NextResponse.json({ error: "Error al crear oferta" }, { status: 500 })
  }
}
