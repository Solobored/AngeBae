import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { querySingle } from "@/lib/db"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MercadoPago sends different types of notifications
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Get payment details from MercadoPago
      const paymentInfo = await payment.get({ id: paymentId })

      if (paymentInfo) {
        const orderId = paymentInfo.external_reference
        const status = paymentInfo.status

        if (orderId && isUuid(String(orderId))) {
          let nextOrderStatus = "pending"
          switch (status) {
            case "approved":
              nextOrderStatus = "processing"
              break
            case "rejected":
            case "cancelled":
              nextOrderStatus = "cancelled"
              break
            case "pending":
            case "in_process":
            default:
              nextOrderStatus = "pending"
              break
          }

          const updated = await querySingle<{ id: string }>(
            `UPDATE orders
             SET status = $1,
                 payment_id = $2,
                 payment_method = 'mercadopago',
                 updated_at = NOW()
             WHERE id = $3::uuid
             RETURNING id::text AS id`,
            [nextOrderStatus, String(paymentId), String(orderId)],
          )

          if (!updated) {
            console.warn(`Webhook received but order not found: ${orderId}`)
          } else {
            console.log(`Order ${orderId} updated to ${nextOrderStatus}`)
          }
        } else if (orderId) {
          console.warn(`Ignoring webhook with non-UUID external_reference: ${orderId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
