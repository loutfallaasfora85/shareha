import { trackProductEvent, CATALOG_PIXEL_ID } from '../app/lib/productEvents';
import type { Product } from '../app/components/products/types';
const product = { _id: '6a144e7221998fa635f10360', name: 'Router',
  originalPrice: 900, salePrice: 820, price: 900 } as Product;
beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { delete window.ttq; jest.advanceTimersByTime(61000); jest.useRealTimers(); });
function ready() {
  const track = jest.fn();
  window.ttq = { _i: { [CATALOG_PIXEL_ID]: [] }, instance: jest.fn(() => ({ track })) };
  return track;
}
test.each([['view_item', 'ViewContent'], ['add_to_cart', 'AddToCart']] as const)('%s targets only the catalog pixel', (event, name) => {
  const track = ready();
  trackProductEvent(event, product, 2);
  expect(window.ttq!.instance).toHaveBeenCalledWith(CATALOG_PIXEL_ID);
  expect(track).toHaveBeenCalledTimes(1);
  expect(track).toHaveBeenCalledWith(name, {
    content_type: 'product', content_id: product._id, content_ids: [product._id],
    content_name: 'Router', currency: 'SAR', value: 1640,
    contents: [{ content_id: product._id, content_name: 'Router', price: 820, quantity: 2 }],
  });
  expect(document.querySelector('script[src*="analytics.tiktok.com"]')).toBeNull();
});
test('waits for GTM to register the target pixel then flushes once in order', () => {
  trackProductEvent('view_item', product);
  expect(window.ttq).toBeUndefined();
  window.ttq = { _i: { OTHER: [] }, instance: jest.fn() };
  trackProductEvent('add_to_cart', product);
  jest.advanceTimersByTime(1000);
  expect(window.ttq.instance).not.toHaveBeenCalled();
  const track = ready();
  jest.advanceTimersByTime(5000);
  expect(track.mock.calls.map(call => call[0])).toEqual(['ViewContent', 'AddToCart']);
});
test('blocked GTM expires queued events without an endless timer', () => {
  trackProductEvent('view_item', product);
  jest.advanceTimersByTime(61000);
  expect(jest.getTimerCount()).toBe(0);
  const track = ready();
  trackProductEvent('add_to_cart', product);
  expect(track).toHaveBeenCalledTimes(1);
  expect(track.mock.calls[0][0]).toBe('AddToCart');
});
test('invalid product data is not queued', () => {
  const track = ready();
  trackProductEvent('view_item', { ...product, _id: '' });
  trackProductEvent('view_item', { ...product, salePrice: NaN });
  trackProductEvent('add_to_cart', product, 0);
  trackProductEvent('add_to_cart', product, 1.5);
  expect(track).not.toHaveBeenCalled();
});
