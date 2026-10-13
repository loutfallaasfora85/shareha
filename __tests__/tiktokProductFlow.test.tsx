import { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useProductView } from '../app/lib/useProductView';
import { useCartStore } from '../app/store/cartStore';
import { trackSnapProduct } from '../app/lib/snapPixel';
import type { Product } from '../app/components/products/types';

jest.mock('../app/lib/snapPixel', () => ({ trackSnapProduct: jest.fn() }));
const product = { _id: '6a144e7221998fa635f10360', name: 'Router',
  originalPrice: 900, salePrice: 820, price: 900 } as Product;
beforeEach(() => {
  window.dataLayer = [];
  useCartStore.getState().clear();
  jest.clearAllMocks();
});
afterEach(() => { delete window.dataLayer; });

test('product views are not duplicated by StrictMode or rerenders', () => {
  const { rerender } = renderHook(({ item }) => useProductView(item), {
    initialProps: { item: product as Product | null }, wrapper: StrictMode,
  });
  rerender({ item: { ...product } });
  expect(window.dataLayer).toHaveLength(2);
  expect(window.dataLayer![1]).toEqual(expect.objectContaining({ event: 'view_item' }));
  rerender({ item: { ...product, _id: 'another-product' } });
  expect(window.dataLayer).toHaveLength(4);
});

test('a product loaded after the first render is tracked', () => {
  const { rerender } = renderHook(({ item }) => useProductView(item), {
    initialProps: { item: null as Product | null },
  });
  expect(window.dataLayer).toHaveLength(0);
  rerender({ item: product });
  expect(window.dataLayer).toHaveLength(2);
});

test('each cart addition reports the added quantity and preserves Snap tracking', () => {
  act(() => {
    useCartStore.getState().addItem(product, 2);
    useCartStore.getState().addItem(product, 1);
  });
  expect(useCartStore.getState().items[0].qty).toBe(3);
  expect(window.dataLayer).toHaveLength(4);
  expect(window.dataLayer![1]).toEqual({ event: 'add_to_cart', ecommerce: {
    currency: 'SAR', value: 1640,
    items: [{ item_id: product._id, item_name: product.name, quantity: 2, price: 820 }],
  } });
  expect(window.dataLayer![3]).toEqual(expect.objectContaining({ ecommerce: expect.objectContaining({ value: 820 }) }));
  expect(trackSnapProduct).toHaveBeenCalledTimes(2);
});

test('a failing dataLayer cannot break adding to cart', () => {
  window.dataLayer!.push = () => { throw new Error('GTM unavailable'); };
  expect(() => useCartStore.getState().addItem(product)).not.toThrow();
  expect(useCartStore.getState().items[0].qty).toBe(1);
});
