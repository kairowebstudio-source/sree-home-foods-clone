import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Marquee } from "@/components/site/Marquee";
import { products, formatPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retro Natural Products — Authentic Konaseema Foods" },
      { name: "description", content: "Shop handcrafted powders, spices, raw honey and traditional foods from the heart of Konaseema. 100% natural. Delivered across India." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = products.slice(0, 6);
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/media/gemini_generated_video_a7b58a42.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d0d]/20 via-transparent to-[#1a0d0d]/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-36 text-cream text-center">
          <div className="inline-block px-4 py-1 rounded-full border border-gold/60 text-gold text-xs tracking-[0.3em] uppercase mb-6">
            ✦ Authentic · Natural · Timeless ✦
          </div>
          <h1 className="font-display text-4xl md:text-7xl font-bold leading-tight">
            <span className="block">Bringing the</span>
            <span className="block text-gold">Konaseema Kitchen</span>
            <span className="block font-script text-3xl md:text-5xl text-cream/90 mt-2">to your home</span>
          </h1>
          <div className="flex items-center justify-center gap-3 my-6">
            <span className="h-px w-16 bg-gold" />
            <i className="fas fa-leaf text-gold" />
            <span className="h-px w-16 bg-gold" />
          </div>
          <p className="max-w-2xl mx-auto text-cream/85 md:text-lg leading-relaxed">
            Pure ingredients. Time-honoured recipes. The soulful flavours of Andhra Pradesh —
            handcrafted, unhurried, and delivered with care.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-gold text-brand px-7 py-3 font-bold uppercase tracking-wider text-sm hover:bg-gold/90 transition shadow-lg"
            >
              <i className="fas fa-shopping-bag" /> Shop Now
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full border-2 border-cream/60 text-cream px-7 py-3 font-bold uppercase tracking-wider text-sm hover:bg-cream hover:text-brand transition"
            >
              <i className="fas fa-play-circle" /> Our Story
            </Link>
          </div>

          {/* Stamp */}
          <div className="hidden md:block absolute top-10 right-10">
            <svg viewBox="0 0 100 100" className="w-32 h-32 stamp-spin">
              <circle cx="50" cy="50" r="46" fill="rgba(138,30,30,0.85)" stroke="#D4A12A" strokeWidth="1.5" strokeDasharray="2 3" />
              <path id="c-top" d="M 15,50 a 35,35 0 1,1 70,0" fill="none" />
              <text fontSize="9" fill="#D4A12A" fontFamily="Cinzel, serif" letterSpacing="1.5">
                <textPath href="#c-top" startOffset="50%" textAnchor="middle">HANDCRAFTED</textPath>
              </text>
              <text x="50" y="46" textAnchor="middle" fill="#D4A12A" fontSize="8" fontFamily="Cinzel, serif">SINCE</text>
              <text x="50" y="62" textAnchor="middle" fill="#D4A12A" fontSize="14" fontWeight="bold" fontFamily="Cinzel, serif">2020</text>
              <path id="c-bot" d="M 85,50 a 35,35 0 0,1 -70,0" fill="none" />
              <text fontSize="8" fill="#D4A12A" fontFamily="Cinzel, serif" letterSpacing="1.5">
                <textPath href="#c-bot" startOffset="50%" textAnchor="middle">WITH LOVE</textPath>
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="relative py-10 md:py-16 px-3 sm:px-4 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/media/867549244_1784619221031257.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cream/20 md:bg-cream/35" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-6 md:mb-10">
            <span className="text-gold text-[10px] sm:text-xs tracking-[0.3em] font-bold uppercase">Our Collections</span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl text-brand">Naturally Crafted Goodness</h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="h-px w-10 sm:w-12 bg-gold" />
              <i className="fas fa-leaf text-leaf" />
              <span className="h-px w-10 sm:w-12 bg-gold" />
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>


      {/* LEGACY / ABOUT */}
      <section className="relative py-24 px-4 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/media/867549244_1784619221031257.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cream/25 md:bg-cream/40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="text-leaf-dark text-xs tracking-[0.3em] font-bold uppercase">Retro Natural Products</span>
          <h2 className="mt-2 font-display text-4xl md:text-5xl text-brand">A Legacy of Purity & Care</h2>
          <div className="flex items-center justify-center gap-3 mt-4 mb-8">
            <span className="h-px w-16 bg-gold" />
            <i className="fas fa-seedling text-leaf-dark" />
            <span className="h-px w-16 bg-gold" />
          </div>
          <p className="text-foreground/80 md:text-lg leading-relaxed">
            Rooted in the fertile soils of the Godavari delta, Retro Natural Products is a small
            family workshop dedicated to keeping traditional recipes alive. From single-origin
            spice powders to raw wild honey and slow-milled superfoods — every product is
            crafted the way our grandmothers would have wanted.
          </p>
          <div className="grid sm:grid-cols-4 gap-6 mt-12">
            {[
              { i: "fa-jar", t: "Traditional Powders", d: "Stone-milled, sun-dried, nothing added." },
              { i: "fa-mortar-pestle", t: "Origin Spices", d: "Direct from Guntur and Konaseema farms." },
              { i: "fa-jar-wheat", t: "Raw Honey", d: "Wild-harvested and never heated." },
              { i: "fa-bowl-food", t: "Heritage Foods", d: "Age-old Andhra recipes, ready in minutes." },
            ].map((b) => (
              <div key={b.t} className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-brand text-gold grid place-items-center text-3xl border-4 border-gold/40">
                  <i className={`fas ${b.i}`} />
                </div>
                <h3 className="font-display text-lg text-brand mt-4">{b.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHOLESALE STRIP */}
      <section className="py-20 px-4 bg-brand text-cream">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Wholesale & Manufacturing</span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Trusted by Retailers Across India.</h2>
            <p className="mt-4 text-cream/80 leading-relaxed">
              Partner with us for bulk supply of premium natural products — private label
              options, custom weights and reliable dispatch from our Konaseema facility.
            </p>
            <div className="mt-6 flex items-center gap-3 bg-cream/10 border border-gold/30 rounded-full px-5 py-3 w-fit">
              <i className="fas fa-phone-alt text-gold" />
              <span className="text-sm">Bulk orders · <strong>+91 99999 99999</strong></span>
            </div>
            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold text-brand px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-gold/90 transition">
              <i className="fab fa-whatsapp" /> DM us for bulk orders
            </a>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-4 border-gold/30 shadow-2xl">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src="/media/hero.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-cream">
        <div className="mx-auto max-w-6xl text-center">
          <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Kind words</span>
          <h2 className="mt-2 font-display text-4xl md:text-5xl text-brand">Loved in Homes Everywhere</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { n: "Lakshmi R.", c: "Hyderabad", t: "The chilli powder smells exactly like the one my grandmother used to grind. Absolutely authentic." },
              { n: "Arjun P.", c: "Bengaluru", t: "The raw honey is unreal — thick, floral and nothing like what you get in stores. Reordering already." },
              { n: "Sneha V.", c: "Chennai", t: "ABC powder has become part of my mornings. Clean, tasty and mixes well in milk. Highly recommend." },
            ].map((r) => (
              <div key={r.n} className="bg-white p-8 rounded-2xl border border-border text-left shadow-sm">
                <div className="text-gold text-lg mb-3">★★★★★</div>
                <p className="text-foreground/85 italic">“{r.t}”</p>
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="font-display text-brand">{r.n}</div>
                  <div className="text-xs text-muted-foreground">{r.c}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-background">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">FAQ</span>
            <h2 className="mt-2 font-display text-4xl text-brand">Questions, Answered</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Are your products truly natural?", a: "Yes. Everything is single-origin, minimally processed, and free from artificial colours, flavours or preservatives." },
              { q: "How long does delivery take?", a: "Orders within India ship in 3–7 business days. We currently serve pan-India." },
              { q: "Do you offer bulk / wholesale pricing?", a: "Absolutely. Head to our Wholesale page or WhatsApp us and we'll share our bulk catalogue." },
              { q: "How should I store the powders?", a: "Keep in a cool, dry place away from direct sunlight. Once opened, use within 3 months for best flavour." },
            ].map((f) => (
              <details key={f.q} className="group bg-card border border-border rounded-xl overflow-hidden">
                <summary className="cursor-pointer list-none flex items-center justify-between p-5 font-semibold text-brand">
                  {f.q}
                  <i className="fas fa-plus text-gold group-open:rotate-45 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-foreground/80 text-sm leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(99, q + 1));
  return (
    <div className="group flex flex-col rounded-xl overflow-hidden border border-gold/30 bg-cream/75 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all">
      <Link
        to="/shop/$slug"
        params={{ slug: p.slug }}
        className="block aspect-square sm:aspect-[4/3] bg-white/60 p-2 sm:p-3 overflow-hidden"
      >
        <img
          src={p.image}
          alt={p.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </Link>
      <div className="p-2.5 sm:p-3 border-t border-gold/20 flex flex-col gap-2">
        <div>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold font-bold">
            {p.category}
          </span>
          <Link
            to="/shop/$slug"
            params={{ slug: p.slug }}
            className="block mt-0.5 font-display text-sm sm:text-base text-brand leading-tight line-clamp-2 hover:underline"
          >
            {p.name}
          </Link>
          <p className="text-[10px] sm:text-[11px] text-foreground/60 mt-0.5">{p.weight}</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-brand text-base sm:text-lg font-bold">
            {formatPrice(p.price)}
          </span>
          {p.mrp && p.mrp > p.price && (
            <span className="text-[10px] sm:text-xs text-foreground/50 line-through">
              {formatPrice(p.mrp)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="inline-flex items-center border border-border rounded-full bg-white/80 shrink-0">
            <button
              type="button"
              onClick={dec}
              className="h-7 w-7 grid place-items-center text-brand hover:bg-brand/10 rounded-l-full"
              aria-label="Decrease quantity"
            >
              <i className="fas fa-minus text-[9px]" />
            </button>
            <span className="w-6 text-center text-xs font-semibold">{qty}</span>
            <button
              type="button"
              onClick={inc}
              className="h-7 w-7 grid place-items-center text-brand hover:bg-brand/10 rounded-r-full"
              aria-label="Increase quantity"
            >
              <i className="fas fa-plus text-[9px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => add(p, qty)}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded-full bg-brand text-cream px-2 py-1.5 sm:py-2 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] hover:opacity-90 transition"
          >
            <i className="fas fa-basket-shopping text-[10px]" />
            <span className="hidden xs:inline sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

