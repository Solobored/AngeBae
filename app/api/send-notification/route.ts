import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

type OrderItem = { name: string; quantity: number; price: number };
type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  deliveryMethod: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { orderId, customerInfo, items, total } = (await request.json()) as {
      orderId: string;
      customerInfo: CustomerInfo;
      items: OrderItem[];
      total: number;
    };

    if (!orderId || !customerInfo || !items || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch admin email
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("email")
      .limit(1)
      .single();

    if (adminError || !adminData) {
      console.error("Error getting admin email:", adminError);
      return NextResponse.json({ error: "Admin email not found" }, { status: 500 });
    }

    // Build email HTML
    const emailHtml = `
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
              (item) => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${item.name}</strong></p>
              <p>Cantidad: ${item.quantity} | Precio: $${item.price.toLocaleString("es-CL")}</p>
              <p>Subtotal: $${(item.quantity * item.price).toLocaleString("es-CL")}</p>
            </div>
          `
            )
            .join("")}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e91e63;">
            <h3 style="color: #e91e63;">Total: $${total.toLocaleString("es-CL")} CLP</h3>
          </div>
        </div>
        <p style="margin-top: 20px; color: #666;">
          Este pedido fue realizado a través de tu tienda SkinCare Pro.
        </p>
      </div>
    `;

    const emailSubject = `Nuevo Pedido #${orderId} - SkinCare Pro`;

    // Store notification in Supabase
    try {
      const { error: notificationError } = await supabase.from("notifications").insert({
        type: "new_order",
        recipient_email: adminData.email,
        subject: emailSubject,
        content: emailHtml,
        order_id: orderId,
        sent_at: new Date().toISOString(),
      });

      if (notificationError) {
        console.error("Error storing notification:", notificationError);
      }
    } catch (err) {
      console.error("Supabase insert failed:", err);
    }

    // Send email via SendGrid
    try {
      await sgMail.send({
        to: adminData.email,
        from: process.env.SENDGRID_SENDER_EMAIL!, // Verified sender
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Email sent successfully to admin:", adminData.email);
    } catch (err) {
      console.error("SendGrid error:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Notification stored and email sent",
      adminEmail: adminData.email,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
