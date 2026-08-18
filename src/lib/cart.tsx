import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product, Variant } from "./products";
import { getVariants } from "./products";

export type CartItem = {
  /** Unique line key — a product can appear once per weight option */
  key: string;
  slug: string;
  name: string;
  image: string;
  weight: string;
  price: number;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, qty?: number, variant?: Variant) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "retro-cart-v1";

const lineKey = (slug: string, weight: string) => `${slug}::${weight}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        // Backfill keys for carts saved before multi-weight support
        setItems(parsed.map((i) => ({ ...i, key: i.key ?? lineKey(i.slug, i.weight) })));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartCtx["add"] = (p, qty = 1, variant) => {
    const v = variant ?? getVariants(p)[0];
    const key = lineKey(p.slug, v.weight);
    setItems((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      return [
        ...prev,
        { key, slug: p.slug, name: p.name, image: p.image, weight: v.weight, price: Number(v.price), qty },
      ];
    });
    setOpen(true);
  };
  const remove: CartCtx["remove"] = (key) => setItems((p) => p.filter((i) => i.key !== key));
  const setQty: CartCtx["setQty"] = (key, qty) =>
    setItems((p) => p.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ items, count, open, setOpen, add, remove, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
