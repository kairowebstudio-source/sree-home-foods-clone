import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin, supabaseEnabled } from "./supabase.server";
import { sendOrderConfirmationEmail } from "./admin.server";

// Server-side only. Never expose RAZORPAY_KEY_SECRET to the browser.

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type RazorpayPaymentResponse = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};

function razorpayAuth(keyId: string, keySecret: string): string {
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

function assertPositiveMoney(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 1) {
    throw new Error("The order total must be at least ₹1 for online payment.");
  }
  return Math.round(amount * 100);
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  // The browser may still send an amount for backwards compatibility, but it
  // is deliberately ignored. The authoritative amount comes from Supabase.
  .validator((d: { orderId: string; amount?: number }) => d)
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

    const client = supabaseAdmin();
    const { data: order, error: orderError } = await client
      .from("orders")
      .select("id,total,status,payment_status,payment_method,razorpay_order_id")
      .eq("id", data.orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found — cannot start payment.");
    }
    if (order.payment_status === "paid") {
      throw new Error("This order has already been paid.");
    }
    if (order.payment_method !== "online") {
      throw new Error("This order is not configured for online payment.");
    }

    // Never trust the amount supplied by the browser.
    const amountPaise = assertPositiveMoney(order.total);

    // Reuse an existing Razorpay order if the browser retries the request.
    if (order.razorpay_order_id) {
      return {
        keyId,
        razorpayOrderId: order.razorpay_order_id,
        amount: amountPaise,
      };
    }

    const auth = razorpayAuth(keyId, keySecret);
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
        payment_capture: 1,
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

    if (body.currency !== "INR" || body.amount !== amountPaise) {
      throw new Error("Razorpay returned an unexpected payment amount or currency.");
    }

    const { error: saveError } = await client
      .from("orders")
      .update({
        razorpay_order_id: body.id,
        payment_method: "online",
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId);

    if (saveError) {
      throw new Error(`Failed to save payment order: ${saveError.message}`);
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
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay server credentials are not configured.");
    }
    if (!supabaseEnabled()) {
      throw new Error("Supabase env vars are not set — cannot verify payment.");
    }

    const client = supabaseAdmin();
    const { data: order, error: fetchError } = await client
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();

    if (fetchError || !order) {
      throw new Error("Order not found — could not verify payment.");
    }

    // Bind the Razorpay order to our own order before accepting any payment.
    if (order.razorpay_order_id !== data.razorpayOrderId) {
      throw new Error("Payment order does not match the store order.");
    }

    // Idempotent retry: the same already-paid payment is safe to acknowledge.
    if (order.payment_status === "paid") {
      if (order.razorpay_payment_id === data.razorpayPaymentId) {
        return { orderId: data.orderId, alreadyPaid: true };
      }
      throw new Error("This order has already been paid with a different payment.");
    }

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(data.razorpaySignature, "utf8");
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new Error("Payment signature verification failed.");
    }

    // Signature verification alone is not enough. Ask Razorpay for the payment
    // and verify its captured status, order ID, currency and exact amount.
    const auth = razorpayAuth(keyId, keySecret);
    const paymentRes = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(data.razorpayPaymentId)}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );
    const paymentBody = (await paymentRes.json().catch(() => ({}))) as
      | RazorpayPaymentResponse
      | { error?: { description?: string } };

    if (!paymentRes.ok || !("id" in paymentBody)) {
      const detail =
        "error" in paymentBody && paymentBody.error?.description
          ? paymentBody.error.description
          : `Razorpay returned HTTP ${paymentRes.status}`;
      throw new Error(`Could not verify payment with Razorpay: ${detail}`);
    }

    const expectedAmount = assertPositiveMoney(order.total);
    if (
      paymentBody.order_id !== data.razorpayOrderId ||
      paymentBody.currency !== "INR" ||
      paymentBody.amount !== expectedAmount ||
      paymentBody.status !== "captured"
    ) {
      throw new Error("Payment details do not match the order or payment was not captured.");
    }

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_method: "online",
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .neq("payment_status", "paid");

    if (updateError) {
      throw new Error(`Failed to mark order as paid: ${updateError.message}`);
    }

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

    return { orderId: data.orderId, alreadyPaid: false };
  });
