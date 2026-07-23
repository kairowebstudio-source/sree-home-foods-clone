import { Link } from "@tanstack/react-router";
import { useState } from "react";
import logoAsset from "@/assets/retro-logo-new.png.asset.json";
const logo = logoAsset.url;
import { useCart } from "@/lib/cart";


const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/wholesale", label: "Wholesale" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Retro Natural Products" className="h-20 md:h-28 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-semibold tracking-wide uppercase text-foreground/80 hover:text-brand transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-gold hover:after:w-full after:transition-all"
              activeProps={{ className: "text-brand after:w-full" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            <i className="fab fa-whatsapp" /> Order
          </a>
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${count} items`}
            className="relative h-10 w-10 grid place-items-center rounded-full border border-gold/50 bg-cream/70 backdrop-blur text-brand hover:bg-brand hover:text-cream transition"
          >
            <i className="fas fa-basket-shopping" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gold text-brand text-[10px] font-bold grid place-items-center border border-cream">
                {count}
              </span>
            )}
          </button>

          <button
            className="md:hidden h-10 w-10 grid place-items-center rounded-md border border-border"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <i className={`fas ${open ? "fa-times" : "fa-bars"} text-brand`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-cream">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 px-2 text-sm font-semibold uppercase tracking-wide text-foreground/80 hover:text-brand border-b border-border/60"
                activeProps={{ className: "text-brand" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
