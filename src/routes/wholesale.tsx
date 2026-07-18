import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale — Retro Natural Products" },
      { name: "description", content: "Bulk supply and private-label partnerships for retailers, gifting brands, and cafés." },
    ],
  }),
  component: Wholesale,
});

function Wholesale() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-brand text-cream py-20 px-4 text-center">
        <span className="text-gold text-xs tracking-[0.3em] uppercase font-bold">Wholesale & Manufacturing</span>
        <h1 className="font-display text-5xl mt-2">Top Brands Source Their Stock Here.</h1>
        <p className="mt-4 text-cream/80 max-w-2xl mx-auto">Partner with Retro Natural Products for bulk supply, private-label packing, and reliable dispatch from our Konaseema facility.</p>
      </section>
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6">
          {[
            { i: "fa-boxes-stacked", t: "Bulk MOQ", d: "Starting at 25kg per SKU. Custom packing sizes on request." },
            { i: "fa-tag", t: "Private Label", d: "We manufacture and pack under your brand with your artwork." },
            { i: "fa-truck-fast", t: "Pan-India Dispatch", d: "Reliable, tracked shipments to stores and warehouses." },
          ].map((c) => (
            <div key={c.t} className="bg-cream rounded-2xl p-8 text-center border border-border">
              <i className={`fas ${c.i} text-4xl text-gold`} />
              <h3 className="font-display text-xl text-brand mt-4">{c.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a href="https://wa.me/919999999999?text=Hi,%20I'm%20interested%20in%20wholesale%20orders%20from%20Retro%20Natural%20Products." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-brand text-cream px-8 py-4 font-bold uppercase tracking-wider hover:opacity-90 transition">
            <i className="fab fa-whatsapp" /> Message us for bulk orders
          </a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
