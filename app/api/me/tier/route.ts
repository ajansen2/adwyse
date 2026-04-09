import { NextRequest, NextResponse } from 'next/server';
import { getStoreTier } from '@/lib/subscription-tiers';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

/**
 * Lightweight tier endpoint for the frontend.
 * GET /api/me/tier?store_id=xxx → { tier, isPro, limits }
 *
 * The client uses this to conditionally render Pro features.
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    // The "demo" bypass for Adam's testing store: keep it as Pro so the
    // marketing screenshots / live demos always show the full product.
    if (storeId === DEMO_STORE_ID) {
      const { TIER_LIMITS } = await import('@/lib/subscription-tiers');
      return NextResponse.json({
        tier: 'pro',
        isPro: true,
        isDemo: true,
        limits: TIER_LIMITS.pro,
      });
    }

    const tierCheck = await getStoreTier(storeId);
    return NextResponse.json({
      tier: tierCheck.tier,
      isPro: tierCheck.tier === 'pro' || tierCheck.tier === 'trial',
      isDemo: false,
      limits: tierCheck.limits,
    });
  } catch (err: any) {
    console.error('Tier lookup failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load tier' },
      { status: 500 }
    );
  }
}
