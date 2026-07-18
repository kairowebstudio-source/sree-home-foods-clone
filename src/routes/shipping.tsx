import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping & Returns — Retro Natural Products" }, { name: "description", content: "Our shipping timelines and return policy." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 px-4 mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-brand">Shipping & Returns</h1>
        <div className="mt-6 space-y-4 text-foreground/80 leading-relaxed">
          <p>We dispatch orders within 48 hours. Delivery typically takes 3–7 business days across India.</p>
          <p>Because our products are consumables, we cannot accept returns for opened items. If your order arrives damaged, message us within 48 hours with photos and we'll make it right.</p>
        </div>
      </section>
      <Footer />
    </div>
  ),
});
