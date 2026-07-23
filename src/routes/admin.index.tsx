import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { getProducts, getOrders, addProduct, updateProduct, deleteProduct, adminLogin, uploadProductImage } from "@/lib/admin.server";
import { categories } from "@/lib/products";
import type { Product } from "@/lib/products";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Retro Natural Products" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const SESSION_KEY = "retro-admin-auth";

type Session = { authed: true; at: number };

function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    // Expire after 2 hours
    if (Date.now() - s.at > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function setSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ authed: true, at: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Modal component ────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream rounded-2xl border border-gold/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream z-10 flex items-center justify-between px-6 py-4 border-b border-border rounded-t-2xl">
          <h2 className="font-display text-xl text-brand">{title}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-brand/10 grid place-items-center text-foreground/60 hover:text-brand transition">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Product form (shared by Add & Edit) ────────────────────────

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: (data: Product | Omit<Product, "image"> & { image: string }) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "Powders");
  const [weight, setWeight] = useState(initial?.weight ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [mrp, setMrp] = useState(String(initial?.mrp ?? ""));
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [benefitsStr, setBenefitsStr] = useState(initial?.benefits.join(", ") ?? "");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initial?.image ?? "");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const benefits = benefitsStr
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    let finalImage = imageUrl || "/placeholder.svg";

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      try {
        // Read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data:image/...;base64, prefix
            const b64 = result.split(",")[1];
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const filename = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { url } = await uploadProductImage({
          data: {
            base64,
            filename,
            contentType: selectedFile.type,
          },
        });
        finalImage = url;
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Failed to upload image. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSave({
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      name,
      tagline,
      category: category as Product["category"],
      weight,
      price: Number(price),
      mrp: mrp ? Number(mrp) : undefined,
      image: finalImage,
      description,
      benefits,
    } as Product & { image: string });
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Slug</label>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="product-slug"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30">
            {categories.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Product Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ashwagandha Powder"
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Tagline</label>
        <input required value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A nutritional powerhouse"
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Weight</label>
          <input required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="170g"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Price (₹)</label>
          <input required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="349"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">MRP (₹)</label>
          <input type="number" min={0} value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="449"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1.5">Product Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          onClick={triggerFilePicker}
          className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition group"
        >
          {previewUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-24 w-24 rounded-xl object-contain bg-white border border-border shrink-0"
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : initial?.name || "Current image"}
                </p>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Click to replace"}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-brand font-semibold mt-2 group-hover:underline">
                  <i className="fas fa-rotate" /> Change image
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="mx-auto h-14 w-14 rounded-full bg-brand/10 text-brand grid place-items-center text-xl mb-3">
                <i className="fas fa-cloud-arrow-up" />
              </div>
              <p className="text-sm font-semibold text-foreground">Click to upload an image</p>
              <p className="text-xs text-foreground/50 mt-1">PNG, JPG, WebP up to 5MB</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Description</label>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Product description..."
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1">Benefits (comma-separated)</label>
        <input value={benefitsStr} onChange={(e) => setBenefitsStr(e.target.value)} placeholder="Calcium, Iron, Fibre, Antioxidants"
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit"
          className="rounded-full bg-brand text-brand-foreground px-6 py-2.5 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition flex items-center gap-2">
          <i className="fas fa-floppy-disk" /> Save Product
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-border px-6 py-2.5 font-semibold text-sm text-foreground/70 hover:bg-accent/30 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main Admin Page ────────────────────────────────────────────

function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(!!getSession());
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab state
  const [tab, setTab] = useState<"products" | "orders">("products");

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Order state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load products when authed
  useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const list = await getProducts();
        setProducts(list);
      } catch (e) {
        console.error(e);
        showToast("Failed to load products", false);
      } finally {
        setLoading(false);
      }
    })();
  }, [authed, showToast]);

  // Load orders when tab switches to orders
  useEffect(() => {
    if (!authed || tab !== "orders") return;
    (async () => {
      setOrdersLoading(true);
      try {
        const list = await getOrders();
        setOrders(list);
      } catch (e) {
        console.error(e);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [authed, tab]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await adminLogin({ data: password });
      if (res.success) {
        setSession();
        setAuthed(true);
      } else {
        setLoginError("Incorrect password. Try again.");
      }
    } catch {
      setLoginError("Something went wrong. Try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setAuthed(false);
    router.invalidate();
  };

  // ── CRUD handlers ──

  const handleAdd = async (data: Product) => {
    setSaving(true);
    try {
      const created = await addProduct({ data });
      setProducts((prev) => [...prev, created]);
      setAddOpen(false);
      showToast(`"${created.name}" added successfully`);
    } catch {
      showToast("Failed to add product", false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Product) => {
    setSaving(true);
    try {
      await updateProduct({ data });
      setProducts((prev) => prev.map((p) => (p.slug === data.slug ? data : p)));
      setEditTarget(null);
      showToast(`"${data.name}" updated`);
    } catch {
      showToast("Failed to update product", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct({ data: deleteTarget.slug });
      setProducts((prev) => prev.filter((p) => p.slug !== deleteTarget.slug));
      setDeleteTarget(null);
      showToast(`"${deleteTarget.name}" deleted`);
    } catch {
      showToast("Failed to delete product", false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Login Screen ──

  if (!authed) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4">
        <div className="w-full max-w-sm">
          <form onSubmit={handleLogin} className="bg-cream rounded-2xl border border-gold/30 shadow-xl p-8 space-y-6">
            <div className="text-center">
              <Link to="/" className="inline-block mb-4">
                <img src="/media/logo.jpeg" alt="Retro Natural Products" className="h-16 w-auto mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </Link>
              <h1 className="font-display text-2xl text-brand">Admin Access</h1>
              <p className="text-sm text-foreground/60 mt-1">Enter your password to continue</p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <i className="fas fa-exclamation-circle" /> {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-full bg-brand text-brand-foreground py-3 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-lock-open" />}
              {loggingIn ? "Verifying..." : "Sign In"}
            </button>

            <div className="text-center">
              <Link to="/" className="text-xs text-foreground/50 hover:text-brand transition">
                <i className="fas fa-arrow-left mr-1" /> Back to site
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──

  return (
    <div className="min-h-screen bg-background">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all animate-in ${
            toast.ok ? "bg-leaf text-white" : "bg-destructive text-destructive-foreground"
          }`}
        >
          <i className={`fas ${toast.ok ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          {toast.msg}
        </div>
      )}

      {/* Admin Header */}
      <header className="bg-brand text-cream">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gold hover:text-cream transition">
              <i className="fas fa-store" />
            </Link>
            <span className="h-6 w-px bg-cream/20" />
            <h1 className="font-display text-lg">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/shop" className="text-xs text-cream/70 hover:text-cream transition hidden sm:inline">
              View Shop
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-cream/15 text-cream px-4 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-cream/25 transition">
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-cream rounded-xl border border-border p-1 w-fit">
          <button
            onClick={() => setTab("products")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition ${
              tab === "products"
                ? "bg-brand text-cream shadow-sm"
                : "text-foreground/60 hover:text-brand hover:bg-brand/5"
            }`}
          >
            <i className="fas fa-box mr-1.5" /> Products
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition ${
              tab === "orders"
                ? "bg-brand text-cream shadow-sm"
                : "text-foreground/60 hover:text-brand hover:bg-brand/5"
            }`}
          >
            <i className="fas fa-truck mr-1.5" /> Orders
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: products.length, icon: "fa-box", color: "bg-brand" },
            { label: "Categories", value: categories.length - 1, icon: "fa-tags", color: "bg-gold text-brand" },
            { label: "Lowest Price", value: products.length ? `₹${Math.min(...products.map((p) => p.price))}` : "—", icon: "fa-indian-rupee-sign", color: "bg-leaf" },
            { label: "Highest Price", value: products.length ? `₹${Math.max(...products.map((p) => p.price))}` : "—", icon: "fa-arrow-up", color: "bg-secondary" },
          ].map((s) => (
            <div key={s.label} className="bg-cream rounded-xl border border-border p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${s.color} text-white grid place-items-center shrink-0`}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-foreground/60 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Products Section ── */}
        {tab === "products" && (
        <div className="bg-cream rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-brand">Products</h2>
              <p className="text-xs text-foreground/60 mt-0.5">Manage your product catalog</p>
            </div>
            <button onClick={() => setAddOpen(true)}
              className="rounded-full bg-brand text-brand-foreground px-5 py-2.5 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition flex items-center gap-2">
              <i className="fas fa-plus" /> Add Product
            </button>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <i className="fas fa-spinner fa-spin text-3xl text-gold" />
              <p className="mt-3 text-sm text-foreground/60">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <i className="fas fa-box-open text-4xl text-foreground/20" />
              <p className="mt-3 text-sm text-foreground/60">No products yet. Add your first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand/5 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs hidden sm:table-cell">Weight</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Price</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs hidden sm:table-cell">MRP</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.slug} className="border-b border-border/50 hover:bg-brand/5 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-contain bg-white border border-border shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-foreground/50">{p.tagline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider">{p.category}</span>
                      </td>
                      <td className="px-4 py-4 text-foreground/70 hidden sm:table-cell">{p.weight}</td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">₹{p.price}</td>
                      <td className="px-4 py-4 text-right text-foreground/50 line-through hidden sm:table-cell">
                        {p.mrp ? `₹${p.mrp}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(p)}
                            className="h-8 w-8 rounded-lg hover:bg-brand/10 grid place-items-center text-foreground/60 hover:text-brand transition"
                            title="Edit"
                          >
                            <i className="fas fa-pen text-xs" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 grid place-items-center text-foreground/60 hover:text-red-600 transition"
                            title="Delete"
                          >
                            <i className="fas fa-trash-can text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>)}

        {/* ── Orders Section ── */}
        {tab === "orders" && (
        <div className="bg-cream rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-brand">Orders</h2>
              <p className="text-xs text-foreground/60 mt-0.5">View and manage customer orders</p>
            </div>
            {orders.length > 0 && (
              <span className="text-xs text-foreground/50 bg-brand/5 rounded-full px-3 py-1">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {ordersLoading ? (
            <div className="p-16 text-center">
              <i className="fas fa-spinner fa-spin text-3xl text-gold" />
              <p className="mt-3 text-sm text-foreground/60">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center">
              <i className="fas fa-receipt text-4xl text-foreground/20" />
              <p className="mt-3 text-sm text-foreground/60">No orders yet.</p>
              <p className="text-xs text-foreground/40 mt-1">Orders placed on the website will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand/5 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Order</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs hidden md:table-cell">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const itemCount = (o.items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
                    return (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-brand/5 transition">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-brand font-semibold">#{o.id?.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div>
                            <p className="font-semibold text-foreground">{o.customer_name}</p>
                            <p className="text-xs text-foreground/50">{o.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-foreground/70 hidden sm:table-cell text-xs">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            o.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : o.status === "shipped"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : o.status === "delivered"
                              ? "bg-leaf/15 text-leaf-dark border border-leaf/30"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {o.status === "pending" && <i className="fas fa-clock" />}
                            {o.status === "shipped" && <i className="fas fa-shipping-fast" />}
                            {o.status === "delivered" && <i className="fas fa-check-circle" />}
                            {o.status === "cancelled" && <i className="fas fa-ban" />}
                            {o.status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-foreground">
                          {formatPrice(o.total)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => setViewOrder(o)}
                            className="h-8 w-8 rounded-lg hover:bg-brand/10 grid place-items-center text-foreground/60 hover:text-brand transition"
                            title="View details"
                          >
                            <i className="fas fa-eye text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>)}

        {/* Footer note */}
        <p className="text-center text-xs text-foreground/40 mt-8">
          <i className="fas fa-shield-halved mr-1" />
          {tab === "products" ? "Changes are saved immediately." : "Orders are loaded from Supabase."}
        </p>
      </main>

      {/* ── Add Product Modal ── */}
      <Modal open={addOpen} onClose={() => !saving && setAddOpen(false)} title="Add New Product">
        <ProductForm
          onSave={(data) => handleAdd(data as Product)}
          onCancel={() => !saving && setAddOpen(false)}
        />
      </Modal>

      {/* ── Edit Product Modal ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Product">
        {editTarget && (
          <ProductForm
            initial={editTarget}
            onSave={(data) => handleEdit(data as Product)}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* ── Order Detail Modal ── */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details">
        {viewOrder && (
          <div className="space-y-6">
            {/* Customer info */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-display text-lg text-brand mb-3">Customer</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-foreground/50 uppercase tracking-wider">Name</span>
                  <p className="font-semibold text-foreground">{viewOrder.customer_name}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground/50 uppercase tracking-wider">Phone</span>
                  <p className="font-semibold text-foreground">{viewOrder.phone}</p>
                </div>
                {viewOrder.email && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-foreground/50 uppercase tracking-wider">Email</span>
                    <p className="font-semibold text-foreground">{viewOrder.email}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-xs text-foreground/50 uppercase tracking-wider">Delivery Address</span>
                  <p className="font-semibold text-foreground">{viewOrder.address}</p>
                </div>
              </div>
            </div>

            {/* Order info */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-brand">Order</h3>
                <span className="font-mono text-xs text-foreground/50">ID: {viewOrder.id}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  viewOrder.status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : viewOrder.status === "shipped"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : viewOrder.status === "delivered"
                    ? "bg-leaf/15 text-leaf-dark border border-leaf/30"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {viewOrder.status || "pending"}
                </span>
                <span className="text-xs text-foreground/50">{formatDate(viewOrder.created_at)}</span>
              </div>

              {/* Items */}
              <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-2">Items</h4>
              <div className="divide-y divide-border/50 border border-border rounded-lg overflow-hidden">
                {(viewOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-white/50">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-foreground/50">{formatPrice(item.price)} × {item.qty}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="font-display text-lg text-brand">Total</span>
                <span className="font-display text-lg text-brand">{formatPrice(viewOrder.total)}</span>
              </div>

              {viewOrder.notes && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-amber-800">{viewOrder.notes}</p>
                </div>
              )}
            </div>

            <button onClick={() => setViewOrder(null)}
              className="w-full rounded-full border border-border px-6 py-2.5 font-semibold text-sm text-foreground/70 hover:bg-accent/30 transition">
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product">
        {deleteTarget && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 grid place-items-center shrink-0">
                <i className="fas fa-triangle-exclamation text-xl" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Are you sure?</p>
                <p className="text-sm text-red-600 mt-0.5">
                  This will permanently delete <strong>"{deleteTarget.name}"</strong>. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="rounded-full bg-red-600 text-white px-6 py-2.5 font-bold uppercase tracking-wider text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2">
                {deleting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-can" />}
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="rounded-full border border-border px-6 py-2.5 font-semibold text-sm text-foreground/70 hover:bg-accent/30 transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
