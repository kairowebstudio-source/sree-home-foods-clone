import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { timingSafeEqual } from "node:crypto";
import type { Product } from "./products";
import { products as fallbackProducts } from "./products";
import { supabaseAdmin, supabaseEnabled } from "./supabase.server";

// ── Server Functions ───────────────────────────────────────────
// IMPORTANT: every private server function enforces the admin session here.
// Client-side sessionStorage or route guards are not security boundaries.

type AdminSession = { isAdmin?: boolean };

function adminSessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set and contain at least 32 characters.");
  }
  return {
    password,
    name: "__Host-sree-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

async function requireAdmin(): Promise<void> {
  const session = await useSession<AdminSession>(adminSessionConfig());
  if (session.data.isAdmin !== true) {
    throw new Error("Unauthorized");
  }
}

function safePasswordEqual(input: string, expected: string): boolean {
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  if (!supabaseEnabled()) return fallbackProducts;
  try {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data as Product[]) || [];
    return rows.length ? rows : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      throw new Error("ADMIN_PASSWORD is not configured on the server.");
    }
    if (!safePasswordEqual(data, expected)) {
      return { success: false as const, error: "Invalid password" };
    }

    const session = await useSession<AdminSession>(adminSessionConfig());
    await session.update({ isAdmin: true });
    return { success: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(adminSessionConfig());
  await session.clear();
  return { success: true as const };
});

type ProductInput = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  weight: string;
  price: number;
  mrp?: number;
  variants?: { weight: string; price: number; mrp?: number }[];
  image: string;
  description: string;
  benefits: string[];
};

const NEEDS_ENV_MSG = "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars to save products.";

function withSchemaHint(action: string, error: { message?: string }): string {
  if (error?.message && error.message.includes("in the schema cache")) {
    return `${action}: ${error.message} — run the migrations in supabase/migrations/ in your Supabase project.`;
  }
  return `${action}: ${error?.message ?? "unknown error"}`;
}

export const addProduct = createServerFn({ method: "POST" })
  .validator((d: ProductInput) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();
    if (data.image?.startsWith("data:") && data.image.length > 1_500_000) {
      throw new Error("Failed to add product: image is too large. Re-upload with a smaller file.");
    }
    const product = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      category: data.category,
      weight: data.weight,
      price: data.price,
      mrp: data.mrp || null,
      variants: data.variants ?? [],
      image: data.image || "/placeholder.svg",
      description: data.description,
      benefits: data.benefits,
    };
    const { error } = await client.from("products").insert(product);
    if (error) throw new Error(withSchemaHint("Failed to add product", error));
    return product as Product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((d: Product) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();

    const incomingImage = (data.image ?? "").trim();
    let imagePatch: string | undefined;

    if (incomingImage && !incomingImage.startsWith("data:")) {
      imagePatch = incomingImage;
    } else if (incomingImage.startsWith("data:")) {
      const { data: existing } = await client
        .from("products")
        .select("image")
        .eq("slug", data.slug)
        .maybeSingle();
      const stored = (existing?.image as string | null) ?? "";
      if (stored !== incomingImage) {
        if (incomingImage.length > 1_500_000) {
          throw new Error("Failed to update product: image is too large. Re-upload the image with a smaller file.");
        }
        imagePatch = incomingImage;
      }
    }

    const { error } = await client
      .from("products")
      .update({
        name: data.name,
        tagline: data.tagline,
        category: data.category,
        weight: data.weight,
        price: data.price,
        mrp: data.mrp || null,
        variants: data.variants ?? [],
        ...(imagePatch !== undefined ? { image: imagePatch } : {}),
        description: data.description,
        benefits: data.benefits,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", data.slug);
    if (error) throw new Error(withSchemaHint("Failed to update product", error));
    return data;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();
    const { error } = await client.from("products").delete().eq("slug", data);
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
    return { success: true };
  });

export type OrderData = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  notes: string;
  items: { slug: string; name: string; weight?: string; price: number; qty: number }[];
  total?: number;
  method: "cod" | "online";
  notify?: boolean;
};

type Variant = { weight: string; price: number; mrp?: number };

function validateCustomerInput(data: OrderData) {
  if (!data.customer_name.trim() || data.customer_name.trim().length > 100) throw new Error("Invalid customer name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.email.length > 200) throw new Error("Invalid email address.");
  if (!/^\d{10}$/.test(data.phone.replace(/\D/g, ""))) throw new Error("Invalid phone number.");
  if (!/^\d{6}$/.test(data.pincode)) throw new Error("Invalid PIN code.");
  if (!data.address.trim() || data.address.length > 500) throw new Error("Invalid delivery address.");
  if (!data.city.trim() || data.city.length > 100) throw new Error("Invalid city.");
  if (!data.state?.trim() || data.state.length > 100) throw new Error("Invalid state.");
  if (data.notes.length > 500) throw new Error("Order notes are too long.");
  if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 50) throw new Error("Invalid order items.");
}

async function calculateAuthoritativeOrder(data: OrderData) {
  const client = supabaseAdmin();
  const slugs = [...new Set(data.items.map((item) => item.slug))];
  if (slugs.some((slug) => !slug || slug.length > 150)) throw new Error("Invalid product reference.");

  const { data: productsRows, error } = await client
    .from("products")
    .select("slug,name,price,variants")
    .in("slug", slugs);
  if (error) throw new Error(`Failed to validate products: ${error.message}`);

  const productsBySlug = new Map((productsRows ?? []).map((p) => [p.slug, p]));
  if (productsBySlug.size !== slugs.length) throw new Error("One or more products are no longer available.");

  const items = data.items.map((item) => {
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) throw new Error("Invalid item quantity.");
    const product = productsBySlug.get(item.slug);
    if (!product) throw new Error("Product not found.");

    const variants = Array.isArray(product.variants) ? (product.variants as Variant[]) : [];
    let unitPrice = Number(product.price);
    let displayName = product.name;

    if (item.weight && variants.length) {
      const variant = variants.find((v) => v.weight === item.weight);
      if (!variant || !Number.isFinite(Number(variant.price))) {
        throw new Error(`The selected ${item.weight} variant for ${product.name} is unavailable.`);
      }
      unitPrice = Number(variant.price);
      displayName = `${product.name} (${variant.weight})`;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Invalid product price.");
    return { slug: product.slug, name: displayName, price: unitPrice, qty: item.qty };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 999 ? 0 : subtotal > 0 ? 60 : 0;
  const total = subtotal + shipping;
  if (!Number.isFinite(total) || total <= 0) throw new Error("Invalid order total.");

  return { items, subtotal, shipping, total };
}

export const submitOrder = createServerFn({ method: "POST" })
  .validator((d: OrderData) => d)
  .handler(async ({ data }) => {
    if (!supabaseEnabled()) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars to accept orders.");
    validateCustomerInput(data);
    const client = supabaseAdmin();
    const calculated = await calculateAuthoritativeOrder(data);
    const fullAddress = `${data.address.trim()}, ${data.city.trim()}, ${data.state.trim()} - ${data.pincode}`;

    const { data: order, error } = await client
      .from("orders")
      .insert({
        customer_name: data.customer_name.trim(),
        phone: data.phone.replace(/\D/g, ""),
        email: data.email.trim().toLowerCase(),
        address: fullAddress,
        city: data.city.trim(),
        pincode: data.pincode,
        items: calculated.items,
        total: calculated.total,
        notes: data.notes.trim(),
        status: "pending",
        payment_method: data.method,
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to save order: ${error.message}`);

    if (data.method === "cod" && data.notify !== false) {
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: data.customer_name,
          email: data.email,
          phone: data.phone,
          address: fullAddress,
          notes: data.notes,
          items: calculated.items,
          total: calculated.total,
          method: "cod",
        });
      } catch (err) {
        console.error("Failed to send order confirmation email:", err);
      }
      try {
        await sendOwnerOrderNotificationEmail({
          orderId: order.id,
          customerName: data.customer_name,
          email: data.email,
          phone: data.phone,
          address: fullAddress,
          items: calculated.items,
          total: calculated.total,
          method: "cod",
          paymentStatus: "pending",
        });
      } catch (err) {
        console.error("Failed to send owner order notification:", err);
      }
    }

    return { orderId: order.id, total: calculated.total };
  });

// ── Order emails (Resend) ──────────────────────────────────────

export async function sendOrderConfirmationEmail(input: {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  method: "cod" | "online";
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const itemsSum = input.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = Math.max(0, input.total - itemsSum);
  const methodLabel = input.method === "online" ? "Paid online via Razorpay" : "Cash on Delivery";
  const itemRows = input.items
    .map(
      (i) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;">${escapeHtml(i.name)} × ${i.qty}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;text-align:right;">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#faf7f0;border:1px solid #e8dcc3;border-radius:12px;overflow:hidden;">
    <div style="background:#7a1f1f;padding:24px 28px;text-align:center;"><h1 style="margin:0;color:#f5e9c9;font-size:22px;">Sree Home Foods</h1><p style="margin:6px 0 0;color:#e9d9a8;font-size:12px;">Order Confirmation</p></div>
    <div style="padding:28px;"><p style="color:#333;font-size:15px;">Dear <strong>${escapeHtml(input.customerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.6;">Thank you for your order! Your order has been received successfully.</p>
    <table style="width:100%;background:#fff;border:1px solid #e8dcc3;border-radius:8px;margin:18px 0;font-size:13px;"><tr><td style="padding:10px 12px;color:#777;">Order ID</td><td style="padding:10px 12px;text-align:right;font-family:monospace;color:#7a1f1f;font-weight:bold;">${escapeHtml(input.orderId)}</td></tr><tr><td style="padding:10px 12px;border-top:1px solid #f0e8d8;color:#777;">Payment</td><td style="padding:10px 12px;border-top:1px solid #f0e8d8;text-align:right;color:#333;">${methodLabel}</td></tr></table>
    <h3 style="color:#7a1f1f;font-size:14px;">Your Items</h3><table style="width:100%;background:#fff;border:1px solid #e8dcc3;border-collapse:collapse;font-size:13px;"><tbody>${itemRows}<tr><td style="padding:10px 12px;color:#777;">Shipping</td><td style="padding:10px 12px;text-align:right;color:#333;">${shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</td></tr><tr><td style="padding:12px;color:#7a1f1f;font-weight:bold;">Total</td><td style="padding:12px;text-align:right;color:#7a1f1f;font-weight:bold;">₹${input.total.toLocaleString("en-IN")}</td></tr></tbody></table>
    <h3 style="color:#7a1f1f;font-size:14px;margin-top:20px;">Delivery Address</h3><p style="color:#555;font-size:13px;line-height:1.6;background:#fff;border:1px solid #e8dcc3;border-radius:8px;padding:12px;">${escapeHtml(input.address)}<br/>Phone: ${escapeHtml(input.phone)}</p>
    ${input.notes ? `<p style="color:#777;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ""}
    <p style="color:#999;font-size:12px;line-height:1.6;border-top:1px solid #e8dcc3;padding-top:14px;margin-top:22px;">Questions about your order? Contact us via the website or WhatsApp.</p></div></div>`;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "Sree Home Foods <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: `Order Confirmed — ${input.orderId.slice(0, 8).toUpperCase()}`,
    html,
  });
  if (error) throw new Error(error.message);
}

export async function sendOwnerOrderNotificationEmail(input: {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  method: "cod" | "online";
  paymentStatus: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL;
  if (!apiKey || !ownerEmail) return;

  const rows = input.items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.name)} × ${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`)
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;"><h2>Sree Home Foods — New Order</h2><p><strong>Order:</strong> ${escapeHtml(input.orderId)}</p><p><strong>Customer:</strong> ${escapeHtml(input.customerName)}<br/><strong>Phone:</strong> ${escapeHtml(input.phone)}<br/><strong>Email:</strong> ${escapeHtml(input.email)}<br/><strong>Address:</strong> ${escapeHtml(input.address)}<br/><strong>Payment:</strong> ${escapeHtml(input.method)} / ${escapeHtml(input.paymentStatus)}</p><table style="width:100%;border-collapse:collapse;">${rows}<tr><td style="padding:10px;font-weight:bold;">Total</td><td style="padding:10px;text-align:right;font-weight:bold;">₹${input.total.toLocaleString("en-IN")}</td></tr></table></div>`;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "Sree Home Foods <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: ownerEmail,
    subject: `New Sree Home Foods Order — ${input.orderId.slice(0, 8).toUpperCase()}`,
    html,
  });
  if (error) throw new Error(error.message);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  if (!supabaseEnabled()) return [];
  const client = supabaseAdmin();
  const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return data || [];
});

// ── Image Upload ───────────────────────────────────────────────

export const uploadProductImage = createServerFn({ method: "POST" })
  .validator((d: { base64: string; filename: string; contentType: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.base64.length > 3_000_000) throw new Error("Image is still too large after compression. Please use a JPG or PNG under 2MB.");
    if (!supabaseEnabled()) return { url: `data:${data.contentType};base64,${data.base64}` };

    const client = supabaseAdmin();
    const bucketName = "product-images";
    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      const { error } = await client.storage.createBucket(bucketName, { public: false, fileSizeLimit: 5 * 1024 * 1024 });
      if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create image bucket: ${error.message}`);
    }

    const buffer = Buffer.from(data.base64, "base64");
    const { error: uploadError } = await client.storage.from(bucketName).upload(data.filename, buffer, { contentType: data.contentType, upsert: true });
    if (uploadError) throw new Error(`Storage rejected the upload: ${uploadError.message}`);

    const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
    const { data: signed, error: signError } = await client.storage.from(bucketName).createSignedUrl(data.filename, TEN_YEARS);
    if (signError || !signed?.signedUrl) throw new Error(`Could not create image URL: ${signError?.message ?? "unknown error"}`);
    return { url: signed.signedUrl };
  });

export const migrateDataUrlImages = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
  const client = supabaseAdmin();
  const { data: rows, error } = await client.from("products").select("slug, image").like("image", "data:%");
  if (error) throw new Error(`Failed to load products: ${error.message}`);

  let migrated = 0;
  let failed = 0;
  for (const row of rows || []) {
    const image = (row.image as string) || "";
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;
    const contentType = match[1] || "image/png";
    const filename = `migrated-${row.slug}-${Date.now()}.png`;
    const { error: uploadError } = await client.storage.from("product-images").upload(filename, Buffer.from(match[2], "base64"), { contentType, upsert: true });
    if (uploadError) { failed++; continue; }
    const { data: signed } = await client.storage.from("product-images").createSignedUrl(filename, 60 * 60 * 24 * 365 * 10);
    if (!signed?.signedUrl) { failed++; continue; }
    const { error: updateError } = await client.from("products").update({ image: signed.signedUrl, updated_at: new Date().toISOString() }).eq("slug", row.slug);
    if (updateError) { failed++; continue; }
    migrated++;
  }
  return { migrated, failed };
});

const DEFAULT_CATEGORIES = ["Superfoods", "Spices", "Honey", "Dairy Foods", "Traditional"];

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  if (!supabaseEnabled()) return DEFAULT_CATEGORIES;
  try {
    const client = supabaseAdmin();
    const { data, error } = await client.from("categories").select("name, sort_order, created_at").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const names = ((data as { name: string }[]) || []).map((c) => c.name);
    return names.length ? names : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
});

export const addCategory = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const name = data.trim();
    if (!name || name.length > 80) throw new Error("Invalid category name.");
    const client = supabaseAdmin();
    const { error } = await client.from("categories").insert({ name, sort_order: 100 });
    if (error) throw new Error(withSchemaHint("Failed to add category", error));
    return { name };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();
    const { error } = await client.from("categories").delete().eq("name", data);
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
    return { success: true };
  });
