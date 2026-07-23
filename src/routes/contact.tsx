import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Retro Natural Products" },
      { name: "description", content: "Get in touch with Retro Natural Products for orders, wholesale, or general enquiries." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="solid" />
      <section className="bg-brand text-cream py-16 px-4 text-center">
        <span className="text-gold text-xs tracking-[0.3em] uppercase">Say Hello</span>
        <h1 className="font-display text-5xl mt-2">Contact Us</h1>
      </section>
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            {[
              { i: "fa-map-marker-alt", t: "Visit", d: "Konaseema, East Godavari,\nAndhra Pradesh 533232" },
              { i: "fa-phone", t: "Call", d: "+91 99999 99999" },
              { i: "fa-envelope", t: "Email", d: "hello@retronaturalproducts.com" },
              { i: "fa-clock", t: "Hours", d: "Mon–Sat · 9:00 AM – 7:00 PM" },
            ].map((c) => (
              <div key={c.t} className="flex gap-4 items-start bg-cream rounded-xl p-5 border border-border">
                <div className="h-12 w-12 rounded-full bg-brand text-gold grid place-items-center shrink-0"><i className={`fas ${c.i}`} /></div>
                <div>
                  <h3 className="font-display text-lg text-brand">{c.t}</h3>
                  <p className="text-sm text-foreground/80 whitespace-pre-line mt-1">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="bg-cream rounded-2xl p-8 border border-border space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Thanks! We'll get back to you shortly."); }}>
            <h2 className="font-display text-2xl text-brand">Send a Message</h2>
            <input required placeholder="Your name" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
            <input required type="email" placeholder="Email address" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
            <input placeholder="Phone (optional)" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
            <textarea required rows={5} placeholder="How can we help?" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
            <button type="submit" className="w-full rounded-full bg-brand text-cream py-3 font-bold uppercase tracking-wider hover:opacity-90 transition">Send Message</button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}
