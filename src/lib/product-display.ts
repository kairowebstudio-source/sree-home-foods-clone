import type { Product } from "./products";
import { products as fallbackProducts } from "./products";

/**
 * Keep the storefront usable even when the remote product source is unavailable.
 * Supabase remains the source of truth when it returns products, while the
 * bundled catalogue prevents an empty storefront during configuration/errors.
 */
export function withProductFallback(value: Product[] | null | undefined): Product[] {
  return Array.isArray(value) && value.length > 0 ? value : fallbackProducts;
}
