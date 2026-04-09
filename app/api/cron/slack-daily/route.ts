import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSlackDailySummary, getSlackWebhook } from '@/lib/slack-notifications';

/**
 * Cron: send daily Slack summary to all stores with Slack enabled.
 * Runs once a day (recommend 9am store-local; for now we run UTC and let the
 * data window be "yesterday").
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/slack-daily", "schedule": "0 14 * * *" }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find all stores that have Slack enabled
    const { data: settings } = await supabase
      .from('store_settings')
      .select('store_id, slack_webhook_url, slack_enabled')
      .eq('slack_enabled', true)
      .not('slack_webhook_url', 'is', null);

    if (!settings || settings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stores with Slack enabled',
        sent: 0,
      });
    }

    // Yesterday window
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    let sent = 0;
    let failed = 0;

    for (const setting of settings) {
      try {
        // Get store name
        const { data: store } = await supabase
          .from('adwyse_stores')
          .select('store_name, shop_domain')
          .eq('id', setting.store_id)
          .maybeSingle();

        if (!store) continue;

        // Yesterday's orders
        const { data: orders } = await supabase
          .from('orders')
          .select('order_total, attributed_platform')
          .eq('store_id', setting.store_id)
          .gte('order_created_at', yesterdayStart.toISOString())
          .lte('order_created_at', yesterdayEnd.toISOString());

        const totalRevenue = (orders || []).reduce(
          (s, o) => s + (o.order_total || 0),
          0
        );
        const totalOrders = (orders || []).length;
        const attributedRevenue = (orders || [])
          .filter((o) => o.attributed_platform && o.attributed_platform !== 'direct')
          .reduce((s, o) => s + (o.order_total || 0), 0);

        // Yesterday's ad spend
        const yesterdayDateStr = yesterdayStart.toISOString().split('T')[0];
        const { data: campaignRows } = await supabase
          .from('adwyse_campaigns')
          .select('spend')
          .eq('store_id', setting.store_id)
          .eq('date', yesterdayDateStr);

        const totalSpend = (campaignRows || []).reduce(
          (s, r) => s + parseFloat((r as any).spend || 0),
          0
        );

        // Yesterday's alerts count
        const { count: alertCount } = await supabase
          .from('performance_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', setting.store_id)
          .gte('created_at', yesterdayStart.toISOString())
          .lte('created_at', yesterdayEnd.toISOString());

        const ok = await sendSlackDailySummary(setting.slack_webhook_url, {
          storeName: store.store_name || 'Your Store',
          shopDomain: store.shop_domain,
          totalOrders,
          totalRevenue,
          attributedRevenue,
          totalSpend,
          roas: totalSpend > 0 ? attributedRevenue / totalSpend : 0,
          alertCount: alertCount || 0,
        });

        if (ok) sent++;
        else failed++;
      } catch (err) {
        console.error(`Failed Slack digest for store ${setting.store_id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: settings.length,
    });
  } catch (err: any) {
    console.error('Slack daily cron error:', err);
    return NextResponse.json(
      { error: err?.message || 'Cron failed' },
      { status: 500 }
    );
  }
}

/**
 * POST: trigger manually for a specific store (for "Send test" button)
 */
export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ error: 'storeId required' }, { status: 400 });
    }

    const webhookUrl = await getSlackWebhook(storeId);
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Slack not enabled for this store' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: store } = await supabase
      .from('adwyse_stores')
      .select('store_name, shop_domain')
      .eq('id', storeId)
      .maybeSingle();

    // Last 24h window
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: orders } = await supabase
      .from('orders')
      .select('order_total, attributed_platform')
      .eq('store_id', storeId)
      .gte('order_created_at', start.toISOString());

    const totalRevenue = (orders || []).reduce((s, o) => s + (o.order_total || 0), 0);
    const totalOrders = (orders || []).length;
    const attributedRevenue = (orders || [])
      .filter((o) => o.attributed_platform && o.attributed_platform !== 'direct')
      .reduce((s, o) => s + (o.order_total || 0), 0);

    const todayStr = start.toISOString().split('T')[0];
    const { data: campaignRows } = await supabase
      .from('adwyse_campaigns')
      .select('spend')
      .eq('store_id', storeId)
      .eq('date', todayStr);
    const totalSpend = (campaignRows || []).reduce(
      (s, r) => s + parseFloat((r as any).spend || 0),
      0
    );

    const ok = await sendSlackDailySummary(webhookUrl, {
      storeName: store?.store_name || 'Your Store',
      shopDomain: store?.shop_domain,
      totalOrders,
      totalRevenue,
      attributedRevenue,
      totalSpend,
      roas: totalSpend > 0 ? attributedRevenue / totalSpend : 0,
      alertCount: 0,
    });

    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed' },
      { status: 500 }
    );
  }
}
