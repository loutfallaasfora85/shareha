// Loading and dispatch must use the same IDs; the second pixel is opt-in.
export const TIKTOK_PIXEL_IDS = [...new Set([
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'DB4IAG3C77U4O1M3UD7G',
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2 || '',
].map((id) => id.trim()).filter(Boolean))];
