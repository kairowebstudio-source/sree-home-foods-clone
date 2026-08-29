import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/lib/cart";
import { useState, useEffect } from "react";
import type { Product, Variant } from "@/lib/products";
import { getVariants, formatPrice, products as fallbackProducts } from "@/lib/products";

const SUPABASE_PRODUCTS_URL = "https://iifwenfvggpurohobsbq.supabase.co/rest/v1/products?select=*&order=created_at.asc";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    let remoteProducts: Product[] = [];
    try {
      const publishableKey = typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (publishableKey) {
        const response = await fetch(SUPABASE_PRODUCTS_URL, {
          headers: { apikey: publishableKey },
        });
        if (response.ok) {
          remoteProducts = (await response.json()) as Product[];
        }
      }
    } catch {
      // Keep the bundled catalogue available if Supabase is temporarily unavailable.
    }
    const bySlug = new Map<string, Product>();
    for (const p of fallbackProducts) bySlug.set(p.slug, p);
    for (const p of remoteProducts) if (p?.slug) bySlug.set(p.slug, p);
    const allProducts = Array.from(bySlug.values());
    const product = allProducts.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product, allProducts };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: `${loaderData.product.name} — Retro Natural Products` },
    { name: "description", content: loaderData.product.description },
    { property: "og:title", content: loaderData.product.name },
    { property: "og:description", content: loaderData.product.description },
    { property: "og:image", content: loaderData.product.image },
  ] : [{ title: "Product not found" }, { name: "robots", content: "noindex" }] }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Header /><div className="py-32 text-center"><h1 className="font-display text-4xl text-brand">Product not found</h1><Link to="/shop" className="text-gold mt-4 inline-block">← Back to shop</Link></div><Footer /></div>
  ),
  errorComponent: () => <div className="p-10 text-center">Something went wrong. <Link to="/shop" className="text-brand underline">Back to shop</Link></div>,
  component: ProductPage,
});

function ProductPage() {
  const { product, allProducts } = Route.useLoaderData();
  const related = allProducts.filter((p) => p.slug !== product.slug).slice(0, 3);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const variants: Variant[] = getVariants(product);
  const [vIdx, setVIdx] = useState(0);
  useEffect(() => { setVIdx(0); setQty(1); }, [product.slug]);
  const variant = variants[Math.min(vIdx, variants.length - 1)];
  const waMsg = encodeURIComponent(`Hi! I'd like to order ${product.name} (${variant.weight}) from Retro Natural Products.`);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover"><source src="/media/hero.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 bg-cream/90" />
        <div className="relative mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-border"><img src={product.image} alt={product.name} className="w-full h-[420px] object-contain" /></div>
          <div>
            <Link to="/shop" className="text-sm text-brand hover:underline"><i className="fas fa-arrow-left mr-2" />Back to shop</Link>
            <span className="mt-4 inline-block text-xs uppercase tracking-[0.3em] text-gold font-bold">{product.category}</span>
            <h1 className="font-display text-4xl md:text-5xl text-brand mt-2">{product.name}</h1>
            <p className="font-script text-2xl text-leaf-dark mt-1">{product.tagline}</p>
            <div className="flex items-center gap-3 mt-4"><span className="h-px w-16 bg-gold" /><i className="fas fa-leaf text-leaf" /><span className="h-px w-16 bg-gold" /></div>
            <p className="text-foreground/80 mt-6 leading-relaxed">{product.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{product.benefits.map((b: string) => <span key={b} className="px-3 py-1 rounded-full bg-leaf/15 text-leaf-dark text-xs font-semibold border border-leaf/30">{b}</span>)}</div>
            <div className="mt-6 flex items-center gap-4 text-sm text-foreground/70"><span><i className="fas fa-shield-heart text-gold mr-2" />100% Natural</span></div>
            <div className="mt-6"><span className="block text-xs uppercase tracking-[0.25em] text-foreground/60 font-bold mb-2">{variants.length > 1 ? "Choose a size" : "Size"}</span><div className="flex flex-wrap gap-2">{variants.map((v, i) => <button key={`${v.weight}-${i}`} type="button" onClick={() => setVIdx(i)} className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition ${i === vIdx ? "bg-brand text-cream border-brand" : "bg-cream/70 text-brand border-brand/30 hover:border-brand"}`}>{v.weight} · {formatPrice(v.price)}</button>)}</div></div>
            <div className="mt-5 flex items-baseline gap-3"><span className="font-display text-3xl text-brand font-bold">{formatPrice(variant.price)}</span>{variant.mrp && variant.mrp > variant.price && <span className="text-base text-foreground/50 line-through">{formatPrice(variant.mrp)}</span>}</div>
            {product.stock != null && (
              <div className="mt-4">
                {product.stock > 0 ? (
                  <span className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full ${product.stock <= 5 ? 'bg-red-100 text-red-700' : product.stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${product.stock <= 5 ? 'bg-red-500 animate-pulse' : product.stock <= 10 ? 'bg-amber-500' : 'bg-green-500'}`} />
                    {product.stock <= 5 ? `Only ${product.stock} left — order soon!` : `${product.stock} left in stock`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full bg-red-100 text-red-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Out of stock
                  </span>
                )}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border-2 border-brand/30 rounded-full bg-cream/70 backdrop-blur"><button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 grid place-items-center text-brand hover:bg-brand/10 rounded-l-full" aria-label="Decrease"><i className="fas fa-minus" /></button><span className="w-10 text-center font-bold text-brand">{qty}</span><button onClick={() => setQty((q) => q + 1)} className="h-11 w-11 grid place-items-center text-brand hover:bg-brand/10 rounded-r-full" aria-label="Increase"><i className="fas fa-plus" /></button></div>
              <button onClick={() => add(product, qty, variant)} className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground px-7 py-3 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition"><i className="fas fa-basket-shopping" /> Add to Cart</button>
              <a href={`https://wa.me/918121273912?text=${waMsg}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-brand text-brand px-7 py-3 font-bold uppercase tracking-wider text-sm hover:bg-brand hover:text-cream transition"><i className="fab fa-whatsapp" /> WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 bg-brand text-cream text-center"><span className="text-gold text-xs tracking-[0.3em] uppercase">You might also love</span><h2 className="font-display text-3xl md:text-4xl mt-2">More From Our Store</h2><div className="mt-10 mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{related.map((p) => <Link key={p.slug} to="/shop/$slug" params={{ slug: p.slug }} className="group bg-cream text-foreground rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform"><div className="aspect-square bg-white p-6"><img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" /></div><div className="p-4 text-left"><h3 className="font-display text-lg text-brand">{p.name}</h3><p className="text-xs text-muted-foreground mt-1">{p.tagline}</p></div></Link>)}</div></section>
      <Footer />
    </div>
  );
}
