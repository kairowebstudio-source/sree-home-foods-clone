import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Retro Natural Products" }, { name: "description", content: "Terms of use for the Retro Natural Products website." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 px-4 mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-brand">Terms & Conditions</h1>
        <div className="mt-6 space-y-4 text-foreground/80 leading-relaxed">
          <p>By using this website you agree to our terms of use. All product images and content on this site are owned by Retro Natural Products and may not be reproduced without permission.</p>
          <p>Prices are subject to change. We reserve the right to cancel orders in case of pricing errors or stock unavailability, with a full refund.</p>
        </div>
      </section>
      <Footer />
    </div>
  ),
});
