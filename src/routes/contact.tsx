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
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-brand text-cream py-16 px-4 text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase">Say Hello</span>
          <h1 className="font-display text-5xl mt-2">Contact Us</h1>
        </section>

        {/* Founder & Director Section */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Leadership</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl text-brand">Meet Our Founder</h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="h-px w-12 bg-gold" />
                <i className="fas fa-leaf text-leaf" />
                <span className="h-px w-12 bg-gold" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Founder Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border-4 border-gold/30 shadow-xl">
                  <img
                    src="/media/founder-raviraja.jpg"
                    alt="Dr. Raviraja - Founder & Director"
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
                {/* Decorative corner */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-gold/20 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 h-16 w-16 bg-brand/10 rounded-full blur-xl" />
              </div>

              {/* Founder Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-2xl text-brand">Dr. Raviraja</h3>
                  <p className="text-gold font-semibold text-sm tracking-wider uppercase mt-1">Founder & Director | UK</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display text-lg text-brand">About Dr. Raviraja</h4>
                  <p className="text-foreground/80 leading-relaxed">
                    Dr. Raviraja is the Founder and Director of Retro Natural Products, driven by a strong passion for natural, quality-focused products and a commitment to bringing trusted solutions to customers.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    With a vision of building a reliable and customer-focused natural products brand, he plays a key role in guiding the company's direction, product standards, and long-term growth.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    His approach combines a focus on quality, authenticity, customer trust, and responsible business practices, with the aim of making natural products more accessible and dependable for customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder's Vision Section */}
        <section className="py-16 px-4 bg-brand text-cream">
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Our Founder's Vision</span>
            <div className="mt-8 relative">
              {/* Quote marks */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-gold/30 text-8xl font-serif leading-none">&ldquo;</div>
              <blockquote className="relative z-10 font-display text-2xl md:text-3xl lg:text-4xl leading-relaxed px-8 md:px-16 py-4">
                &ldquo;Our vision is to build a trusted natural products brand where quality, authenticity and customer satisfaction always come first.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-3">
                <span className="h-px w-16 bg-gold/50" />
                <i className="fas fa-leaf text-gold" />
                <span className="h-px w-16 bg-gold/50" />
              </div>
              <p className="mt-4 text-cream/80 font-semibold">&mdash; Dr. Raviraja</p>
            </div>
          </div>
        </section>

        {/* Contact Information & Form Section */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Get In Touch</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl text-brand">Send Us a Message</h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="h-px w-12 bg-gold" />
                <i className="fas fa-leaf text-leaf" />
                <span className="h-px w-12 bg-gold" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                {[
                  { i: "fa-building", t: "Office", d: "'RETRO' Natural Products\nShop G9, H.no 19, Eeco Valley Apartments\nopposite Jana Priya Nile valley, PJR Layout\nMADHAVAPURI HILLS, Ameenpur\nHyderabad-500050" },
                  { i: "fa-phone", t: "Call", d: "+91 81212 73912" },
                  { i: "fa-envelope", t: "Email", d: "retronaturalproducts@gmail.com" },
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
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
