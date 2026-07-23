import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { type Product, categories } from "@/lib/products";
import { getProducts } from "@/lib/admin.server";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — Retro Natural Products" },
      { name: "description", content: "Browse our full range of natural powders, spices, raw honey and traditional Andhra foods." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const [productList, setProductList] = useState<Product[]>([]);
  useEffect(() => {
    getProducts().then(setProductList).catch(() => {});
  }, []);
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const filtered = cat === "All" ? productList : productList.filter((p) => p.category === cat);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-brand text-cream py-16 px-4 text-center">
        <span className="text-gold text-xs tracking-[0.3em] uppercase">Our Shop</span>
        <h1 className="font-display text-5xl mt-2">The Full Collection</h1>
        <p className="text-cream/80 mt-3 max-w-xl mx-auto">Everything we make — natural, honest, and shipped fresh from Konaseema.</p>
      </section>
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border transition ${
                  cat === c ? "bg-brand text-cream border-brand" : "bg-cream text-brand border-border hover:border-brand"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to="/shop/$slug"
                params={{ slug: p.slug }}
                className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-white p-6">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 border-t border-border">
                  <span className="text-xs uppercase tracking-widest text-gold font-bold">{p.category}</span>
                  <h3 className="mt-1 font-display text-xl text-brand">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-foreground/60">{p.weight}</span>
                    <span className="text-sm font-semibold text-brand">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
