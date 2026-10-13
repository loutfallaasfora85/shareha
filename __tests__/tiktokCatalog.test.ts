import { track } from '../app/lib/useTikTokEvents';
import { TIKTOK_PIXEL_IDS } from '../app/lib/tikTokConfig';

const productEvent = {
  contents: [{ content_id: '6a144e7221998fa635f10360', content_type: 'product' as const,
    content_name: 'Phone', quantity: 2, price: 150 }],
  value: 300,
  currency: 'SAR',
};

afterEach(() => { delete window.ttq; });

test.each(['ViewContent', 'AddToCart'])('%s sends catalog identifiers and type on the event', (event) => {
  const send = jest.fn();
  window.ttq = { track: send, identify: jest.fn() };
  track(event, productEvent);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith(event, {
    ...productEvent, content_type: 'product',
    content_id: productEvent.contents[0].content_id,
    content_ids: [productEvent.contents[0].content_id], content_name: 'Phone',
  });
});

test('early product views are retained before the pixel bootstrap', () => {
  track('ViewContent', productEvent);
  expect(window.ttq).toEqual(expect.arrayContaining([
    ['track', 'ViewContent', expect.objectContaining({ content_type: 'product', value: 300 })],
  ]));
});

test('dispatch targets only the configured pixels', () => {
  const send = jest.fn();
  const instance = jest.fn((_id: string) => ({ track: send, identify: jest.fn() }));
  window.ttq = { track: jest.fn(), identify: jest.fn(), instance };
  track('AddToCart', productEvent);
  expect(instance.mock.calls.map(([id]) => id)).toEqual(TIKTOK_PIXEL_IDS);
  expect(send).toHaveBeenCalledTimes(TIKTOK_PIXEL_IDS.length);
});

test('default configuration does not dispatch to an unloaded second pixel', () => {
  const previous = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2;
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2;
  try {
    jest.isolateModules(() => {
      const config = require('../app/lib/tikTokConfig');
      expect(config.TIKTOK_PIXEL_IDS).toHaveLength(1);
    });
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2;
    else process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2 = previous;
  }
});

test('invalid or incomplete catalog events are not sent', () => {
  const send = jest.fn();
  window.ttq = { track: send, identify: jest.fn() };
  track('AddToCart', { ...productEvent, contents: [] });
  track('ViewContent', { ...productEvent, value: NaN });
  track('AddToCart', { ...productEvent, contents: [
    ...productEvent.contents, { ...productEvent.contents[0], content_id: '' },
  ] });
  expect(send).not.toHaveBeenCalled();
});

test('checkout and registration payloads are unchanged', () => {
  const send = jest.fn();
  window.ttq = { track: send, identify: jest.fn() };
  track('InitiateCheckout', productEvent);
  expect(send).toHaveBeenLastCalledWith('InitiateCheckout', productEvent);
  const registration = { contents: [], value: 0, currency: 'SAR' };
  track('CompleteRegistration', registration);
  expect(send).toHaveBeenLastCalledWith('CompleteRegistration', registration);
});
