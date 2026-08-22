import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping & Returns — Retro Natural Products" }, { name: "description", content: "Our shipping timelines and return policy." }] }),
  component: () => (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        <section className="bg-brand text-cream py-16 px-4 text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase">Shipping</span>
          <h1 className="font-display text-5xl mt-2">Shipping & Returns</h1>
        </section>
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl text-left space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="font-display text-2xl text-brand">Shipping Policy</h2>
            <p>We dispatch orders within 48 hours of receiving them. Delivery typically takes 3–7 business days across India, depending on your location.</p>
            <p>You will receive a tracking number via email or WhatsApp once your order has been shipped.</p>

            <h2 className="font-display text-2xl text-brand">Shipping Charges</h2>
            <p>Shipping charges are calculated at checkout based on your delivery location and order weight. Free shipping may be available on orders above a certain value — check our website for current offers.</p>

            <h2 className="font-display text-2xl text-brand">Return Policy</h2>
            <p>Because our products are consumables, we cannot accept returns for opened items. If your order arrives damaged, message us within 48 hours with photos and we'll make it right.</p>

            <h2 className="font-display text-2xl text-brand">Refunds</h2>
            <p>Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds will be credited to the original payment method.</p>

            <h2 className="font-display text-2xl text-brand">Damaged or Wrong Items</h2>
            <p>If you receive a damaged or incorrect item, please contact us within 48 hours of delivery with your order number and photos of the issue. We will arrange a replacement or full refund.</p>

            <h2 className="font-display text-2xl text-brand">Contact</h2>
            <p>For shipping or return queries, please contact us at retronaturalproducts@gmail.com or call +91 81212 73912.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  ),
});
