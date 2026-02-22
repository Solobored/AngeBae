import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/auth"
import { getPool } from "@/lib/db"

interface OrderListRow {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  total: number
  order_status: string
  delivery_method: string
  created_at: string
  order_items: unknown
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

function generateOrderNumber(): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSessionFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = getPool()
    const result = await pool.query<OrderListRow>(
      `SELECT
         o.id::text AS id,
         o.customer_name,
         o.customer_email,
         o.customer_phone,
         o.total_amount::float8 AS total,
         o.status AS order_status,
         COALESCE(o.shipping_address->>'method', o.customer_data->>'shipping_method', 'pickup') AS delivery_method,
         o.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', oi.id::text,
               'product_id', oi.product_id::text,
               'product_name', oi.product_name,
               'product_price', oi.unit_price::float8,
               'quantity', oi.quantity,
               'subtotal', oi.total_price::float8
             )
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS order_items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const body = await request.json()
    const {
      customer_name,
      customer_rut,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_region,
      shipping_comuna,
      contact_method,
      shipping_method,
      shipping_cost,
      subtotal,
      total,
      items,
    } = body

    if (!customer_name || !customer_email || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Datos del pedido incompletos" }, { status: 400 })
    }

    const totalAmount = toNumber(total)
    const parsedShippingCost = toNumber(shipping_cost ?? 0)
    const parsedSubtotal = toNumber(subtotal ?? totalAmount)

    if (!Number.isFinite(totalAmount)) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()
    const shippingData = {
      address: shipping_address || null,
      region: shipping_region || null,
      comuna: shipping_comuna || null,
      method: shipping_method || "pickup",
    }

    const customerData = {
      rut: customer_rut || null,
      contact_method: contact_method || "email",
      shipping_method: shipping_method || "pickup",
      shipping_cost: Number.isFinite(parsedShippingCost) ? parsedShippingCost : 0,
      subtotal: Number.isFinite(parsedSubtotal) ? parsedSubtotal : totalAmount,
    }

    await client.query("BEGIN")

    const orderResult = await client.query<{ id: string; order_number: string; created_at: string }>(
      `INSERT INTO orders (
         order_number,
         customer_email,
         customer_name,
         customer_phone,
         customer_data,
         total_amount,
         status,
         shipping_address,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'pending', $7::jsonb, NOW(), NOW())
       RETURNING id::text AS id, order_number, created_at`,
      [
        orderNumber,
        customer_email,
        customer_name,
        customer_phone || null,
        JSON.stringify(customerData),
        totalAmount,
        JSON.stringify(shippingData),
      ],
    )

    const order = orderResult.rows[0]

    for (const item of items as Array<Record<string, unknown>>) {
      const quantity = toInt(item.quantity)
      const unitPrice = toNumber(item.price)

      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
        continue
      }

      const rawId = typeof item.id === "string" ? item.id : String(item.id ?? "")
      const productId = isUuid(rawId) ? rawId : null
      const productName = typeof item.name === "string" ? item.name : "Producto"
      const subtotalPrice = quantity * unitPrice

      await client.query(
        `INSERT INTO order_items (
           order_id,
           product_id,
           quantity,
           unit_price,
           total_price,
           product_name,
           created_at
         )
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())`,
        [order.id, productId, quantity, unitPrice, subtotalPrice, productName],
      )
    }

    await client.query("COMMIT")

    return NextResponse.json(
      {
        id: order.id,
        order_number: order.order_number,
        total: totalAmount,
        order_status: "pending",
        shipping_method: shippingData.method,
        created_at: order.created_at,
      },
      { status: 201 },
    )
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 })
  } finally {
    client.release()
  }
}
