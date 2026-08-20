import { createServerFn } from "@tanstack/react-start";
import type { Product } from "./products";
import { products as fallbackProducts } from "./products";
import { supabaseAdmin, supabaseEnabled } from "./supabase.server";

// ── Server Functions ───────────────────────────────────────────

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  if (!supabaseEnabled()) {
    return fallbackProducts;
  }
  try {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data as Product[]) || [];
    // Empty catalog (fresh database) → show the built-in starter products
    return rows.length ? rows : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD || "admin123";
    if (data === expected) return { success: true as const };
    return { success: false as const, error: "Invalid password" };
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

// PostgREST reports missing tables/columns as "... in the schema cache" errors
// (e.g. PGRST204). They mean the database hasn't been migrated, not that the
// code is wrong — surface an actionable hint instead of the cryptic message.
function withSchemaHint(action: string, error: { message?: string }): string {
  if (error?.message && error.message.includes("in the schema cache")) {
    return `${action}: ${error.message} — the products table in your Supabase project is missing the 'variants' column (or the products/orders tables). Open the SQL Editor in Supabase and run the migrations in supabase/migrations/ (at minimum: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;).`;
  }
  return `${action}: ${error?.message ?? "unknown error"}`;
}

export const addProduct = createServerFn({ method: "POST" })
  .validator((d: ProductInput) => d)
  .handler(async ({ data }) => {
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
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();

    // Never resend a stored data-URL image back into the request — those can
    // be megabytes and blow past the serverless request-size limit. Only the
    // image changes we actually want get written.
    const incomingImage = (data.image ?? "").trim();
    let imagePatch: string | undefined;

    if (incomingImage && !incomingImage.startsWith("data:")) {
      // Real URL (storage / placeholder) — always safe to store
      imagePatch = incomingImage;
    } else if (incomingImage.startsWith("data:")) {
      // Only replace the stored image if this is a NEW small data URL;
      // unchanged or oversized ones are skipped (keep the stored value).
      const { data: existing } = await client
        .from("products")
        .select("image")
        .eq("slug", data.slug)
        .maybeSingle();
      const stored = (existing?.image as string | null) ?? "";
      if (stored !== incomingImage) {
        if (incomingImage.length > 1_500_000) {
          throw new Error(
            "Failed to update product: image is too large. Re-upload the image with a smaller file.",
          );
        }
        imagePatch = incomingImage;
      }
    }
    // incomingImage === "" → keep the stored image unchanged

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
  items: { slug: string; name: string; price: number; qty: number }[];
  total: number;
  method: "cod" | "online";
  notify?: boolean;
};

export const submitOrder = createServerFn({ method: "POST" })
  .validator((d: OrderData) => d)
  .handler(async ({ data }) => {
    if (!supabaseEnabled()) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars to accept orders.");
    const client = supabaseAdmin();
    const fullAddress = data.state ? `${data.address}, ${data.city}, ${data.state} - ${data.pincode}` : `${data.address}, ${data.city} - ${data.pincode}`;
    const { data: order, error } = await client
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email,
        address: fullAddress,
        city: data.city,
        pincode: data.pincode,
        items: data.items,
        total: data.total,
        notes: data.notes,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to save order: ${error.message}`);

    // Send the customer a confirmation email. For online payments this is
    // skipped here and sent after the payment is verified. Never block or
    // fail the order if the email can't be sent — just log it.
    if (data.notify !== false) {
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: data.customer_name,
          email: data.email,
          phone: data.phone,
          address: fullAddress,
          notes: data.notes,
          items: data.items,
          total: data.total,
          method: data.method ?? "cod",
        });
      } catch (err) {
        console.error("Failed to send order confirmation email:", err);
      }
    }

    return { orderId: order.id };
  });

// ── Order confirmation email (Resend) ──────────────────────────

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
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email.");
    return;
  }

  const itemsSum = input.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = Math.max(0, input.total - itemsSum);
  const methodLabel =
    input.method === "online"
      ? "Pay Online — we'll follow up with a secure payment link"
      : "Cash on Delivery — pay when your order arrives";

  const itemRows = input.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;">${escapeHtml(i.name)} × ${i.qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;text-align:right;">₹${(i.price * i.qty).toLocaleString("en-IN")}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#faf7f0;border:1px solid #e8dcc3;border-radius:12px;overflow:hidden;">
      <div style="background:#7a1f1f;padding:24px 28px;text-align:center;">
        <h1 style="margin:0;color:#f5e9c9;font-size:22px;letter-spacing:0.5px;">Retro Natural Products</h1>
        <p style="margin:6px 0 0;color:#e9d9a8;font-size:12px;">Order Confirmation</p>
      </div>
      <div style="padding:28px;">
        <p style="color:#333;font-size:15px;">Dear <strong>${escapeHtml(input.customerName)}</strong>,</p>
        <p style="color:#555;font-size:14px;line-height:1.6;">
          Thank you for your order! It has been received and our team will reach out shortly with delivery details.
        </p>
        <table style="width:100%;background:#fff;border:1px solid #e8dcc3;border-radius:8px;margin:18px 0;font-size:13px;">
          <tr>
            <td style="padding:10px 12px;color:#777;">Order ID</td>
            <td style="padding:10px 12px;text-align:right;font-family:monospace;color:#7a1f1f;font-weight:bold;">${escapeHtml(input.orderId)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border-top:1px solid #f0e8d8;color:#777;">Payment</td>
            <td style="padding:10px 12px;border-top:1px solid #f0e8d8;text-align:right;color:#333;">${methodLabel}</td>
          </tr>
        </table>
        <h3 style="color:#7a1f1f;font-size:14px;margin:20px 0 8px;">Your Items</h3>
        <table style="width:100%;background:#fff;border:1px solid #e8dcc3;border-radius:8px;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th style="padding:10px 12px;text-align:left;color:#999;font-size:11px;text-transform:uppercase;">Item</th>
              <th style="padding:10px 12px;text-align:right;color:#999;font-size:11px;text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}
            <tr>
              <td style="padding:10px 12px;color:#777;">Shipping</td>
              <td style="padding:10px 12px;text-align:right;color:#333;">${shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#7a1f1f;font-weight:bold;">Total</td>
              <td style="padding:12px;text-align:right;color:#7a1f1f;font-weight:bold;">₹${input.total.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>
        <h3 style="color:#7a1f1f;font-size:14px;margin:20px 0 8px;">Delivery Address</h3>
        <p style="color:#555;font-size:13px;line-height:1.6;background:#fff;border:1px solid #e8dcc3;border-radius:8px;padding:12px;">${escapeHtml(input.address)}<br/>Phone: ${escapeHtml(input.phone)}</p>
        ${input.notes ? `<p style="color:#777;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ""}
        <p style="color:#999;font-size:12px;line-height:1.6;border-top:1px solid #e8dcc3;padding-top:14px;margin-top:22px;">
          Questions about your order? Reply to this email or contact us via the website.<br/>
          This is an automated message — please do not reply to this email address.
        </p>
      </div>
    </div>`;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "Retro Natural Products <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: `Order Confirmed — ${input.orderId.slice(0, 8).toUpperCase()}`,
    html,
  });
  if (error) throw new Error(error.message);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  if (!supabaseEnabled()) return [];
  try {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  } catch {
    return [];
  }
});

// ── Image Upload ───────────────────────────────────────────────

export const uploadProductImage = createServerFn({ method: "POST" })
  .validator((d: { base64: string; filename: string; contentType: string }) => d)
  .handler(async ({ data }) => {
    // Hard cap: refuse oversized payloads with a clear error instead of
    // letting them fail downstream or bloat the database.
    if (data.base64.length > 3_000_000) {
      throw new Error(
        "Image is still too large after compression. Please use a JPG or PNG under 2MB.",
      );
    }

    // Dev fallback: no Supabase configured → embed the image directly.
    if (!supabaseEnabled()) {
      return { url: `data:${data.contentType};base64,${data.base64}` };
    }

    let url: string;
    try {
      const client = supabaseAdmin();
      const bucketName = "product-images";

      // Ensure the bucket exists (private; images are served via signed URLs)
      const { data: buckets } = await client.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === bucketName);
      if (!exists) {
        await client.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 5 * 1024 * 1024,
        });
      }

      // Upload
      const buffer = Buffer.from(data.base64, "base64");
      const { error: uploadError } = await client.storage
        .from(bucketName)
        .upload(data.filename, buffer, {
          contentType: data.contentType,
          upsert: true,
        });
      if (uploadError) {
        // Fail loudly — silently storing data URLs bloats the database and
        // breaks later edits, which is exactly what caused these failures.
        throw new Error(`Storage rejected the upload: ${uploadError.message}`);
      }

      const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
      const { data: signed, error: signError } = await client.storage
        .from(bucketName)
        .createSignedUrl(data.filename, TEN_YEARS);
      if (signError || !signed?.signedUrl) {
        throw new Error(`Could not create image URL: ${signError?.message ?? "unknown error"}`);
      }
      url = signed.signedUrl;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const isNetworkFailure =
        /fetch failed|enotfound|getaddrinfo|econnrefused|network|socket/i.test(detail);
      if (isNetworkFailure) {
        // The server couldn't even reach Supabase — almost always a wrong URL.
        console.error(
          "Supabase unreachable. Configured SUPABASE_URL host:",
          process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "(not set)",
        );
        throw new Error(
          `Could not connect to Supabase (${detail}). In Vercel, SUPABASE_URL must be the exact "Project URL" from Supabase → Project Settings → API — e.g. https://your-project-ref.supabase.co — NOT the dashboard link. Update it and redeploy.`,
        );
      }
      throw new Error(`Failed to upload image to Supabase Storage: ${detail}`);
    }

    return { url };
  });

// ── One-time repair: move old embedded (data URL) images to Storage ──
// Products saved while storage uploads were failing have the whole image
// embedded in the database row, which makes pages slow and edits fail.

export const migrateDataUrlImages = createServerFn({ method: "POST" }).handler(async () => {
  if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
  const client = supabaseAdmin();

  const { data: rows, error } = await client
    .from("products")
    .select("slug, image")
    .like("image", "data:%");
  if (error) throw new Error(`Failed to load products: ${error.message}`);

  let migrated = 0;
  let failed = 0;
  for (const row of rows || []) {
    const image = (row.image as string) || "";
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;

    const contentType = match[1] || "image/png";
    const filename = `migrated-${row.slug}-${Date.now()}.png`;
    const { error: uploadError } = await client.storage
      .from("product-images")
      .upload(filename, Buffer.from(match[2], "base64"), {
        contentType,
        upsert: true,
      });
    if (uploadError) {
      failed++;
      console.warn(`Failed to migrate ${row.slug}:`, uploadError.message);
      continue;
    }

    const { data: signed } = await client.storage
      .from("product-images")
      .createSignedUrl(filename, 60 * 60 * 24 * 365 * 10);
    if (!signed?.signedUrl) {
      failed++;
      continue;
    }
    const { error: updateError } = await client
      .from("products")
      .update({ image: signed.signedUrl, updated_at: new Date().toISOString() })
      .eq("slug", row.slug);
    if (updateError) {
      failed++;
      console.warn(`Failed to update ${row.slug}:`, updateError.message);
      continue;
    }
    migrated++;
  }

  return { migrated, failed };
});


// ── Categories ─────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["Superfoods", "Spices", "Honey", "Dairy Foods", "Traditional"];

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  if (!supabaseEnabled()) return DEFAULT_CATEGORIES;
  try {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("categories")
      .select("name, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
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
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const name = data.trim();
    if (!name) throw new Error("Category name is required");
    const client = supabaseAdmin();
    const { error } = await client.from("categories").insert({ name, sort_order: 100 });
    if (error) throw new Error(withSchemaHint("Failed to add category", error));
    return { name };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    if (!supabaseEnabled()) throw new Error(NEEDS_ENV_MSG);
    const client = supabaseAdmin();
    const { error } = await client.from("categories").delete().eq("name", data);
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
    return { success: true };
  });
