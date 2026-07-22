import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Retro Natural Products" },
      { name: "description", content: "Complete your order of handcrafted Konaseema natural foods." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Form = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  method: "cod" | "online";
};

function Checkout() {
  const { items, count, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
    method: "cod",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    // TODO: Wire Zoho Payments here. For now, generate an order id and confirm on-site.
    const orderId = "RNP-" + Date.now().toString(36).toUpperCase();
    await new Promise((r) => setTimeout(r, 700));
    try {
      sessionStorage.setItem(
        "retro-last-order",
        JSON.stringify({ orderId, form, items, count, placedAt: new Date().toISOString() }),
      );
    } catch {}
    clear();
    navigate({ to: "/checkout/success", search: { id: orderId } });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-24 px-4 text-center">
          <div className="mx-auto max-w-lg bg-cream/80 backdrop-blur border border-gold/30 rounded-3xl p-10 shadow-sm">
            <div className="mx-auto h-20 w-20 rounded-full bg-brand/10 text-brand grid place-items-center text-3xl">
              <i className="fas fa-basket-shopping" />
            </div>
            <h1 className="font-display text-3xl text-brand mt-4">Your basket is empty</h1>
            <p className="text-muted-foreground mt-2">Add a few jars from our collection to check out.</p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-cream px-6 py-3 font-bold uppercase tracking-wider text-xs hover:opacity-90"
            >
              <i className="fas fa-shopping-bag" /> Browse the Shop
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-brand text-cream py-10 px-4 text-center">
        <span className="text-gold text-xs tracking-[0.3em] uppercase">Almost There</span>
        <h1 className="font-display text-4xl mt-2">Checkout</h1>
      </section>

      <section className="py-12 px-4">
        <form onSubmit={onSubmit} className="mx-auto max-w-6xl grid lg:grid-cols-[1.4fr_1fr] gap-8">
          {/* Details */}
          <div className="bg-cream/80 backdrop-blur border border-gold/30 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-display text-2xl text-brand">Delivery Details</h2>
              <p className="text-xs text-muted-foreground mt-1">We'll only use this to ship your order.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Phone" required>
                <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email" required className="sm:col-span-2">
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <textarea required rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
              </Field>
              <Field label="City" required>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </Field>
              <Field label="State" required>
                <input required value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
              </Field>
              <Field label="PIN code" required>
                <input required inputMode="numeric" pattern="[0-9]{6}" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Order notes (optional)" className="sm:col-span-2">
                <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />
              </Field>
            </div>

            <div>
              <h3 className="font-display text-xl text-brand mb-3">Payment Method</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <PayOption
                  active={form.method === "online"}
                  onClick={() => set("method", "online")}
                  icon="fa-credit-card"
                  title="Pay Online"
                  desc="UPI / Cards / Netbanking · Powered by Zoho Payments (coming soon)"
                />
                <PayOption
                  active={form.method === "cod"}
                  onClick={() => set("method", "cod")}
                  icon="fa-money-bill-wave"
                  title="Cash on Delivery"
                  desc="Pay when your order arrives at your doorstep."
                />
              </div>
              {form.method === "online" && (
                <p className="text-[11px] text-brand/80 mt-3 bg-gold/15 border border-gold/40 rounded-lg px-3 py-2">
                  <i className="fas fa-circle-info mr-1 text-gold" /> Online payments will activate once Zoho Payments is connected. Your order will be saved and we'll follow up with a secure payment link.
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 h-fit bg-cream/80 backdrop-blur border border-gold/30 rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-2xl text-brand">Order Summary</h2>
            <p className="text-xs text-muted-foreground mt-1">{count} {count === 1 ? "item" : "items"}</p>

            <ul className="mt-5 space-y-4 max-h-80 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-3 bg-white/70 backdrop-blur rounded-xl p-2.5 border border-gold/20">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-white overflow-hidden border border-border">
                    <img src={i.image} alt={i.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-brand text-sm leading-tight line-clamp-2">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground">{i.weight} · {formatPrice(i.price)}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border rounded-full bg-cream">
                        <button type="button" onClick={() => setQty(i.slug, i.qty - 1)} className="h-6 w-6 grid place-items-center text-brand hover:bg-brand/10 rounded-l-full" aria-label="Decrease">
                          <i className="fas fa-minus text-[9px]" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">{i.qty}</span>
                        <button type="button" onClick={() => setQty(i.slug, i.qty + 1)} className="h-6 w-6 grid place-items-center text-brand hover:bg-brand/10 rounded-r-full" aria-label="Increase">
                          <i className="fas fa-plus text-[9px]" />
                        </button>
                      </div>
                      <button type="button" onClick={() => remove(i.slug)} className="text-[11px] text-brand/70 hover:text-brand" aria-label={`Remove ${i.name}`}>
                        <i className="fas fa-trash-can" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-gold/30 space-y-2 text-sm">
              <Row label="Items" value={String(count)} />
              <Row label="Shipping" value="Calculated on confirmation" />
              <Row label="Total" value="Confirmed on order" bold />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-cream px-5 py-3 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? (
                <><i className="fas fa-circle-notch fa-spin" /> Placing…</>
              ) : (
                <><i className="fas fa-lock" /> Place Order</>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              By placing this order you agree to our <Link to="/terms" className="underline hover:text-brand">Terms</Link> and <Link to="/privacy" className="underline hover:text-brand">Privacy</Link>.
            </p>
          </aside>
        </form>
      </section>

      <Footer />
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-white/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold transition";

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-xs font-semibold uppercase tracking-wider text-brand/80 mb-1.5">
        {label}{required && <span className="text-brand ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function PayOption({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: string; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition ${
        active ? "border-brand bg-brand/5" : "border-border bg-white/60 hover:border-gold"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-full grid place-items-center ${active ? "bg-brand text-cream" : "bg-gold/20 text-brand"}`}>
          <i className={`fas ${icon}`} />
        </div>
        <span className="font-display text-brand">{title}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-brand font-semibold" : "text-foreground/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
