import type { Product } from '../components/products/types';

export const CATALOG_PIXEL_ID = 'DB4IAG3C77U4O1M3UD7G';
type Payload = {
  content_type: 'product'; content_id: string; content_ids: string[];
  content_name: string; currency: string; value: number;
  contents: { content_id: string; content_name: string; quantity: number; price: number }[];
};
declare global {
  interface Window {
    ttq?: {
      _i?: Record<string, unknown>;
      instance?: (id: string) => { track: (event: string, payload: Payload) => void };
    };
  }
}

const pending: { event: string; payload: Payload; expires: number }[] = [];
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  if (retryTimer !== undefined) clearTimeout(retryTimer);
  retryTimer = undefined;
  while (pending.length && pending[0].expires <= Date.now()) pending.shift();
  const tracker = window.ttq;
  // GTM's bootstrap registers _i before loading the SDK. Never create an
  // instance early: ttq.load would overwrite its queue and lose the event.
  if (tracker?._i?.[CATALOG_PIXEL_ID] && typeof tracker.instance === 'function') {
    while (pending.length) {
      const item = pending.shift()!;
      try {
        tracker.instance(CATALOG_PIXEL_ID).track(item.event, item.payload);
      } catch {
        // Do not retry a possibly accepted event and risk counting it twice.
      }
    }
  }
  if (pending.length) retryTimer = setTimeout(flush, 250);
}

// GTM alone loads the pixel; the site supplies these two events directly.
// True means accepted locally, not confirmed receipt by TikTok.
export function trackProductEvent(event: 'view_item' | 'add_to_cart', product: Product, quantity = 1): boolean {
  if (typeof window === 'undefined') return false;
  const price = product.salePrice ?? product.originalPrice ?? product.price;
  const value = price * quantity;
  if (!product._id?.trim() || !Number.isFinite(value) || value < 0 ||
      !Number.isInteger(quantity) || quantity < 1) return false;
  const payload: Payload = {
    content_type: 'product', content_id: product._id, content_ids: [product._id],
    content_name: product.name, currency: 'SAR', value,
    contents: [{ content_id: product._id, content_name: product.name, price, quantity }],
  };
  // Bound memory and waiting time if GTM is blocked or consent is not granted.
  if (pending.length >= 100) pending.shift();
  pending.push({ event: event === 'view_item' ? 'ViewContent' : 'AddToCart',
    payload, expires: Date.now() + 60000 });
  flush();
  return true;
}
