import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Order Placed Successfully — Retro Natural Products" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { id } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <Header variant="solid" />

      <section className="py-16 px-4">
        <div className="mx-auto max-w-2xl">

          {/* Success Card */}
          <div className="bg-cream/90 backdrop-blur border border-gold/30 rounded-3xl overflow-hidden shadow-xl">

            {/* Top Banner */}
            <div className="bg-gradient-to-r from-[#7a1f1f] via-[#8a1e1e] to-[#5f1212] py-10 px-8 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

              {/* Animated Check */}
              <div className="relative mx-auto h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-gold/50 grid place-items-center animate-bounce-in">
                <div className="h-16 w-16 rounded-full bg-gold grid place-items-center">
                  <i className="fas fa-check text-brand text-3xl" />
                </div>
              </div>

              <h1 className="font-display text-3xl md:text-4xl text-cream mt-6 tracking-wide">
                Order Placed!
              </h1>
              <p className="text-cream/80 mt-2 text-sm md:text-base">
                Thank you for choosing Retro Natural Products
              </p>
            </div>

            {/* Order Details */}
            <div className="px-8 py-8">

              {/* Order ID */}
              {id && (
                <div className="flex items-center justify-center gap-3 bg-white rounded-2xl border border-gold/20 px-6 py-4 mb-6">
                  <i className="fas fa-receipt text-gold text-lg" />
                  <div className="text-left">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider">Order ID</p>
                    <p className="font-mono text-brand font-bold text-lg">{id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="flex items-center justify-between bg-white rounded-2xl border border-gold/20 px-6 py-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-leaf/20 text-leaf-dark grid place-items-center">
                    <i className="fas fa-check-circle text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand">Order Confirmed</p>
                    <p className="text-xs text-foreground/50">We received your order</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-foreground/30">
                  <i className="fas fa-arrow-right" />
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/20 text-gold grid place-items-center">
                    <i className="fas fa-box text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand">Processing</p>
                    <p className="text-xs text-foreground/50">We'll pack your order</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3 text-foreground/30">
                  <i className="fas fa-arrow-right" />
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/20 text-gold grid place-items-center">
                    <i className="fas fa-truck text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand">Delivered</p>
                    <p className="text-xs text-foreground/50">At your doorstep</p>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-white rounded-2xl border border-gold/20 px-6 py-5 mb-6">
                <h3 className="font-display text-lg text-brand mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle text-gold" />
                  What Happens Next?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand grid place-items-center text-sm shrink-0 mt-0.5">
                      <i className="fas fa-envelope text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand">Confirmation Email</p>
                      <p className="text-xs text-foreground/60">You'll receive order details on your email shortly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand grid place-items-center text-sm shrink-0 mt-0.5">
                      <i className="fas fa-phone text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand">Delivery Call</p>
                      <p className="text-xs text-foreground/60">Our team will call to confirm delivery details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand grid place-items-center text-sm shrink-0 mt-0.5">
                      <i className="fas fa-truck text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand">Fast Delivery</p>
                      <p className="text-xs text-foreground/60">Your order will be delivered within 3-5 business days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/shop"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand text-cream px-6 py-3.5 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition shadow-md"
                >
                  <i className="fas fa-shopping-bag" />
                  Continue Shopping
                </Link>
                <Link
                  to="/contact"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand text-brand px-6 py-3.5 font-bold uppercase tracking-wider text-sm hover:bg-brand hover:text-cream transition"
                >
                  <i className="fas fa-headset" />
                  Need Help?
                </Link>
              </div>

              {/* WhatsApp Support */}
              <div className="mt-6 text-center">
                <a
                  href="https://wa.me/918121273912"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"
                >
                  <i className="fab fa-whatsapp text-lg" />
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
