/**
 * Enhanced Alerts System
 * Monitors campaign performance and sends notifications when thresholds are breached
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Alert types
export type AlertType =
  | 'roas_low'
  | 'spend_high'
  | 'budget_pacing'
  | 'creative_fatigue'
  | 'conversion_drop'
  | 'cpc_spike'
  | 'impression_drop';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertSettings {
  roas_alert_enabled: boolean;
  roas_threshold: number;
  spend_alert_enabled: boolean;
  spend_threshold: number;
}

export interface Alert {
  id: string;
  store_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  campaign_name?: string;
  campaign_id?: string;
  is_read: boolean;
  email_sent: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  email_address?: string;
  notify_roas_low: boolean;
  notify_spend_high: boolean;
  notify_budget_pacing: boolean;
  notify_creative_fatigue: boolean;
  notify_conversion_drop: boolean;
  min_severity: AlertSeverity;
  instant_alerts: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
}

/**
 * Create Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Determine alert severity based on value vs threshold
 */
function determineSeverity(
  type: AlertType,
  value: number,
  threshold: number
): AlertSeverity {
  const ratio = value / threshold;

  switch (type) {
    case 'roas_low':
      // ROAS below threshold is bad
      if (ratio < 0.3) return 'critical';
      if (ratio < 0.5) return 'high';
      if (ratio < 0.75) return 'medium';
      return 'low';

    case 'spend_high':
      // Spend over threshold
      if (ratio > 2.0) return 'critical';
      if (ratio > 1.5) return 'high';
      if (ratio > 1.2) return 'medium';
      return 'low';

    case 'conversion_drop':
    case 'impression_drop':
      // Drop percentage
      if (value > 50) return 'critical';
      if (value > 30) return 'high';
      if (value > 20) return 'medium';
      return 'low';

    case 'creative_fatigue':
      // CTR decline percentage
      if (value > 40) return 'high';
      if (value > 25) return 'medium';
      return 'low';

    case 'cpc_spike':
      if (ratio > 2.0) return 'high';
      if (ratio > 1.5) return 'medium';
      return 'low';

    default:
      return 'medium';
  }
}

/**
 * Check alerts for a store and create new ones if thresholds breached
 */
export async function checkAlerts(storeId: string): Promise<Alert[]> {
  const supabase = getSupabaseClient();

  // Get store alert settings
  const { data: settings } = await supabase
    .from('store_settings')
    .select('roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold')
    .eq('store_id', storeId)
    .maybeSingle();

  if (!settings) return [];

  const newAlerts: Alert[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get campaigns with recent data
  const { data: campaigns } = await supabase
    .from('adwyse_campaigns')
    .select('*')
    .eq('store_id', storeId);

  if (!campaigns || campaigns.length === 0) return [];

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('adwyse_orders')
    .select('*')
    .eq('store_id', storeId)
    .gte('created_at', oneDayAgo.toISOString());

  // Calculate daily metrics per campaign
  for (const campaign of campaigns) {
    const spend = parseFloat(campaign.spend) || 0;
    const revenue = parseFloat(campaign.attributed_revenue) || 0;
    const dailySpend = spend / 30; // Estimate daily from monthly

    // Check ROAS threshold
    if (settings.roas_alert_enabled && settings.roas_threshold > 0 && dailySpend > 10) {
      const currentRoas = revenue / spend;

      if (currentRoas < settings.roas_threshold) {
        const alert = await createAlertIfNew(supabase, {
          store_id: storeId,
          type: 'roas_low',
          severity: determineSeverity('roas_low', currentRoas, settings.roas_threshold),
          message: `ROAS for "${campaign.campaign_name}" dropped to ${currentRoas.toFixed(2)}x (threshold: ${settings.roas_threshold}x)`,
          value: currentRoas,
          threshold: settings.roas_threshold,
          campaign_name: campaign.campaign_name,
          campaign_id: campaign.id,
          metadata: {
            spend,
            revenue,
            platform: campaign.platform || 'unknown'
          }
        });

        if (alert) newAlerts.push(alert);
      }
    }

    // Check spend threshold
    if (settings.spend_alert_enabled && settings.spend_threshold > 0) {
      if (dailySpend > settings.spend_threshold) {
        const alert = await createAlertIfNew(supabase, {
          store_id: storeId,
          type: 'spend_high',
          severity: determineSeverity('spend_high', dailySpend, settings.spend_threshold),
          message: `Daily spend for "${campaign.campaign_name}" exceeded $${settings.spend_threshold} (current: $${dailySpend.toFixed(2)})`,
          value: dailySpend,
          threshold: settings.spend_threshold,
          campaign_name: campaign.campaign_name,
          campaign_id: campaign.id
        });

        if (alert) newAlerts.push(alert);
      }
    }
  }

  // Check for conversion drops
  await checkConversionDrops(supabase, storeId, newAlerts);

  // Check for creative fatigue
  await checkCreativeFatigue(supabase, storeId, newAlerts);

  return newAlerts;
}

/**
 * Create an alert if one doesn't already exist recently
 */
async function createAlertIfNew(
  supabase: SupabaseClient,
  alertData: {
    store_id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    value: number;
    threshold: number;
    campaign_name?: string;
    campaign_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<Alert | null> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check for existing recent alert
  const query = supabase
    .from('alerts')
    .select('id')
    .eq('store_id', alertData.store_id)
    .eq('type', alertData.type)
    .gte('created_at', oneDayAgo.toISOString());

  if (alertData.campaign_name) {
    query.eq('campaign_name', alertData.campaign_name);
  }

  const { data: existingAlert } = await query.maybeSingle();

  if (existingAlert) {
    return null; // Alert already exists
  }

  // Create new alert
  const { data: created } = await supabase
    .from('alerts')
    .insert({
      ...alertData,
      is_read: false,
      email_sent: false
    })
    .select()
    .single();

  return created;
}

/**
 * Check for conversion rate drops
 */
async function checkConversionDrops(
  supabase: SupabaseClient,
  storeId: string,
  alerts: Alert[]
): Promise<void> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get orders from current week
  const { data: currentWeekOrders } = await supabase
    .from('adwyse_orders')
    .select('id')
    .eq('store_id', storeId)
    .gte('created_at', weekAgo.toISOString());

  // Get orders from previous week
  const { data: previousWeekOrders } = await supabase
    .from('adwyse_orders')
    .select('id')
    .eq('store_id', storeId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString());

  const currentCount = currentWeekOrders?.length || 0;
  const previousCount = previousWeekOrders?.length || 0;

  if (previousCount > 5) { // Need baseline data
    const dropPercent = ((previousCount - currentCount) / previousCount) * 100;

    if (dropPercent > 20) {
      const alert = await createAlertIfNew(supabase, {
        store_id: storeId,
        type: 'conversion_drop',
        severity: determineSeverity('conversion_drop', dropPercent, 20),
        message: `Conversions dropped ${dropPercent.toFixed(0)}% this week (${currentCount} vs ${previousCount} last week)`,
        value: dropPercent,
        threshold: 20,
        metadata: {
          currentWeekOrders: currentCount,
          previousWeekOrders: previousCount
        }
      });

      if (alert) alerts.push(alert);
    }
  }
}

/**
 * Check for creative fatigue
 */
async function checkCreativeFatigue(
  supabase: SupabaseClient,
  storeId: string,
  alerts: Alert[]
): Promise<void> {
  // Use the database function
  const { data: fatiguedCreatives } = await supabase.rpc('detect_creative_fatigue', {
    p_store_id: storeId,
    p_lookback_days: 14
  });

  if (!fatiguedCreatives) return;

  for (const creative of fatiguedCreatives) {
    if (creative.is_fatigued) {
      const alert = await createAlertIfNew(supabase, {
        store_id: storeId,
        type: 'creative_fatigue',
        severity: determineSeverity('creative_fatigue', creative.ctr_decline_pct, 25),
        message: `Creative "${creative.ad_name}" showing fatigue - CTR down ${creative.ctr_decline_pct.toFixed(0)}%`,
        value: creative.ctr_decline_pct,
        threshold: 25,
        campaign_name: creative.ad_name,
        campaign_id: creative.platform_ad_id,
        metadata: {
          startCtr: creative.start_ctr,
          currentCtr: creative.current_ctr,
          roasDecline: creative.roas_decline_pct
        }
      });

      if (alert) alerts.push(alert);
    }
  }
}

/**
 * Get unread alerts count for a store
 */
export async function getUnreadAlertsCount(storeId: string): Promise<number> {
  const supabase = getSupabaseClient();

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
export async function getAlerts(
  storeId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    severity?: AlertSeverity[];
    type?: AlertType[];
  } = {}
): Promise<Alert[]> {
  const supabase = getSupabaseClient();
  const { limit = 20, unreadOnly = false, severity, type } = options;

  let query = supabase
    .from('alerts')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (severity && severity.length > 0) {
    query = query.in('severity', severity);
  }

  if (type && type.length > 0) {
    query = query.in('type', type);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Mark alerts as read
 */
export async function markAlertsRead(alertIds: string[]): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('alerts')
    .update({ is_read: true })
    .in('id', alertIds);
}

/**
 * Mark alert email as sent
 */
export async function markAlertEmailSent(alertId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('alerts')
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString()
    })
    .eq('id', alertId);
}

/**
 * Get notification preferences for a store
 */
export async function getNotificationPreferences(
  storeId: string
): Promise<NotificationPreferences | null> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('store_id', storeId)
    .single();

  return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  storeId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('notification_preferences')
    .upsert({
      store_id: storeId,
      ...preferences,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'store_id'
    });
}

/**
 * Get alerts that need email notification
 */
export async function getAlertsNeedingEmail(
  storeId?: string
): Promise<Array<Alert & { store_email: string }>> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('alerts')
    .select(`
      *,
      adwyse_stores!inner(email)
    `)
    .eq('email_sent', false)
    .in('severity', ['high', 'critical']);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data } = await query;

  return (data || []).map(alert => ({
    ...alert,
    store_email: (alert.adwyse_stores as any)?.email
  }));
}

/**
 * Log notification
 */
export async function logNotification(
  storeId: string,
  alertId: string | null,
  data: {
    notification_type: 'email' | 'in_app' | 'webhook';
    recipient: string;
    subject?: string;
    body?: string;
    status: 'sent' | 'failed' | 'pending';
    error_message?: string;
    external_id?: string;
  }
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('notification_log').insert({
    store_id: storeId,
    alert_id: alertId,
    ...data
  });
}
