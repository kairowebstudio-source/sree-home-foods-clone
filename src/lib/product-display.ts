import type { Product } from "./products";
import { products as fallbackProducts } from "./products";

/** Keep the storefront populated when the remote product source is empty or unavailable. */
export function withProductFallback(value: Product[] | null | undefined): Product[] {
  return Array.isArray(value) && value.length > 0 ? value : fallbackProducts;
}
