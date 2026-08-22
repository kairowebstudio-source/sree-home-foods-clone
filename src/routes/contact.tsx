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
                  { i: "fa-clock", t: "Hours", d: "Mon–Sun · 9:20 AM – 8:00 PM" },
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
              <form className="bg-cream rounded-2xl p-8 border border-border space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement)?.value || '';
                  const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
                  const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value || '';
                  const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '';
                  const waMsg = encodeURIComponent(`Hi, I'm ${name}.\nEmail: ${email}\nPhone: ${phone}\n\n${message}`);
                  window.open(`https://wa.me/918121273912?text=${waMsg}`, '_blank');
                }}>
                <h2 className="font-display text-2xl text-brand">Send a Message</h2>
                <input required name="name" placeholder="Your name" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
                <input required name="email" type="email" placeholder="Email address" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
                <input name="phone" placeholder="Phone (optional)" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
                <textarea required name="message" rows={5} placeholder="How can we help?" className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:border-brand" />
                <button type="submit" className="w-full rounded-full bg-brand text-cream py-3 font-bold uppercase tracking-wider hover:opacity-90 transition"><i className="fab fa-whatsapp mr-2" />Send Message</button>
              </form>
              <div className="mt-4">
                <a href="mailto:retronaturalproducts@gmail.com" className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand text-brand py-3 font-bold uppercase tracking-wider hover:bg-brand hover:text-cream transition">
                  <i className="fas fa-envelope" /> Email Us
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
