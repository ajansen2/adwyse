import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Daily cron — purges all data for stores that uninstalled > 30 days ago.
 * Schedule: 0 5 * * * (daily at 5 AM UTC)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find stores past their purge window
  const { data: storesToPurge, error: queryError } = await supabase
    .from('stores')
    .select('id, shop_domain')
    .eq('is_active', false)
    .lt('purge_after', new Date().toISOString());

  if (queryError) {
    console.error('[PURGE] Failed to query stores:', queryError);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!storesToPurge || storesToPurge.length === 0) {
    console.log('[PURGE] No stores to purge');
    return NextResponse.json({ success: true, purged: 0 });
  }

  // Tables to cascade-delete before removing the store record.
  // Order matters: delete child tables first to avoid FK issues on tables
  // that don't have ON DELETE CASCADE.
  const purgeTables = [
    // Child tables first (may have FKs to parents below)
    'adwyse_order_line_items',
    'goal_progress',
    'budget_forecasts',
    'budget_pacing',
    'competitor_saved_ads',
    'adwyse_insights',
    // Main data tables
    'adwyse_orders',
    'adwyse_campaigns',
    'adwyse_ad_accounts',
    'alerts',
    'store_settings',
    'store_goals',
    'pixel_events',
    'pixel_config',
    'ad_creatives',
    'attribution_touchpoints',
    'attribution_results',
    'product_costs',
    'campaign_daily_stats',
    'meta_capi_events_log',
    'competitor_tracking',
    'competitor_ads_cache',
    'notification_preferences',
    'notification_log',
    'webhook_metrics',
  ];

  let totalPurged = 0;

  for (const store of storesToPurge) {
    const tableCounts: Record<string, number> = {};

    for (const table of purgeTables) {
      const { count, error } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .eq('store_id', store.id);

      tableCounts[table] = count ?? 0;

      if (error) {
        console.error(`[PURGE] Error deleting from ${table} for ${store.shop_domain}:`, error.message);
      }
    }

    // Delete the store record itself
    const { error: storeDeleteError } = await supabase
      .from('adwyse_stores')
      .delete()
      .eq('id', store.id);

    if (storeDeleteError) {
      console.error(`[PURGE] Error deleting store ${store.shop_domain}:`, storeDeleteError.message);
      continue;
    }

    const nonZeroTables = Object.entries(tableCounts)
      .filter(([, c]) => c > 0)
      .map(([t, c]) => `${t}=${c}`)
      .join(' ');

    console.log(
      `[PURGE] shop=${store.shop_domain} tables_purged=${purgeTables.length} rows=${nonZeroTables || 'none'}`
    );

    totalPurged++;
  }

  console.log(`[PURGE] Complete: ${totalPurged} store(s) purged`);

  return NextResponse.json({ success: true, purged: totalPurged });
}
