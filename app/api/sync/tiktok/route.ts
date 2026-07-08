import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, syncTikTokForStore } from '@/lib/sync-engine';

/**
 * Cron handler — syncs all stores with connected TikTok accounts
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('store_id')
      .eq('platform', 'tiktok')
      .eq('is_connected', true);

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No stores to sync' });
    }

    const storeIds = [...new Set(accounts.map((a: any) => a.store_id))];
    let totalSynced = 0;

    for (const storeId of storeIds) {
      try {
        const result = await syncTikTokForStore(supabase, storeId);
        if (result.success) totalSynced++;
        console.log(`[CRON] TikTok sync for store ${storeId}: ${result.campaignsSynced} campaigns`);
      } catch (error) {
        console.error(`[CRON] Error syncing store ${storeId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced}/${storeIds.length} stores`,
    });
  } catch (error) {
    console.error('TikTok cron sync error:', error);
    return NextResponse.json({ error: 'Failed to run cron sync' }, { status: 500 });
  }
}

/**
 * Manual trigger — sync TikTok for a single store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const result = await syncTikTokForStore(supabase, storeId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.errors.join('; ') || 'Sync failed for one or more accounts',
        campaignsSynced: result.campaignsSynced,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${result.campaignsSynced} campaigns with $${result.totalSpend.toFixed(2)} total spend`,
      campaignsSynced: result.campaignsSynced,
      totalSpend: result.totalSpend,
    });
  } catch (error) {
    console.error('TikTok sync error:', error);
    return NextResponse.json({ error: 'Failed to sync TikTok Ads data' }, { status: 500 });
  }
}
