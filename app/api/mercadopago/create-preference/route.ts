import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
})

const preference = new Preference(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, items, payer, back_urls } = body

    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id.toString(),
        title: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "CLP", // Chilean Peso
      })),
      payer: {
        name: payer?.name || "Cliente",
        email: payer?.email || "cliente@example.com",
        phone: payer?.phone
          ? {
              area_code: "56",
              number: payer.phone,
            }
          : undefined,
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/checkout/success?orderId=${orderId}`,
        failure: `${process.env.NEXTAUTH_URL}/checkout/failure?orderId=${orderId}`,
        pending: `${process.env.NEXTAUTH_URL}/checkout/pending?orderId=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId.toString(),
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
      statement_descriptor: "SKINCARE PRO",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    const result = await preference.create({ body: preferenceData })

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    })
  } catch (error) {
    console.error("Error creating MercadoPago preference:", error)
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  try {
    // Get order from database
    const orderResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/orders/${orderId}`)

    if (!orderResponse.ok) {
      throw new Error("Order not found")
    }

    const order = await orderResponse.json()

    const preferenceData = {
      items: order.order_items.map((item: any) => ({
        id: item.product_id.toString(),
        title: item.product_name,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.product_price,
        currency_id: "CLP",
      })),
      payer: {
        name: "Cliente",
        email: order.customer_email || "cliente@example.com",
        phone: order.customer_phone
          ? {
              area_code: "56",
              number: order.customer_phone,
            }
          : undefined,
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/checkout/success?orderId=${orderId}`,
        failure: `${process.env.NEXTAUTH_URL}/checkout/failure?orderId=${orderId}`,
        pending: `${process.env.NEXTAUTH_URL}/checkout/pending?orderId=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId.toString(),
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
    }

    const result = await preference.create({ body: preferenceData })

    // Redirect to MercadoPago
    return NextResponse.redirect(result.sandbox_init_point || result.init_point!)
  } catch (error) {
    console.error("Error creating MercadoPago preference:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/checkout/failure?orderId=${orderId}`)
  }
}
