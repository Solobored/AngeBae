import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { querySingle } from "@/lib/db"

interface OrderRow {
  id: string
  order_number: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  total: number
  order_status: string
  shipping_method: string
  delivery_method: string
  created_at: string
  order_items: unknown
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    const order = await querySingle<OrderRow>(
      `SELECT
         o.id::text AS id,
         o.order_number,
         o.customer_name,
         o.customer_email,
         o.customer_phone,
         o.total_amount::float8 AS total,
         o.status AS order_status,
         COALESCE(o.shipping_address->>'method', o.customer_data->>'shipping_method', 'pickup') AS shipping_method,
         COALESCE(o.shipping_address->>'method', o.customer_data->>'shipping_method', 'pickup') AS delivery_method,
         o.created_at,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', oi.id::text,
                 'product_id', oi.product_id::text,
                 'product_name', oi.product_name,
                 'product_price', oi.unit_price::float8,
                 'quantity', oi.quantity,
                 'subtotal', oi.total_price::float8
               )
             )
             FROM order_items oi
             WHERE oi.order_id = o.id
           ),
           '[]'::json
         ) AS order_items
       FROM orders o
       WHERE o.id = $1::uuid`,
      [id],
    )

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    const body = await request.json()
    const nextStatus = body.order_status || body.status

    if (!nextStatus) {
      return NextResponse.json({ error: "Estado de pedido requerido" }, { status: 400 })
    }

    const order = await querySingle<{ id: string; order_status: string }>(
      `UPDATE orders
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2::uuid
       RETURNING id::text AS id, status AS order_status`,
      [nextStatus, id],
    )

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 })
  }
}
