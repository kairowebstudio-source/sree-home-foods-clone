import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Retro Natural Products" }, { name: "description", content: "How we handle your data at Retro Natural Products." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 px-4 mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-brand">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-foreground/80 leading-relaxed">
          <p>We collect only the information needed to fulfil your orders and respond to your enquiries — name, contact details, shipping address, and order history.</p>
          <p>We never sell your data. Payment information is processed by secure third-party gateways and is never stored on our servers.</p>
          <p>For any privacy-related requests, email us at hello@retronaturalproducts.com.</p>
        </div>
      </section>
      <Footer />
    </div>
  ),
});
