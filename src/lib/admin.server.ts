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
  category: "Powders" | "Spices" | "Honey" | "Traditional";
  weight: string;
  price: number;
  mrp?: number;
  image: string;
  description: string;
  benefits: string[];
};

const NEEDS_ENV_MSG = "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars to save products.";

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
      image: data.image || "/placeholder.svg",
      description: data.description,
      benefits: data.benefits,
    };
    const { error } = await client.from("products").insert(product);
    if (error) throw new Error(`Failed to add product: ${error.message}`);
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
        ...(imagePatch !== undefined ? { image: imagePatch } : {}),
        description: data.description,
        benefits: data.benefits,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", data.slug);
    if (error) throw new Error(`Failed to update product: ${error.message}`);
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
    return { orderId: order.id };
  });

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

      // Ensure the bucket exists (public)
      const { data: buckets } = await client.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === bucketName);
      if (!exists) {
        await client.storage.createBucket(bucketName, {
          public: true,
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
        throw new Error(`Supabase Storage rejected the upload: ${uploadError.message}`);
      }

      const { data: publicUrl } = client.storage
        .from(bucketName)
        .getPublicUrl(data.filename);
      url = publicUrl.publicUrl;
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

    const { data: publicUrl } = client.storage
      .from("product-images")
      .getPublicUrl(filename);
    const { error: updateError } = await client
      .from("products")
      .update({ image: publicUrl.publicUrl, updated_at: new Date().toISOString() })
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
