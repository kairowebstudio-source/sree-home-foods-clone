import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { type Product, categories, priceRange, getVariants, products as fallbackProducts } from "@/lib/products";

const SUPABASE_PRODUCTS_URL = "https://iifwenfvggpurohobsbq.supabase.co/rest/v1/products?select=*&order=created_at.asc";

export const Route = createFileRoute("/shop/")({
  head: () => ({ meta: [{ title: "Shop — Retro Natural Products" }, { name: "description", content: "Browse our full range of natural powders, spices, raw honey and traditional Andhra foods." }] }),
  component: Shop,
});

function mergeProducts(remote: Product[]): Product[] {
  const bySlug = new Map<string, Product>();
  for (const p of fallbackProducts) bySlug.set(p.slug, p);
  for (const p of remote) if (p?.slug) bySlug.set(p.slug, p);
  return Array.from(bySlug.values());
}

function Shop() {
  const [productList, setProductList] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    let active = true;

    async function loadSupabaseProducts() {
      // Use the actual project URL directly here. Vercel had an old
      // VITE_SUPABASE_URL value, which caused the browser to query the wrong project.
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!publishableKey) {
        console.error("Supabase products: missing VITE_SUPABASE_PUBLISHABLE_KEY");
        return;
      }

      try {
        const response = await fetch(SUPABASE_PRODUCTS_URL, {
          headers: { apikey: publishableKey },
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`Supabase products request failed (${response.status}): ${body}`);
        }

        const remoteProducts = (await response.json()) as Product[];
        if (active && Array.isArray(remoteProducts)) {
          setProductList(mergeProducts(remoteProducts));
        }
      } catch (error) {
        console.error("Supabase products unavailable; using bundled catalogue:", error);
      }
    }

    loadSupabaseProducts();
    return () => { active = false; };
  }, []);

  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = productList
    .filter((p) => cat === "All" || p.category === cat)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <Header variant="solid" />
      <section className="bg-brand text-cream py-16 px-4 text-center">
        <span className="text-gold text-xs tracking-[0.3em] uppercase">Our Store</span>
        <h1 className="font-display text-5xl mt-2">The Full Collection</h1>
        <p className="text-cream/80 mt-3 max-w-xl mx-auto">Everything we make — natural, honest, and shipped fresh to your door.</p>
      </section>
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border transition ${cat === c ? "bg-brand text-cream border-brand" : "bg-cream text-brand border-border hover:border-brand"}`}>{c}</button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <svg className="h-16 w-16 mx-auto text-foreground/20 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <p className="text-foreground/60 text-lg">No products found</p>
              <p className="text-foreground/40 text-sm mt-1">Try a different search or category</p>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.slug} to="/shop/$slug" params={{ slug: p.slug }} className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="aspect-square bg-white p-6"><img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-5 border-t border-border">
                  <span className="text-xs uppercase tracking-widest text-gold font-bold">{p.category}</span>
                  <h3 className="mt-1 font-display text-xl text-brand">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
                  {p.stock != null && (
                    <div className="mt-2">
                      {p.stock > 0 ? (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-700' : p.stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          <span className={`h-2 w-2 rounded-full ${p.stock <= 5 ? 'bg-red-500 animate-pulse' : p.stock <= 10 ? 'bg-amber-500' : 'bg-green-500'}`} />
                          {p.stock <= 5 ? `Only ${p.stock} left!` : `${p.stock} left`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Out of stock
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between"><span className="text-xs text-foreground/60">{getVariants(p).length > 1 ? `${getVariants(p).length} sizes · ${priceRange(p)}` : `${p.weight} · ${priceRange(p)}`}</span><span className="text-sm font-semibold text-brand">Buy →</span></div>
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
