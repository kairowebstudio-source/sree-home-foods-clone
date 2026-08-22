import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Retro Natural Products" }, { name: "description", content: "How we handle your data at Retro Natural Products." }] }),
  component: () => (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        <section className="bg-brand text-cream py-16 px-4 text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase">Legal</span>
          <h1 className="font-display text-5xl mt-2">Privacy Policy</h1>
        </section>
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl text-left space-y-6 text-foreground/80 leading-relaxed">
            <h2 className="font-display text-2xl text-brand">Information We Collect</h2>
            <p>We collect only the information needed to fulfil your orders and respond to your enquiries — name, contact details, shipping address, and order history.</p>

            <h2 className="font-display text-2xl text-brand">How We Use Your Information</h2>
            <p>Your information is used solely to process orders, deliver products, and respond to customer service requests. We do not use your data for marketing without your explicit consent.</p>

            <h2 className="font-display text-2xl text-brand">Data Protection</h2>
            <p>We never sell your data. Payment information is processed by secure third-party gateways and is never stored on our servers.</p>

            <h2 className="font-display text-2xl text-brand">Third-Party Services</h2>
            <p>We use trusted third-party providers for payment processing, order fulfilment, and email communications. These providers have access only to the information necessary to perform their services.</p>

            <h2 className="font-display text-2xl text-brand">Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. For any privacy-related requests, email us at retronaturalproducts@gmail.com.</p>

            <h2 className="font-display text-2xl text-brand">Contact</h2>
            <p>For questions about this Privacy Policy, please contact us at retronaturalproducts@gmail.com or call +91 81212 73912.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  ),
});
