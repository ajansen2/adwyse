'use client';

import { useEffect, useState } from 'react';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

export interface TierInfo {
  tier: 'free' | 'trial' | 'pro';
  isPro: boolean;
  isDemo: boolean;
  loading: boolean;
}

const cache = new Map<string, TierInfo>();

/**
 * Fetch and cache the current store's subscription tier.
 *
 * Pass either a storeId OR leave undefined and we'll auto-resolve from
 * the ?shop= URL param (which every dashboard page has).
 *
 * Usage:
 *   const { isPro, loading } = useTier();      // auto-resolve from ?shop=
 *   const { isPro, loading } = useTier(storeId); // explicit
 */
export function useTier(storeId?: string | null): TierInfo {
  const [info, setInfo] = useState<TierInfo>(() => {
    if (storeId && cache.has(storeId)) return cache.get(storeId)!;
    return { tier: 'free', isPro: false, isDemo: false, loading: true };
  });

  useEffect(() => {
    let cancelled = false;

    const resolveAndFetch = async () => {
      let id = storeId || null;

      // If no explicit storeId, try to resolve from ?shop= URL param
      if (!id && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const shop = params.get('shop');
        if (shop) {
          // Cache lookup by shop too so we don't refetch on every page nav
          const shopKey = `shop:${shop}`;
          if (cache.has(shopKey)) {
            if (!cancelled) setInfo(cache.get(shopKey)!);
            return;
          }
          try {
            const lookupRes = await fetch(
              `/api/stores/lookup?shop=${encodeURIComponent(shop)}`
            );
            if (lookupRes.ok) {
              const lookupData = await lookupRes.json();
              const store = lookupData.store || lookupData.merchant;
              id = store?.id || null;
            }
          } catch {
            // Ignore lookup errors
          }
        }
      }

      if (!id) {
        if (!cancelled) {
          setInfo({ tier: 'free', isPro: false, isDemo: false, loading: false });
        }
        return;
      }

      if (cache.has(id)) {
        if (!cancelled) setInfo(cache.get(id)!);
        return;
      }

      try {
        const res = await fetch(`/api/me/tier?store_id=${id}`);
        const data = await res.json();
        const next: TierInfo = {
          tier: data.tier || 'free',
          isPro: !!data.isPro,
          isDemo: !!data.isDemo,
          loading: false,
        };
        cache.set(id, next);
        // Also cache by shop key for next-time speed
        if (typeof window !== 'undefined') {
          const shop = new URLSearchParams(window.location.search).get('shop');
          if (shop) cache.set(`shop:${shop}`, next);
        }
        if (!cancelled) setInfo(next);
      } catch {
        if (!cancelled) {
          setInfo({ tier: 'free', isPro: false, isDemo: false, loading: false });
        }
      }
    };

    resolveAndFetch();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return info;
}
