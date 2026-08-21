import type { Product } from "./products";
import { products as fallbackProducts } from "./products";

/** Never let a remote product-loading failure leave the storefront empty. */
export function withProductFallback(value: Product[] | null | undefined): Product[] {
  return Array.isArray(value) && value.length > 0 ? value : fallbackProducts;
}
