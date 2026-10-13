import type { Product } from '../components/products/types';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// GTM owns pixel loading and dispatch. This module only supplies product data.
export function trackProductEvent(event: 'view_item' | 'add_to_cart', product: Product, quantity = 1): boolean {
  if (typeof window === 'undefined') return false;
  const price = product.salePrice ?? product.originalPrice ?? product.price;
  const value = price * quantity;
  if (!product._id?.trim() || !Number.isFinite(value) || value < 0 ||
      !Number.isInteger(quantity) || quantity < 1) return false;

  try {
    window.dataLayer = window.dataLayer || [];
    // Prevent GTM's recursive data model from retaining previous line items.
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event,
      ecommerce: {
        currency: 'SAR',
        value,
        items: [{ item_id: product._id, item_name: product.name, price, quantity }],
      },
    });
    return true;
  } catch {
    // Analytics must not interrupt a successful cart addition.
    return false;
  }
}
