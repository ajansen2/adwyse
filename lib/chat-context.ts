/**
 * Build a compact data snapshot for the AI chat assistant.
 * Gives Claude enough context to answer most "what's my X" questions
 * without needing to query the database itself.
 */

import { createClient } from '@supabase/supabase-js';

export interface ChatContext {
  storeName: string;
  asOf: string; // ISO date
  windowDays: number;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalSpend: number;
    blendedROAS: number;
    avgOrderValue: number;
    attributedRevenue: number;
    attributedOrders: number;
  };
  topCampaigns: Array<{
    name: string;
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    orders: number;
  }>;
  recentOrders: Array<{
    date: string;
    total: number;
    source: string;
  }>;
  byPlatform: Record<string, { spend: number; revenue: number; roas: number }>;
  trend: {
    revenueChangePct: number;
    spendChangePct: number;
  };
}

export async function buildChatContext(
  storeId: string,
  windowDays = 30
): Promise<ChatContext | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const prevWindowStart = new Date(
    windowStart.getTime() - windowDays * 24 * 60 * 60 * 1000
  );

  // Store name
  const { data: store } = await supabase
    .from('adwyse_stores')
    .select('store_name, shop_domain')
    .eq('id', storeId)
    .maybeSingle();

  if (!store) return null;

  // Orders in current window
  const { data: orders } = await supabase
    .from('orders')
    .select('order_total, attributed_platform, order_created_at, customer_email')
    .eq('store_id', storeId)
    .gte('order_created_at', windowStart.toISOString())
    .order('order_created_at', { ascending: false })
    .limit(500);

  // Orders in previous window for trend
  const { data: prevOrders } = await supabase
    .from('orders')
    .select('order_total')
    .eq('store_id', storeId)
    .gte('order_created_at', prevWindowStart.toISOString())
    .lt('order_created_at', windowStart.toISOString());

  // Campaigns (aggregated from daily rows)
  const { data: campaignRows } = await supabase
    .from('adwyse_campaigns')
    .select('campaign_name, spend, attributed_revenue, attributed_orders, adwyse_ad_accounts!inner(platform)')
    .eq('store_id', storeId)
    .gte('date', windowStart.toISOString().split('T')[0]);

  // Aggregate campaigns
  const campaignMap = new Map<string, any>();
  (campaignRows || []).forEach((row: any) => {
    const key = row.campaign_name;
    const platform = row.adwyse_ad_accounts?.platform || 'unknown';
    const existing = campaignMap.get(key) || {
      name: key,
      platform,
      spend: 0,
      revenue: 0,
      orders: 0,
    };
    existing.spend += parseFloat(row.spend || 0);
    existing.revenue += parseFloat(row.attributed_revenue || 0);
    existing.orders += row.attributed_orders || 0;
    campaignMap.set(key, existing);
  });

  const campaigns = Array.from(campaignMap.values()).map((c) => ({
    ...c,
    roas: c.spend > 0 ? c.revenue / c.spend : 0,
  }));

  // Top 10 campaigns by spend
  const topCampaigns = [...campaigns].sort((a, b) => b.spend - a.spend).slice(0, 10);

  // By platform
  const byPlatform: Record<string, { spend: number; revenue: number; roas: number }> = {};
  campaigns.forEach((c) => {
    if (!byPlatform[c.platform]) {
      byPlatform[c.platform] = { spend: 0, revenue: 0, roas: 0 };
    }
    byPlatform[c.platform].spend += c.spend;
    byPlatform[c.platform].revenue += c.revenue;
  });
  Object.keys(byPlatform).forEach((p) => {
    byPlatform[p].roas =
      byPlatform[p].spend > 0 ? byPlatform[p].revenue / byPlatform[p].spend : 0;
  });

  // Aggregate metrics
  const totalRevenue = (orders || []).reduce((s, o) => s + (o.order_total || 0), 0);
  const totalOrders = (orders || []).length;
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const attributedOrders = (orders || []).filter(
    (o) => o.attributed_platform && o.attributed_platform !== 'direct'
  ).length;
  const attributedRevenue = (orders || [])
    .filter((o) => o.attributed_platform && o.attributed_platform !== 'direct')
    .reduce((s, o) => s + (o.order_total || 0), 0);

  const prevRevenue = (prevOrders || []).reduce((s, o) => s + (o.order_total || 0), 0);
  const prevSpend = totalSpend; // we don't have prev period campaign data easily, default to 0 change
  const revenueChangePct =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  return {
    storeName: store.store_name || store.shop_domain || 'Your store',
    asOf: now.toISOString(),
    windowDays,
    metrics: {
      totalRevenue,
      totalOrders,
      totalSpend,
      blendedROAS: totalSpend > 0 ? attributedRevenue / totalSpend : 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      attributedRevenue,
      attributedOrders,
    },
    topCampaigns,
    recentOrders: (orders || []).slice(0, 20).map((o) => ({
      date: o.order_created_at,
      total: o.order_total,
      source: o.attributed_platform || 'direct',
    })),
    byPlatform,
    trend: {
      revenueChangePct,
      spendChangePct: 0,
    },
  };
}
