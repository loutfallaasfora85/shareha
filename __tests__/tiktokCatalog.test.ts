import { trackProductEvent } from '../app/lib/productEvents';
import type { Product } from '../app/components/products/types';

const product = { _id: '6a144e7221998fa635f10360', name: 'Router',
  originalPrice: 900, salePrice: 820, price: 900 } as Product;
afterEach(() => { delete window.dataLayer; });

test.each(['view_item', 'add_to_cart'] as const)('%s queues catalog IDs before GTM loads', event => {
  expect(trackProductEvent(event, product, 2)).toBe(true);
  expect(window.dataLayer).toEqual([
    { ecommerce: null },
    { event, ecommerce: { currency: 'SAR', value: 1640,
      items: [{ item_id: product._id, item_name: 'Router', price: 820, quantity: 2 }] } },
  ]);
  expect('ttq' in window).toBe(false);
  expect(document.querySelector('script[src*="analytics.tiktok.com"]')).toBeNull();
});

test('preserves the GTM queue and clears stale ecommerce data between events', () => {
  const queue = [{ event: 'gtm.js' }];
  window.dataLayer = queue;
  trackProductEvent('view_item', product);
  trackProductEvent('add_to_cart', product, 3);
  expect(window.dataLayer).toBe(queue);
  expect(queue).toHaveLength(5);
  expect(queue[0]).toEqual({ event: 'gtm.js' });
  expect(queue[3]).toEqual({ ecommerce: null });
});

test('rejects invalid IDs, prices and quantities', () => {
  expect(trackProductEvent('view_item', { ...product, _id: '' })).toBe(false);
  expect(trackProductEvent('view_item', { ...product, salePrice: NaN })).toBe(false);
  expect(trackProductEvent('add_to_cart', product, 0)).toBe(false);
  expect(trackProductEvent('add_to_cart', product, 1.5)).toBe(false);
  expect(window.dataLayer).toBeUndefined();
});
