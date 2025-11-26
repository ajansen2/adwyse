/**
 * Alerts System
 * Monitors campaign performance and sends notifications when thresholds are breached
 */

import { createClient } from '@supabase/supabase-js';

export interface AlertSettings {
  roas_alert_enabled: boolean;
  roas_threshold: number; // Alert when ROAS drops below this
  spend_alert_enabled: boolean;
  spend_threshold: number; // Alert when daily spend exceeds this
}

export interface Alert {
  id: string;
  store_id: string;
  type: 'roas_low' | 'spend_high';
  message: string;
  value: number;
  threshold: number;
  campaign_name?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Check alerts for a store and create new ones if thresholds breached
 */
export async function checkAlerts(storeId: string): Promise<Alert[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get store alert settings
  const { data: store } = await supabase
    .from('stores')
    .select('roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold')
    .eq('id', storeId)
    .single();

  if (!store) return [];

  const newAlerts: Alert[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get campaigns with recent data
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('store_id', storeId);

  if (!campaigns) return [];

  // Get orders from last 24 hours for ROAS calculation
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .gte('created_at', oneDayAgo.toISOString());

  // Calculate daily metrics per campaign
  for (const campaign of campaigns) {
    const campaignOrders = (recentOrders || []).filter(
      o => o.campaign_name?.toLowerCase() === campaign.campaign_name?.toLowerCase()
    );
    const campaignRevenue = campaignOrders.reduce((sum, o) => sum + o.order_total, 0);
    const dailySpend = campaign.ad_spend / 30; // Estimate daily from monthly

    // Check ROAS threshold
    if (store.roas_alert_enabled && store.roas_threshold > 0 && dailySpend > 0) {
      const currentRoas = campaignRevenue / dailySpend;

      if (currentRoas < store.roas_threshold) {
        // Check if we already alerted about this recently (within 24h)
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('store_id', storeId)
          .eq('type', 'roas_low')
          .eq('campaign_name', campaign.campaign_name)
          .gte('created_at', oneDayAgo.toISOString())
          .maybeSingle();

        if (!existingAlert) {
          const alert = {
            store_id: storeId,
            type: 'roas_low' as const,
            message: `ROAS for "${campaign.campaign_name}" dropped to ${currentRoas.toFixed(2)}x (threshold: ${store.roas_threshold}x)`,
            value: currentRoas,
            threshold: store.roas_threshold,
            campaign_name: campaign.campaign_name,
            is_read: false,
          };

          const { data: created } = await supabase
            .from('alerts')
            .insert(alert)
            .select()
            .single();

          if (created) newAlerts.push(created);
        }
      }
    }

    // Check spend threshold
    if (store.spend_alert_enabled && store.spend_threshold > 0) {
      if (dailySpend > store.spend_threshold) {
        // Check if we already alerted about this recently
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('store_id', storeId)
          .eq('type', 'spend_high')
          .eq('campaign_name', campaign.campaign_name)
          .gte('created_at', oneDayAgo.toISOString())
          .maybeSingle();

        if (!existingAlert) {
          const alert = {
            store_id: storeId,
            type: 'spend_high' as const,
            message: `Daily spend for "${campaign.campaign_name}" exceeded $${store.spend_threshold} (current: $${dailySpend.toFixed(2)})`,
            value: dailySpend,
            threshold: store.spend_threshold,
            campaign_name: campaign.campaign_name,
            is_read: false,
          };

          const { data: created } = await supabase
            .from('alerts')
            .insert(alert)
            .select()
            .single();

          if (created) newAlerts.push(created);
        }
      }
    }
  }

  return newAlerts;
}

/**
 * Get unread alerts count for a store
 */
export async function getUnreadAlertsCount(storeId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { count } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_read', false);

  return count || 0;
}

/**
 * Get recent alerts for a store
 */
export async function getAlerts(storeId: string, limit = 20): Promise<Alert[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Mark alerts as read
 */
export async function markAlertsRead(alertIds: string[]): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await supabase
    .from('alerts')
    .update({ is_read: true })
    .in('id', alertIds);
}
