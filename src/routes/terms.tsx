import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Retro Natural Products" }, { name: "description", content: "Terms of use for the Retro Natural Products website." }] }),
  component: () => (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        <section className="bg-brand text-cream py-16 px-4 text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase">Legal</span>
          <h1 className="font-display text-5xl mt-2">Terms & Conditions</h1>
        </section>
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl text-left space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="font-display text-2xl text-brand">Acceptance of Terms</h2>
            <p>By using this website you agree to our terms of use. All product images and content on this site are owned by Retro Natural Products and may not be reproduced without permission.</p>

            <h2 className="font-display text-2xl text-brand">Products & Pricing</h2>
            <p>Prices are subject to change. We reserve the right to cancel orders in case of pricing errors or stock unavailability, with a full refund.</p>

            <h2 className="font-display text-2xl text-brand">Orders & Payment</h2>
            <p>All orders are subject to product availability. We reserve the right to refuse or cancel any order for any reason. Payment must be received in full before order processing begins.</p>

            <h2 className="font-display text-2xl text-brand">Shipping</h2>
            <p>We aim to dispatch orders within 48 hours. Delivery times may vary depending on location and are estimates only. Retro Natural Products is not responsible for delays caused by shipping carriers.</p>

            <h2 className="font-display text-2xl text-brand">Limitation of Liability</h2>
            <p>Retro Natural Products shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.</p>

            <h2 className="font-display text-2xl text-brand">Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.</p>

            <h2 className="font-display text-2xl text-brand">Contact</h2>
            <p>For questions about these Terms & Conditions, please contact us at retronaturalproducts@gmail.com or call +91 81212 73912.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  ),
});
