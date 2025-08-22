import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const supabase = createClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_email, customer_phone, customer_address, delivery_method, items, total } = body

    const orderNumber = `ORD-${Date.now()}`

    // Create the order with all customer information
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        delivery_method,
        items: JSON.stringify(items),
        total,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 })
    }

    try {
      const notificationResponse = await fetch(`${request.nextUrl.origin}/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          customerInfo: {
            name: customer_name,
            email: customer_email,
            phone: customer_phone,
            address: customer_address,
            deliveryMethod: delivery_method,
          },
          items,
          total,
        }),
      })

      if (!notificationResponse.ok) {
        console.error("Failed to send notification")
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_price,
          quantity,
          subtotal
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
