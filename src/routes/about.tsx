import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Retro Natural Products" },
      { name: "description", content: "The story behind Retro Natural Products — a family workshop keeping traditional food traditions alive." },
    ],
  }),
  component: About,
});

const teamMembers = [
  {
    name: "Miss Cathy",
    role: "Chief Financial Officer & International Business Expansion Lead",
    location: "UK",
    image: "/media/IMG-20260819-WA0013.jpg",
    initials: "C",
  },
  {
    name: "Mr Kiran Babu Arigela",
    role: "Business Strategist & Market Analysis Lead",
    location: "UK",
    image: "/media/IMG-20260819-WA0002.jpg",
    initials: "KBA",
  },
  {
    name: "Mr Ganesh Gollapothu",
    role: "Hyderabad Unit Manager and Distribution Lead",
    location: null,
    image: "/media/IMG-20260819-WA0004.jpg",
    initials: "GG",
  },
  {
    name: "Mrs Sai Sri Vidya",
    role: "Quality Assurance Lead",
    location: "Sydney, Australia",
    image: "/media/IMG-20260819-WA0003.jpg",
    initials: "SSV",
  },
];

function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-brand text-cream py-16 px-4 text-center">
          <span className="text-gold text-xs tracking-[0.3em] uppercase">Who We Are</span>
          <h1 className="font-display text-5xl mt-2">Our Story</h1>
          <p className="mt-4 text-cream/80 max-w-2xl mx-auto">The story behind Retro Natural Products — a family workshop keeping traditional food traditions alive.</p>
        </section>

        {/* Founder & Director Section */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">Leadership</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl text-brand">Meet Our Founder</h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="h-px w-12 bg-gold" />
                <i className="fas fa-leaf text-gold" />
                <span className="h-px w-12 bg-gold" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Founder Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border-4 border-gold/30 shadow-xl">
                  <img
                    src="/media/IMG-20260819-WA0014.jpg"
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
                  <h3 className="font-display text-2xl text-brand">Dr. Raviraja Muddana</h3>
                  <p className="text-gold font-semibold text-sm tracking-wider uppercase mt-1">Founder & Director | UK</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display text-lg text-brand">About Dr. Raviraja</h4>
                  <p className="text-foreground/80 leading-relaxed">
                    Dr. Raviraja Muddana is the Founder and Director of RETRO Natural Products, bringing together a distinguished professional career in medicine with a strong passion for entrepreneurship and business innovation.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    Alongside his work as a busy Emergency Medicine doctor in the United Kingdom, Dr. Raviraja currently serves as the Medical Director and International Advisor for the prestigious AROGYABHARATH Organisation. Despite a demanding medical career, his long-standing vision for entrepreneurship inspired him to establish the RETRO Group with the ambition of building a trusted and forward-thinking business in the natural products and FMCG sector.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    Under his leadership and strategic direction, RETRO Natural Products has rapidly established itself as a significant player in Hyderabad's B2B distribution and supply-chain ecosystem. The company continues to expand its footprint across new markets and states while also progressing towards the development and manufacturing of its own products under the RETRO brand.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    As Founder and Director, Dr. Raviraja plays a key role in shaping the company's strategic direction, maintaining product standards, building strong partnerships, and driving sustainable long-term growth.
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    His approach to business is founded on the principles of quality, authenticity, customer trust, innovation, and responsible business practices. Through RETRO Natural Products, his vision is to make high-quality natural and dependable products increasingly accessible to customers while creating meaningful opportunities for brands and young entrepreneurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="py-16 px-4 bg-cream/50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">The People Behind</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl text-brand">Our Team</h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="h-px w-12 bg-gold" />
                <i className="fas fa-leaf text-gold" />
                <span className="h-px w-12 bg-gold" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="group bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="relative overflow-hidden bg-brand/10 aspect-[3/4] shrink-0">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-brand text-gold';
                          fallback.innerHTML = `<span class="text-4xl font-display">${member.initials}</span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 text-center flex-1 flex flex-col justify-center">
                    <h3 className="font-display text-lg text-brand">{member.name}</h3>
                    <p className="text-black text-xs font-semibold uppercase tracking-wider mt-1">{member.role}</p>
                    {member.location && (
                      <p className="text-foreground/60 text-xs mt-1 flex items-center justify-center gap-1">
                        <i className="fas fa-map-marker-alt text-gold/60" />
                        {member.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
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

      </main>
      <Footer />
    </div>
  );
}
