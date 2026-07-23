import { createServerFn } from "@tanstack/react-start";
import type { Product } from "./products";
import { supabaseAdmin } from "./supabase";

// ── Server Functions ───────────────────────────────────────────

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data as Product[]) || [];
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

export const addProduct = createServerFn({ method: "POST" })
  .validator((d: ProductInput) => d)
  .handler(async ({ data }) => {
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
    const { error } = await supabaseAdmin.from("products").insert(product);
    if (error) throw new Error(`Failed to add product: ${error.message}`);
    return product as Product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((d: Product) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("products")
      .update({
        name: data.name,
        tagline: data.tagline,
        category: data.category,
        weight: data.weight,
        price: data.price,
        mrp: data.mrp || null,
        image: data.image,
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
    const { error } = await supabaseAdmin.from("products").delete().eq("slug", data);
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
    const fullAddress = data.state ? `${data.address}, ${data.city}, ${data.state} - ${data.pincode}` : `${data.address}, ${data.city} - ${data.pincode}`;
    const { data: order, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return data || [];
});
