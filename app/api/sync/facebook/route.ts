import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, syncFacebookForStore } from '@/lib/sync-engine';

/**
 * Cron handler — syncs all stores with connected Facebook ad accounts
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const { data: stores, error: storesError } = await supabase
      .from('ad_accounts')
      .select('store_id')
      .eq('platform', 'facebook')
      .eq('is_connected', true);

    if (storesError) throw storesError;

    if (!stores || stores.length === 0) {
      return NextResponse.json({ message: 'No stores to sync' });
    }

    const storeIds = [...new Set(stores.map((s: any) => s.store_id))];
    let totalSynced = 0;

    for (const storeId of storeIds) {
      try {
        const result = await syncFacebookForStore(supabase, storeId);
        if (result.success) totalSynced++;
        console.log(`[CRON] Facebook sync for store ${storeId}: ${result.campaignsSynced} campaigns`);
      } catch (error) {
        console.error(`[CRON] Error syncing store ${storeId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced}/${storeIds.length} stores`,
    });
  } catch (error) {
    console.error('Facebook cron sync error:', error);
    return NextResponse.json({ error: 'Failed to run cron sync' }, { status: 500 });
  }
}

/**
 * Manual trigger — sync Facebook for a single store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const result = await syncFacebookForStore(supabase, storeId);

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
    console.error('Facebook sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Facebook data' }, { status: 500 });
  }
}
