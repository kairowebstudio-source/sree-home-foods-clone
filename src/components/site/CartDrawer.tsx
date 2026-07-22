import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, open, setOpen, remove, setQty, count, clear } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);


  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[100] bg-[#1a0d0d]/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[101] h-full w-full sm:w-[420px] bg-cream/95 backdrop-blur-xl border-l border-gold/30 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/30 bg-brand text-cream">
          <div>
            <span className="text-gold text-[10px] tracking-[0.3em] uppercase">Your Basket</span>
            <h2 className="font-display text-2xl">Cart · {count}</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-9 w-9 grid place-items-center rounded-full border border-gold/40 hover:bg-gold hover:text-brand transition"
            aria-label="Close cart"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="h-20 w-20 rounded-full bg-brand/10 text-brand grid place-items-center text-3xl mb-4">
                <i className="fas fa-basket-shopping" />
              </div>
              <p className="font-display text-xl text-brand">Your basket is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Explore our handcrafted collection.</p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-cream px-6 py-2.5 font-bold uppercase tracking-wider text-xs hover:opacity-90"
              >
                <i className="fas fa-shopping-bag" /> Shop Now
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-4 bg-white/70 backdrop-blur rounded-xl p-3 border border-gold/20">
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-white overflow-hidden border border-border">
                    <img src={i.image} alt={i.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/shop/$slug"
                      params={{ slug: i.slug }}
                      onClick={() => setOpen(false)}
                      className="font-display text-brand text-sm leading-tight line-clamp-2 hover:underline"
                    >
                      {i.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.weight}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border rounded-full bg-cream">
                        <button
                          onClick={() => setQty(i.slug, i.qty - 1)}
                          className="h-7 w-7 grid place-items-center text-brand hover:bg-brand/10 rounded-l-full"
                          aria-label="Decrease"
                        >
                          <i className="fas fa-minus text-[10px]" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                        <button
                          onClick={() => setQty(i.slug, i.qty + 1)}
                          className="h-7 w-7 grid place-items-center text-brand hover:bg-brand/10 rounded-r-full"
                          aria-label="Increase"
                        >
                          <i className="fas fa-plus text-[10px]" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.slug)}
                        className="text-xs text-brand/70 hover:text-brand"
                        aria-label={`Remove ${i.name}`}
                      >
                        <i className="fas fa-trash-can" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gold/30 bg-cream/80 backdrop-blur px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">Items</span>
              <span className="font-semibold text-brand">{count}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Shipping and taxes are calculated at checkout.
            </p>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-cream px-5 py-3 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition"
            >
              <i className="fas fa-lock" /> Checkout
            </Link>

            <button
              onClick={clear}
              className="w-full text-xs text-brand/70 hover:text-brand py-1"
            >
              Clear basket
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
