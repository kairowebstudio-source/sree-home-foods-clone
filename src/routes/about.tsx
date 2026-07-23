import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import godavariBg from "@/assets/godavari-bg.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Retro Natural Products" },
      { name: "description", content: "The story behind Retro Natural Products — a family workshop keeping Konaseema's food traditions alive." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative py-24 px-4" style={{ backgroundImage: `url(${godavariBg})`, backgroundSize: "cover" }}>
        <div className="absolute inset-0 bg-cream/70" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-bold">Our Story</span>
          <h1 className="font-display text-4xl md:text-6xl text-brand mt-2">From Konaseema, With Care</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="h-px w-16 bg-gold" /><i className="fas fa-seedling text-leaf-dark" /><span className="h-px w-16 bg-gold" />
          </div>
          <p className="mt-6 text-foreground/80 leading-relaxed md:text-lg">
            Retro Natural Products was born out of a simple wish — to eat the way our
            grandparents did. Slow, single-origin, and deeply flavourful.
          </p>
        </div>
      </section>
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl space-y-8 text-foreground/85 leading-relaxed">
          <p>What began as a small kitchen experiment in a Konaseema village has grown into a workshop that supplies homes and retailers across India. We work directly with farmers, hand-pick every batch of raw material, and process everything in small quantities so nothing loses its soul.</p>
          <p>Our range spans traditional powders like Ashwagandha and Amla, superfood blends like ABC Powder, single-origin Guntur chilli, raw wild honey, and instant heritage desserts like Milk Junnu. Each product is a small tribute to Andhra's food culture — clean, honest, and made to be shared.</p>
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            {[
              { i: "fa-hand-holding-heart", t: "Farmer-first sourcing" },
              { i: "fa-mortar-pestle", t: "Small-batch processing" },
              { i: "fa-leaf", t: "Zero artificial anything" },
            ].map((v) => (
              <div key={v.t} className="text-center bg-cream rounded-xl p-6 border border-border">
                <i className={`fas ${v.i} text-3xl text-gold`} />
                <h3 className="font-display text-lg text-brand mt-3">{v.t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
