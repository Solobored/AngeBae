import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { querySingle } from "@/lib/db"

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

async function fetchOffer(id: string) {
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
    [id],
  )

  return offer ? mapOffer(offer) : null
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de oferta inválido" }, { status: 400 })
    }

    const offer = await fetchOffer(id)
    if (!offer) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error("Error fetching offer:", error)
    return NextResponse.json({ error: "Error al obtener oferta" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de oferta inválido" }, { status: 400 })
    }

    const body = await request.json()
    const current = await fetchOffer(id)
    if (!current) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    const nextOfferPrice = body.offer_price === undefined ? current.offer_price : toNumber(body.offer_price)
    const nextStartDate = body.start_date ?? current.start_date
    const nextEndDate = body.end_date ?? current.end_date
    const nextIsActive = body.is_active === undefined ? current.is_active : Boolean(body.is_active)
    const nextPosition = body.position === undefined ? current.position : Number(body.position)

    if (!Number.isFinite(nextOfferPrice) || nextOfferPrice < 0) {
      return NextResponse.json({ error: "Precio de oferta inválido" }, { status: 400 })
    }

    const updatedRow = await querySingle<{ id: string }>(
      `UPDATE offers
       SET offer_price = $1,
           start_date = $2::timestamp,
           end_date = $3::timestamp,
           is_active = $4,
           position = $5,
           updated_at = NOW()
       WHERE id = $6::uuid
       RETURNING id::text AS id`,
      [nextOfferPrice, nextStartDate, nextEndDate, nextIsActive, Number.isFinite(nextPosition) ? nextPosition : 1, id],
    )

    if (!updatedRow) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    const updated = await fetchOffer(id)
    return NextResponse.json({ offer: updated })
  } catch (error) {
    console.error("Error updating offer:", error)
    return NextResponse.json({ error: "Error al actualizar oferta" }, { status: 500 })
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
      return NextResponse.json({ error: "ID de oferta inválido" }, { status: 400 })
    }

    const deleted = await querySingle<{ id: string }>(
      "DELETE FROM offers WHERE id = $1::uuid RETURNING id::text AS id",
      [id],
    )

    if (!deleted) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting offer:", error)
    return NextResponse.json({ error: "Error al eliminar oferta" }, { status: 500 })
  }
}
