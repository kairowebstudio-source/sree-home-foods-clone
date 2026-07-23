import { createServerFn } from "@tanstack/react-start";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Product } from "./products";
import { products as defaultProducts, categories } from "./products";

// ── Data file helpers ──────────────────────────────────────────

const DATA_DIR = join(process.cwd(), "tmp-data");
const PRODUCTS_FILE = join(DATA_DIR, "products.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): Product[] {
  try {
    ensureDir();
    if (existsSync(PRODUCTS_FILE)) {
      return JSON.parse(readFileSync(PRODUCTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load products from file:", e);
  }
  // Seed with defaults on first run
  save(defaultProducts);
  return defaultProducts;
}

function save(list: Product[]) {
  ensureDir();
  writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// ── Server Functions ───────────────────────────────────────────

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  return load();
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
    const list = load();
    const product: Product = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      category: data.category,
      weight: data.weight,
      price: data.price,
      mrp: data.mrp || undefined,
      image: data.image || "/placeholder.svg",
      description: data.description,
      benefits: data.benefits,
    };
    list.push(product);
    save(list);
    return product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((d: Product) => d)
  .handler(async ({ data }) => {
    const list = load();
    const idx = list.findIndex((p) => p.slug === data.slug);
    if (idx === -1) throw new Error("Product not found");
    list[idx] = data;
    save(list);
    return data;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    const list = load();
    const filtered = list.filter((p) => p.slug !== data);
    save(filtered);
    return { success: true };
  });
