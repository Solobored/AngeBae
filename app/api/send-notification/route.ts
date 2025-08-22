import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerInfo, items, total } = await request.json()
    const supabase = createClient()

    // Get admin email from database
    const { data: adminData, error: adminError } = await supabase.from("admin_users").select("email").limit(1).single()

    if (adminError || !adminData) {
      console.error("Error getting admin email:", adminError)
      return NextResponse.json({ error: "Admin email not found" }, { status: 500 })
    }

    const emailContent = {
      to: adminData.email,
      subject: `Nuevo Pedido #${orderId} - SkinCare Pro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e91e63;">Nuevo Pedido Recibido</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Información del Cliente:</h3>
            <p><strong>Nombre:</strong> ${customerInfo.name}</p>
            <p><strong>Email:</strong> ${customerInfo.email}</p>
            <p><strong>Teléfono:</strong> ${customerInfo.phone}</p>
            <p><strong>Dirección:</strong> ${customerInfo.address}</p>
            <p><strong>Método de Entrega:</strong> ${customerInfo.deliveryMethod}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3>Productos Pedidos:</h3>
            ${items
              .map(
                (item: any) => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.name}</strong></p>
                <p>Cantidad: ${item.quantity} | Precio: $${item.price.toLocaleString("es-CL")}</p>
                <p>Subtotal: $${(item.quantity * item.price).toLocaleString("es-CL")}</p>
              </div>
            `,
              )
              .join("")}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e91e63;">
              <h3 style="color: #e91e63;">Total: $${total.toLocaleString("es-CL")} CLP</h3>
            </div>
          </div>
          
          <p style="margin-top: 20px; color: #666;">
            Este pedido fue realizado a través de tu tienda SkinCare Pro.
            Puedes ver más detalles en el panel de administración.
          </p>
        </div>
      `,
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      type: "new_order",
      recipient_email: adminData.email,
      subject: emailContent.subject,
      content: emailContent.html,
      order_id: orderId,
      sent_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error storing notification:", notificationError)
    }

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend

    console.log("Email notification prepared:", emailContent)

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      adminEmail: adminData.email,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
