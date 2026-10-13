'use client';

import { useEffect, useRef } from 'react';
import type { Product } from '../components/products/types';
import { trackProductEvent } from './productEvents';

export function useProductView(product: Product | null) {
  const lastViewed = useRef<string | null>(null);
  useEffect(() => {
    if (!product) {
      lastViewed.current = null;
      return;
    }
    if (lastViewed.current !== product._id && trackProductEvent('view_item', product)) {
      lastViewed.current = product._id;
    }
  }, [product]);
}
