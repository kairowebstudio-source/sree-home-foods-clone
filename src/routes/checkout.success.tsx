import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Retro Natural Products" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-20 px-4">
        <div className="mx-auto max-w-xl bg-cream/85 backdrop-blur border border-gold/30 rounded-3xl p-10 text-center shadow-sm">
          <div className="mx-auto h-20 w-20 rounded-full bg-leaf/20 text-leaf-dark grid place-items-center text-4xl border-4 border-leaf/30">
            <i className="fas fa-check" />
          </div>
          <span className="mt-6 inline-block text-gold text-xs tracking-[0.3em] uppercase">Thank You</span>
          <h1 className="font-display text-4xl text-brand mt-2">Order Confirmed</h1>
          <p className="text-foreground/80 mt-3 leading-relaxed">
            Your order has been placed successfully. Our team will reach out shortly with delivery and payment details.
          </p>
          {id && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/70 border border-gold/40 rounded-full px-5 py-2 text-sm">
              <i className="fas fa-receipt text-gold" />
              <span className="text-brand font-semibold">Order ID:</span>
              <span className="font-mono">{id}</span>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-brand text-cream px-6 py-3 font-bold uppercase tracking-wider text-xs hover:opacity-90">
              <i className="fas fa-shopping-bag" /> Continue Shopping
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border-2 border-brand text-brand px-6 py-3 font-bold uppercase tracking-wider text-xs hover:bg-brand hover:text-cream">
              <i className="fas fa-envelope" /> Contact Us
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
