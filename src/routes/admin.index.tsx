import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { getProducts, getOrders, addProduct, updateProduct, deleteProduct, uploadProductImage, migrateDataUrlImages, getCategories, addCategory, deleteCategory } from "@/lib/admin.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { getVariants } from "@/lib/products";
import type { Product, Variant } from "@/lib/products";

// Only these email addresses are allowed to access the admin dashboard.
const ALLOWED_ADMIN_EMAILS = new Set([
  "retronaturalproducts@gmail.com",
  "msantureddy177@gmail.com",
]);

// Lazy-init supabase client — avoids crashing during SSR when env vars are missing.
let _supabaseMod: { supabase: SupabaseClient } | null = null;
async function loadSupabase(): Promise<SupabaseClient | null> {
  if (_supabaseMod) return _supabaseMod.supabase;
  if (typeof window === "undefined") return null;
  try {
    _supabaseMod = await import("@/integrations/supabase/client");
    return _supabaseMod.supabase;
  } catch {
    return null;
  }
}

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

// ── Client-side image optimization ─────────────────────────────
// Resize + re-encode the image in the browser before upload so the
// payload sent to the server is tiny (100–300KB instead of several MB).
// This makes uploads fast and avoids Vercel serverless request limits.

const MAX_DIM = 1000; // max width/height in px
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.85;

async function optimizeImageFile(file: File): Promise<File> {
  // Already small — no point re-encoding
  if (file.size <= 300 * 1024 && file.type !== "image/heic") return file;

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to read image"));
      img.src = url;
    });

    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    // Small dimensions and already small file — keep the original
    if (scale === 1 && file.size <= 700 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    // Keep transparency for PNG/WebP, otherwise JPEG is much smaller
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const mime = keepAlpha ? "image/webp" : "image/jpeg";

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mime, keepAlpha ? WEBP_QUALITY : JPEG_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}.${ext}`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(url);
  }
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

// No manual session management — Supabase Auth handles everything via localStorage.

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
  categoryList,
  onSave,
  onCancel,
}: {
  initial?: Product;
  categoryList: string[];
  onSave: (data: Product | Omit<Product, "image"> & { image: string }) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? categoryList[0] ?? "Superfoods");
  const options = Array.from(new Set([...categoryList, ...(initial?.category ? [initial.category] : [])]));
  const [rows, setRows] = useState<{ weight: string; price: string; mrp: string }[]>(
    initial
      ? getVariants(initial).map((v) => ({
          weight: v.weight ?? "",
          price: String(v.price ?? ""),
          mrp: v.mrp ? String(v.mrp) : "",
        }))
      : [{ weight: "", price: "", mrp: "" }],
  );

  const updateRow = (idx: number, patch: Partial<{ weight: string; price: string; mrp: string }>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { weight: "", price: "", mrp: "" }]);
  const removeRow = (idx: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [benefitsStr, setBenefitsStr] = useState(initial?.benefits.join(", ") ?? "");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initial?.image ?? "");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Instant preview of the original
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Compress/resize in the background so the upload is fast
    try {
      const optimized = await optimizeImageFile(file);
      if (optimized !== file) {
        setSelectedFile(optimized);
        setPreviewUrl(URL.createObjectURL(optimized));
      }
    } catch {
      // Keep the original file if optimization fails
    }
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
        // If compression couldn't shrink the file (e.g. unsupported format),
        // fail fast with a clear message instead of hitting server limits.
        if (selectedFile.size > 2 * 1024 * 1024) {
          throw new Error(
            "This image is too large to upload (over 2MB after compression). Please use a JPG or PNG under 2MB.",
          );
        }
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
        alert(
          err instanceof Error && err.message
            ? err.message
            : "Failed to upload image. Please try again.",
        );
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (finalImage.startsWith("data:")) {
      // Don't resend a stored data-URL image when editing — it can be
      // megabytes and blows past serverless request limits. The server
      // keeps the existing image when an empty one is sent.
      finalImage = "";
    }

    const variants: Variant[] = rows
      .filter((r) => r.weight.trim() && Number(r.price) > 0)
      .map((r) => ({
        weight: r.weight.trim(),
        price: Number(r.price),
        ...(r.mrp ? { mrp: Number(r.mrp) } : {}),
      }));

    if (variants.length === 0) {
      alert("Add at least one size with a weight and price.");
      return;
    }

    onSave({
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      name,
      tagline,
      category,
      weight: variants[0].weight,
      price: variants[0].price,
      mrp: variants[0].mrp,
      variants,
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
            {options.map((c) => (
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

      {/* Sizes / prices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70">
            Sizes & Prices
          </label>
          <button type="button" onClick={addRow}
            className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1">
            <i className="fas fa-plus" /> Add size
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <input required={idx === 0} value={r.weight} onChange={(e) => updateRow(idx, { weight: e.target.value })} placeholder="Weight e.g. 170g"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
              <input required={idx === 0} type="number" min={0} value={r.price} onChange={(e) => updateRow(idx, { price: e.target.value })} placeholder="Price ₹"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
              <input type="number" min={0} value={r.mrp} onChange={(e) => updateRow(idx, { mrp: e.target.value })} placeholder="MRP ₹"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
              <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                aria-label="Remove size"
                className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-brand hover:bg-brand/10 transition disabled:opacity-30">
                <i className="fas fa-trash text-xs" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground/50 mt-2">The first size is shown as the default on the website.</p>
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
              <p className="text-xs text-foreground/50 mt-1">PNG, JPG, WebP · auto-compressed before upload</p>
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
        <button type="submit" disabled={uploading}
          className="rounded-full bg-brand text-brand-foreground px-6 py-2.5 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition flex items-center gap-2 disabled:opacity-60">
          {uploading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-floppy-disk" />}
          {uploading ? "Uploading…" : "Save Product"}
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
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Check Supabase auth session on mount
  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | undefined;
    (async () => {
      const sb = await loadSupabase();
      if (!sb || !mounted) { setAuthChecking(false); return; }
      const { data } = await sb.auth.getSession();
      if (!mounted) return;
      const user = data.session?.user;
      if (user && ALLOWED_ADMIN_EMAILS.has((user.email ?? "").toLowerCase())) {
        setAuthed(true);
      }
      setAuthChecking(false);
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        setAuthed(!!(user && ALLOWED_ADMIN_EMAILS.has((user.email ?? "").toLowerCase())));
      });
      unsub = () => subscription.unsubscribe();
    })();
    return () => { mounted = false; unsub?.(); };
  }, []);

  // Tab state
  const [tab, setTab] = useState<"products" | "orders" | "categories">("products");

  // Category state
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [catBusy, setCatBusy] = useState(false);

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
  const [migrating, setMigrating] = useState(false);

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

  // Load categories when authed
  useEffect(() => {
    if (!authed) return;
    getCategories().then(setCategoryList).catch(() => {});
  }, [authed]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setCatBusy(true);
    try {
      await addCategory({ data: name });
      setCategoryList((prev) => [...prev, name]);
      setNewCategory("");
      showToast(`Category "${name}" added`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add category", false);
    } finally {
      setCatBusy(false);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`Delete the category "${name}"? Products already using it keep their label.`)) return;
    setCatBusy(true);
    try {
      await deleteCategory({ data: name });
      setCategoryList((prev) => prev.filter((c) => c !== name));
      showToast(`Category "${name}" deleted`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete category", false);
    } finally {
      setCatBusy(false);
    }
  };

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

  // Login handler — uses Supabase Auth email/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const sb = await loadSupabase();
      if (!sb) {
        setLoginError("Supabase is not configured. Check environment variables.");
        return;
      }
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setLoginError(error.message || "Invalid email or password. Try again.");
        return;
      }
      // Verify the signed-in email is in the allowed list
      const user = (await sb.auth.getUser()).data.user;
      if (!user || !ALLOWED_ADMIN_EMAILS.has((user.email ?? "").toLowerCase())) {
        await sb.auth.signOut();
        setLoginError("Access denied. This email is not authorized for admin access.");
        return;
      }
      setAuthed(true);
    } catch {
      setLoginError("Something went wrong. Try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setLoginError("");
    try {
      const sb2 = await loadSupabase();
      if (!sb2) {
        setLoginError("Supabase is not configured. Check environment variables.");
        return;
      }
      const { error } = await sb2.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) {
        setLoginError(error.message || "Failed to send reset email.");
      } else {
        setResetSent(true);
      }
    } catch {
      setLoginError("Something went wrong. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    const sb = await loadSupabase();
    await sb?.auth.signOut();
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add product";
      showToast(msg, false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Product) => {
    setSaving(true);
    try {
      await updateProduct({ data });
      setProducts((prev) =>
        prev.map((p) =>
          p.slug === data.slug ? { ...data, image: data.image || p.image } : p,
        ),
      );
      setEditTarget(null);
      showToast(`"${data.name}" updated`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update product";
      showToast(msg, false);
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete product";
      showToast(msg, false);
    } finally {
      setDeleting(false);
    }
  };

  const handleMigrateImages = async () => {
    if (!confirm("Move any old embedded images to Supabase Storage? This makes pages load faster and fixes edit failures.")) return;
    setMigrating(true);
    try {
      const res = await migrateDataUrlImages();
      showToast(
        `Fixed: ${res.migrated} image(s) moved to storage${res.failed ? `, ${res.failed} failed` : ""}`,
        res.failed === 0,
      );
      const list = await getProducts();
      setProducts(list);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to fix images", false);
    } finally {
      setMigrating(false);
    }
  };

  // ── Login Screen ──

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4">
        <i className="fas fa-spinner fa-spin text-3xl text-gold" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-cream rounded-2xl border border-gold/30 shadow-xl p-8 space-y-6">
            <div className="text-center">
              <Link to="/" className="inline-block mb-4">
                <img src="/media/33191-removebg-preview.png" alt="Retro Natural Products" className="h-16 w-auto mx-auto" />
              </Link>
              <h1 className="font-display text-2xl text-brand">Admin Access</h1>
              <p className="text-sm text-foreground/60 mt-1">
                {loginMode === "login" ? "Sign in with your email and password" : "Reset your password"}
              </p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <i className="fas fa-exclamation-circle" /> {loginError}
              </div>
            )}

            {resetSent && loginMode === "forgot" ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <i className="fas fa-check-circle" /> Check your email for the password reset link.
              </div>
            ) : (
              <form onSubmit={loginMode === "login" ? handleLogin : handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
                    autoFocus
                  />
                </div>

                {loginMode === "login" && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-foreground/70 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loggingIn || resetLoading}
                  className="w-full rounded-full bg-brand text-brand-foreground py-3 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loggingIn || resetLoading ? (
                    <><i className="fas fa-spinner fa-spin" /> {loginMode === "login" ? "Verifying..." : "Sending..."}</>
                  ) : (
                    <><i className="fas fa-lock-open" /> {loginMode === "login" ? "Sign In" : "Send Reset Link"}</>
                  )}
                </button>

                <div className="text-center space-y-2">
                  {loginMode === "login" ? (
                    <button
                      type="button"
                      onClick={() => { setLoginMode("forgot"); setLoginError(""); setResetSent(false); }}
                      className="text-xs text-brand hover:underline"
                    >
                      Forgot your password?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setLoginMode("login"); setLoginError(""); setResetSent(false); }}
                      className="text-xs text-brand hover:underline"
                    >
                      <i className="fas fa-arrow-left mr-1" /> Back to sign in
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="text-center">
              <Link to="/" className="text-xs text-foreground/50 hover:text-brand transition">
                <i className="fas fa-arrow-left mr-1" /> Back to site
              </Link>
            </div>
          </div>
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
          <button
            onClick={() => setTab("categories")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition ${
              tab === "categories"
                ? "bg-brand text-cream shadow-sm"
                : "text-foreground/60 hover:text-brand hover:bg-brand/5"
            }`}
          >
            <i className="fas fa-tags mr-1.5" /> Categories
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: products.length, icon: "fa-box", color: "bg-brand" },
            { label: "Categories", value: categoryList.length, icon: "fa-tags", color: "bg-gold text-brand" },
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
            <div className="flex items-center gap-2">
              <button onClick={handleMigrateImages} disabled={migrating}
                className="rounded-full border border-border px-4 py-2.5 font-semibold uppercase tracking-wider text-xs hover:bg-brand/5 transition flex items-center gap-2 disabled:opacity-50">
                {migrating ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-wand-magic-sparkles" />}
                {migrating ? "Fixing…" : "Fix old images"}
              </button>
              <button onClick={() => setAddOpen(true)}
                className="rounded-full bg-brand text-brand-foreground px-5 py-2.5 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition flex items-center gap-2">
                <i className="fas fa-plus" /> Add Product
              </button>
            </div>
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

        {/* ── Categories Section ── */}
        {tab === "categories" && (
        <div className="bg-cream rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-display text-xl text-brand">Categories</h2>
            <p className="text-xs text-foreground/60 mt-0.5">Create the categories products can be grouped under</p>
          </div>
          <div className="p-6 space-y-6">
            <form onSubmit={handleAddCategory} className="flex flex-wrap gap-3">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name (e.g. Dairy Foods)"
                className="flex-1 min-w-[220px] rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              />
              <button type="submit" disabled={catBusy}
                className="rounded-full bg-brand text-brand-foreground px-5 py-2.5 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                <i className="fas fa-plus" /> Add Category
              </button>
            </form>

            {categoryList.length === 0 ? (
              <p className="text-sm text-foreground/60">No categories yet.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border bg-white">
                {categoryList.map((c) => (
                  <li key={c} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{c}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-foreground/50">
                        {products.filter((p) => p.category === c).length} product(s)
                      </span>
                      <button onClick={() => handleDeleteCategory(c)} disabled={catBusy}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 grid place-items-center text-foreground/60 hover:text-red-600 transition disabled:opacity-50"
                        title="Delete">
                        <i className="fas fa-trash-can text-xs" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                            o.status === "paid"
                              ? "bg-leaf/15 text-leaf-dark border border-leaf/30"
                              : o.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : o.status === "shipped"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : o.status === "delivered"
                              ? "bg-leaf/15 text-leaf-dark border border-leaf/30"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {o.status === "paid" && <i className="fas fa-credit-card" />}
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
          categoryList={categoryList}
          onSave={(data) => handleAdd(data as Product)}
          onCancel={() => !saving && setAddOpen(false)}
        />
      </Modal>

      {/* ── Edit Product Modal ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Product">
        {editTarget && (
          <ProductForm
            initial={editTarget}
            categoryList={categoryList}
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
                  viewOrder.status === "paid"
                    ? "bg-leaf/15 text-leaf-dark border border-leaf/30"
                    : viewOrder.status === "pending"
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
