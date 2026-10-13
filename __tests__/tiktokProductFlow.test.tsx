import { CATALOG_PIXEL_ID } from '../app/lib/productEvents';
import { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useProductView } from '../app/lib/useProductView';
import { useCartStore } from '../app/store/cartStore';
import { trackSnapProduct } from '../app/lib/snapPixel';
import type { Product } from '../app/components/products/types';

jest.mock('../app/lib/snapPixel', () => ({ trackSnapProduct: jest.fn() }));
const product = { _id: '6a144e7221998fa635f10360', name: 'Router',
  originalPrice: 900, salePrice: 820, price: 900 } as Product;
const send = jest.fn();
beforeEach(() => {
  window.ttq = { _i: { [CATALOG_PIXEL_ID]: [] }, instance: () => ({ track: send }) };
  useCartStore.getState().clear();
  jest.clearAllMocks();
});
afterEach(() => { delete window.ttq; });

test('product views are not duplicated by StrictMode or rerenders', () => {
  const { rerender } = renderHook(({ item }) => useProductView(item), {
    initialProps: { item: product as Product | null }, wrapper: StrictMode,
  });
  rerender({ item: { ...product } });
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith('ViewContent', expect.objectContaining({ content_id: product._id }));
  rerender({ item: { ...product, _id: 'another-product' } });
  expect(send).toHaveBeenCalledTimes(2);
});

test('a product loaded after the first render is tracked', () => {
  const { rerender } = renderHook(({ item }) => useProductView(item), {
    initialProps: { item: null as Product | null },
  });
  expect(send).not.toHaveBeenCalled();
  rerender({ item: product });
  expect(send).toHaveBeenCalledTimes(1);
});

test('each cart addition reports the added quantity and preserves Snap tracking', () => {
  act(() => {
    useCartStore.getState().addItem(product, 2);
    useCartStore.getState().addItem(product, 1);
  });
  expect(useCartStore.getState().items[0].qty).toBe(3);
  expect(send).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenNthCalledWith(1, 'AddToCart', expect.objectContaining({
    value: 1640, contents: [{ content_id: product._id, content_name: product.name, quantity: 2, price: 820 }],
  }));
  expect(send).toHaveBeenLastCalledWith('AddToCart', expect.objectContaining({ value: 820 }));
  expect(trackSnapProduct).toHaveBeenCalledTimes(2);
});

test('a failing pixel cannot break adding to cart', () => {
  send.mockImplementationOnce(() => { throw new Error('SDK unavailable'); });
  expect(() => useCartStore.getState().addItem(product)).not.toThrow();
  expect(useCartStore.getState().items[0].qty).toBe(1);
});
