import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "node:crypto";
import { supabaseAdmin, supabaseEnabled } from "./supabase.server";
import { sendOrderConfirmationEmail } from "./admin.server";

// ── Razorpay Payments ──────────────────────────────────────────
// Server-side only. RAZORPAY_KEY_ID (public) and RAZORPAY_KEY_SECRET
// (secret) come from the Razorpay dashboard → Settings → API Keys.

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; amount: number }) => d)
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set. Add them in Vercel → Settings → Environment Variables.",
      );
    }
    if (!supabaseEnabled()) {
      throw new Error("Supabase env vars are not set — cannot create a payment order.");
    }

    const amountPaise = Math.round(data.amount * 100);
    if (amountPaise < 100) {
      throw new Error("The order total must be at least ₹1 for online payment.");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: data.orderId.slice(0, 40),
        payment_capture: 1, // auto-capture when payment succeeds
      }),
    });

    const body = (await res.json().catch(() => ({}))) as
      | RazorpayOrderResponse
      | { error?: { description?: string } };

    if (!res.ok || !("id" in body)) {
      const detail =
        "error" in body && body.error?.description
          ? body.error.description
          : `Razorpay returned HTTP ${res.status}`;
      throw new Error(`Could not start payment: ${detail}`);
    }

    return {
      keyId,
      razorpayOrderId: body.id,
      amount: body.amount,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(
    (d: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("RAZORPAY_KEY_SECRET is not set in Vercel env vars.");
    }

    // 1. Verify the payment signature — only the server (which holds the
    //    key secret) can do this, so a forged response can't mark an order paid.
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    if (expected !== data.razorpaySignature) {
      throw new Error("Payment signature verification failed.");
    }

    // 2. Load the order and mark it paid
    const client = supabaseAdmin();
    const { data: order, error: fetchError } = await client
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (fetchError || !order) {
      throw new Error("Order not found — could not mark it paid.");
    }

    const { error: updateError } = await client
      .from("orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", data.orderId);
    if (updateError) {
      throw new Error(`Failed to mark order as paid: ${updateError.message}`);
    }

    // 3. Send the confirmation email (online orders were skipped at checkout)
    try {
      await sendOrderConfirmationEmail({
        orderId: data.orderId,
        customerName: order.customer_name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        notes: order.notes ?? "",
        items: order.items ?? [],
        total: order.total ?? 0,
        method: "online",
      });
    } catch (err) {
      console.error("Failed to send payment confirmation email:", err);
    }

    return { orderId: data.orderId };
  });
