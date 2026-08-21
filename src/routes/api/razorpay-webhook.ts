import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin, supabaseEnabled } from "@/lib/supabase.server";
import { sendOrderConfirmationEmail, sendOwnerOrderNotificationEmail } from "@/lib/admin.server";

function signaturesMatch(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature || "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) return new Response("Webhook not configured", { status: 500 });
        if (!supabaseEnabled()) return new Response("Database not configured", { status: 500 });

        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") || "";
        if (!signaturesMatch(rawBody, signature, webhookSecret)) return new Response("Invalid signature", { status: 401 });

        let payload: any;
        try { payload = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const event = String(payload?.event || "");
        const payment = payload?.payload?.payment?.entity;
        if (!payment?.order_id || !payment?.id) return Response.json({ received: true });

        const client = supabaseAdmin();
        const { data: order, error: orderError } = await client
          .from("orders")
          .select("*")
          .eq("razorpay_order_id", payment.order_id)
          .maybeSingle();
        if (orderError) return new Response("Database error", { status: 500 });
        if (!order) return Response.json({ received: true });

        const expectedAmount = Math.round(Number(order.total) * 100);

        if (event === "payment.captured") {
          if (payment.currency !== "INR" || Number(payment.amount) !== expectedAmount || payment.status !== "captured") {
            return new Response("Payment amount/currency mismatch", { status: 400 });
          }
          if (order.payment_status === "paid" && order.razorpay_payment_id === payment.id) {
            return Response.json({ received: true, alreadyProcessed: true });
          }

          const { data: updatedOrder, error: updateError } = await client
            .from("orders")
            .update({
              status: "paid",
              payment_status: "paid",
              payment_method: "online",
              razorpay_payment_id: payment.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .neq("payment_status", "paid")
            .select("id")
            .maybeSingle();

          if (updateError) return new Response("Could not update order", { status: 500 });
          if (!updatedOrder) return Response.json({ received: true, alreadyProcessed: true });

          try {
            await sendOrderConfirmationEmail({ orderId: order.id, customerName: order.customer_name, email: order.email, phone: order.phone, address: order.address, notes: order.notes ?? "", items: order.items ?? [], total: order.total ?? 0, method: "online" });
          } catch (err) { console.error("Webhook customer email failed:", err); }

          try {
            await sendOwnerOrderNotificationEmail({ orderId: order.id, customerName: order.customer_name, email: order.email, phone: order.phone, address: order.address, items: order.items ?? [], total: order.total ?? 0, method: "online", paymentStatus: "paid" });
          } catch (err) { console.error("Webhook owner email failed:", err); }
        } else if (event === "payment.failed" && order.payment_status !== "paid") {
          await client.from("orders").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id).neq("payment_status", "paid");
        }

        return Response.json({ received: true });
      },
    },
  },
});
