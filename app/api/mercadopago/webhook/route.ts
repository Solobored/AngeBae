import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createClient } from "@supabase/supabase-js"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

        // Update order status in database
        let orderStatus = "pending"
        let paymentStatus = "pending"

        switch (status) {
          case "approved":
            orderStatus = "processing"
            paymentStatus = "paid"
            break
          case "rejected":
            orderStatus = "cancelled"
            paymentStatus = "failed"
            break
          case "pending":
            orderStatus = "pending"
            paymentStatus = "pending"
            break
          case "in_process":
            orderStatus = "pending"
            paymentStatus = "pending"
            break
          case "cancelled":
            orderStatus = "cancelled"
            paymentStatus = "failed"
            break
        }

        // Update order in database
        const { error } = await supabase
          .from("orders")
          .update({
            status: orderStatus,
            payment_status: paymentStatus,
            mercado_pago_id: paymentId.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)

        if (error) {
          console.error("Error updating order:", error)
        }

        console.log(`Order ${orderId} updated: ${orderStatus} - Payment: ${paymentStatus}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
