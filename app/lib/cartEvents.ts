import type { Product } from '../components/products/types';
import { trackSnapProduct } from './snapPixel';
import { trackProductEvent } from './productEvents';

// Called once, after the cart store has accepted an addition.
export function trackCartAddition(product: Product, quantity: number) {
  const price = product.salePrice ?? product.originalPrice ?? product.price ?? 0;
  const value = price * quantity;

  // Guard: skip tracking if essential data is missing or invalid.
  if (!product._id?.trim() || !Number.isFinite(value) || value < 0 ||
      !Number.isInteger(quantity) || quantity < 1) return;

  trackSnapProduct('ADD_CART', product, quantity);
  trackProductEvent('add_to_cart', product, quantity);
}
