/**
 * Run this once to set up the Supabase database tables.
 * Usage: bun run scripts/setup-db.ts
 */
import { supabaseAdmin } from "../src/lib/supabase";
import { products as defaultProducts } from "../src/lib/products";

const SQL = `
-- Products table
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Powders',
  weight TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  mrp INTEGER,
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  benefits JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for sorting orders
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`;

async function main() {
  console.log("Creating tables...");
  const { error } = await supabaseAdmin.rpc("pgrest_exec", { query: SQL }).single();
  if (error) {
    // Fallback: try raw SQL via REST
    console.log("RPC failed, trying raw SQL...");
    const { error: sqlError } = await supabaseAdmin.from("_sql").select("*").limit(0);
    if (sqlError) {
      console.log("Direct SQL not available. Please run the SQL manually in Supabase SQL Editor.");
      console.log("\n--- COPY THE SQL BELOW ---\n");
      console.log(SQL);
      console.log("\n--- END SQL ---\n");
      console.log("Visit: https://supabase.com/dashboard/project/iifwenfvggpurohobsbq/sql/new");
      return;
    }
  }

  // Seed default products
  console.log("Seeding default products...");
  for (const p of defaultProducts) {
    const { error: upsertError } = await supabaseAdmin.from("products").upsert(
      {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        category: p.category,
        weight: p.weight,
        price: p.price,
        mrp: p.mrp || null,
        image: p.image,
        description: p.description,
        benefits: p.benefits,
      },
      { onConflict: "slug" },
    );
    if (upsertError) {
      console.error(`Failed to seed ${p.slug}:`, upsertError.message);
    } else {
      console.log(`  ✓ ${p.slug}`);
    }
  }
  console.log("Done!");
}

main().catch(console.error);
