import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedShop } from '@/lib/verify-session';
import { getServiceSupabase, syncForStoreByPlatform } from '@/lib/sync-engine';

/**
 * POST /api/sync/trigger
 * Manual sync trigger from the dashboard.
 * Auth: Shopify session token (unconditional).
 * Body: { accountId: string }
 */
export async function POST(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Look up the ad account and verify it belongs to the caller's shop
    const { data: accountRow, error: fetchError } = await supabase
      .from('ad_accounts')
      .select('id, store_id, platform, sync_status, last_synced_at, updated_at')
      .eq('id', accountId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const account = accountRow as { id: string; store_id: string; platform: string; sync_status: string | null; last_synced_at: string | null } | null;

    if (!account) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Verify this account belongs to a store owned by the authenticated shop
    const { data: storeRow } = await supabase
      .from('adwyse_stores')
      .select('shop_domain')
      .eq('id', account.store_id)
      .maybeSingle();

    const store = storeRow as { shop_domain: string } | null;

    if (!store || store.shop_domain !== shop) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reject if already running/queued — unless stuck for 10+ minutes
    if (account.sync_status === 'running' || account.sync_status === 'queued') {
      const updatedAt = (account as any).updated_at ? new Date((account as any).updated_at).getTime() : Date.now();
      const staleThreshold = 10 * 60 * 1000;
      if (Date.now() - updatedAt < staleThreshold) {
        return NextResponse.json(
          { error: 'Sync already in progress' },
          { status: 429 }
        );
      }
      // Stale running — allow re-queue
    }

    // Reject if synced less than 5 minutes ago
    if (account.last_synced_at) {
      const elapsed = Date.now() - new Date(account.last_synced_at).getTime();
      if (elapsed < 5 * 60 * 1000) {
        const waitSecs = Math.ceil((5 * 60 * 1000 - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSecs}s before syncing again` },
          { status: 429 }
        );
      }
    }

    // Run the sync
    const result = await syncForStoreByPlatform(supabase, account.store_id, account.platform);

    return NextResponse.json({
      success: true,
      campaignsSynced: result.campaignsSynced,
      totalSpend: result.totalSpend,
    });
  } catch (error: any) {
    console.error('[TRIGGER] Sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
