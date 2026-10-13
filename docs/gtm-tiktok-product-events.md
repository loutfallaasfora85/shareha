# TikTok product events through GTM only

Container: `GTM-MSH67X96`. Target catalog pixel: `DB4IAG3C77U4O1M3UD7G`.

The public container inspected on 2026-10-14 (resource version 4) contains three
TikTok base tags firing on `gtm.js`, with no explicit ViewContent or AddToCart tags.
The other pixel IDs are `DB60TGJC77U074LG48NG` and `DANAGERC77U7F7AC867G`.
This inspection does not expose unpublished workspace changes or TikTok account settings.

The application now pushes `view_item` and `add_to_cart` with `ecommerce.items`,
`ecommerce.value`, and `ecommerce.currency`. It does not initialize or call TikTok.
The middleware permits the TikTok SDK and event connections loaded through GTM.
Application changes alone are insufficient: configure and publish the following in GTM.

## GTM configuration

1. Enable the built-in **Event** variable.
2. Create a **Data Layer Variable**, named `DLV - ecommerce`, data layer name
   `ecommerce`, Version 2.
3. Create two **Custom Event** triggers: exact names `view_item` and `add_to_cart`.
4. Create a **Custom HTML** tag named `TikTok - Product events`, containing the
   code below. Attach both triggers (each event fires the tag once).
5. Under tag sequencing, select the existing base tag for
   `DB4IAG3C77U4O1M3UD7G` as a setup tag, and stop the event tag if setup fails.
   Set that base tag's firing option to **Once per page**, retaining its current
   page trigger. This also handles a product event queued before `gtm.js`.
   Retain applicable consent settings. Do not create another base pixel tag.

```html
<script>
(function () {
  var eventName = {{Event}};
  var ecommerce = {{DLV - ecommerce}};
  var eventMap = { view_item: 'ViewContent', add_to_cart: 'AddToCart' };
  if (!eventMap[eventName] || !ecommerce || !ecommerce.items || !ecommerce.items.length) return;
  var contents = ecommerce.items.map(function (item) {
    return {
      content_id: String(item.item_id),
      content_name: item.item_name,
      quantity: item.quantity,
      price: item.price
    };
  });
  var payload = {
    content_type: 'product',
    contents: contents,
    content_ids: contents.map(function (item) { return item.content_id; }),
    currency: ecommerce.currency,
    value: ecommerce.value
  };
  if (contents.length === 1) {
    payload.content_id = contents[0].content_id;
    payload.content_name = contents[0].content_name;
  }
  var pixelId = 'DB4IAG3C77U4O1M3UD7G';
  if (window.ttq && window.ttq.instance) {
    window.ttq.instance(pixelId).track(eventMap[eventName], payload);
  }
})();
</script>
```

## Verify before publishing

Use GTM Preview against the updated application. Open a product directly, navigate
to another product without a full page reload, and add from both a product card
and a product page. Each view/add should produce one matching custom event and
one firing of the event tag. Quantity is the amount added, not the full cart total.
Check the target pixel in TikTok Test Events and compare content_id with the same
product's sku_id in the actual uploaded catalog. The local feed uses MongoDB `_id`.
Confirm no CSP errors and no duplicate base initialization for the target pixel.
Publish the reviewed GTM changes and deploy the application together.

No checkout, purchase, or registration event is added by this change.

References: [Google data layer](https://developers.google.com/tag-platform/tag-manager/datalayer),
[TikTok catalog checklist](https://ads.tiktok.com/business/library/TikTok_ShoppingAds_Checklist.pdf).
