/**
 * Multi-Touch Attribution Engine
 * Supports multiple attribution models for accurate conversion tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export type AttributionModel =
  | 'last_click'     // 100% credit to final touchpoint
  | 'first_click'    // 100% credit to first touchpoint
  | 'linear'         // Equal distribution across all touchpoints
  | 'time_decay'     // Exponential decay with 7-day half-life
  | 'position_based'; // 40% first, 40% last, 20% middle

export interface Touchpoint {
  id: string;
  store_id: string;
  customer_identifier: string;
  identifier_type: 'email' | 'cookie' | 'customer_id';
  touchpoint_type: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  landing_page: string | null;
  referrer: string | null;
  session_id: string | null;
  device_type: string | null;
  occurred_at: string;
}

export interface AttributionCredit {
  touchpointId: string;
  credit: number; // 0.0 to 1.0
  position: number;
  totalTouchpoints: number;
}

export interface ChannelAttribution {
  channel: string;
  totalCredit: number;
  attributedRevenue: number;
  orderCount: number;
  percentage: number;
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
 * Record a customer touchpoint
 */
export async function recordTouchpoint(
  storeId: string,
  customerIdentifier: string,
  touchpointData: {
    identifierType?: 'email' | 'cookie' | 'customer_id';
    touchpointType: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    fbclid?: string;
    gclid?: string;
    ttclid?: string;
    landingPage?: string;
    referrer?: string;
    sessionId?: string;
    deviceType?: string;
  }
): Promise<Touchpoint | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('attribution_touchpoints')
    .insert({
      store_id: storeId,
      customer_identifier: customerIdentifier.toLowerCase(),
      identifier_type: touchpointData.identifierType || 'email',
      touchpoint_type: touchpointData.touchpointType,
      utm_source: touchpointData.utmSource || null,
      utm_medium: touchpointData.utmMedium || null,
      utm_campaign: touchpointData.utmCampaign || null,
      utm_content: touchpointData.utmContent || null,
      utm_term: touchpointData.utmTerm || null,
      fbclid: touchpointData.fbclid || null,
      gclid: touchpointData.gclid || null,
      ttclid: touchpointData.ttclid || null,
      landing_page: touchpointData.landingPage || null,
      referrer: touchpointData.referrer || null,
      session_id: touchpointData.sessionId || null,
      device_type: touchpointData.deviceType || null,
      occurred_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording touchpoint:', error);
    return null;
  }

  return data;
}

/**
 * Get customer touchpoints within attribution window
 */
export async function getCustomerTouchpoints(
  storeId: string,
  customerIdentifier: string,
  conversionTime: Date,
  windowDays: number = 30
): Promise<Touchpoint[]> {
  const supabase = getSupabaseClient();

  const windowStart = new Date(conversionTime);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const { data } = await supabase
    .from('attribution_touchpoints')
    .select('*')
    .eq('store_id', storeId)
    .eq('customer_identifier', customerIdentifier.toLowerCase())
    .lte('occurred_at', conversionTime.toISOString())
    .gte('occurred_at', windowStart.toISOString())
    .order('occurred_at', { ascending: true });

  return data || [];
}

/**
 * Calculate attribution credits based on model
 */
export function calculateAttribution(
  touchpoints: Touchpoint[],
  model: AttributionModel,
  conversionTime?: Date
): AttributionCredit[] {
  if (touchpoints.length === 0) {
    return [];
  }

  const totalTouchpoints = touchpoints.length;

  switch (model) {
    case 'last_click':
      return lastClickAttribution(touchpoints, totalTouchpoints);

    case 'first_click':
      return firstClickAttribution(touchpoints, totalTouchpoints);

    case 'linear':
      return linearAttribution(touchpoints, totalTouchpoints);

    case 'time_decay':
      return timeDecayAttribution(touchpoints, totalTouchpoints, conversionTime);

    case 'position_based':
      return positionBasedAttribution(touchpoints, totalTouchpoints);

    default:
      return lastClickAttribution(touchpoints, totalTouchpoints);
  }
}

/**
 * Last Click: 100% credit to final touchpoint
 */
function lastClickAttribution(touchpoints: Touchpoint[], total: number): AttributionCredit[] {
  return touchpoints.map((tp, index) => ({
    touchpointId: tp.id,
    credit: index === total - 1 ? 1.0 : 0.0,
    position: index + 1,
    totalTouchpoints: total
  }));
}

/**
 * First Click: 100% credit to first touchpoint
 */
function firstClickAttribution(touchpoints: Touchpoint[], total: number): AttributionCredit[] {
  return touchpoints.map((tp, index) => ({
    touchpointId: tp.id,
    credit: index === 0 ? 1.0 : 0.0,
    position: index + 1,
    totalTouchpoints: total
  }));
}

/**
 * Linear: Equal distribution across all touchpoints
 */
function linearAttribution(touchpoints: Touchpoint[], total: number): AttributionCredit[] {
  const creditPerTouch = 1.0 / total;

  return touchpoints.map((tp, index) => ({
    touchpointId: tp.id,
    credit: creditPerTouch,
    position: index + 1,
    totalTouchpoints: total
  }));
}

/**
 * Time Decay: Exponential decay with 7-day half-life
 * More recent touchpoints get more credit
 */
function timeDecayAttribution(
  touchpoints: Touchpoint[],
  total: number,
  conversionTime?: Date
): AttributionCredit[] {
  const conversion = conversionTime || new Date();
  const halfLifeDays = 7;

  // Calculate raw weights based on time decay
  const weights = touchpoints.map((tp) => {
    const touchTime = new Date(tp.occurred_at);
    const daysDiff = (conversion.getTime() - touchTime.getTime()) / (1000 * 60 * 60 * 24);
    // Exponential decay: weight = 2^(-days/halfLife)
    return Math.pow(2, -daysDiff / halfLifeDays);
  });

  // Normalize weights to sum to 1
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  return touchpoints.map((tp, index) => ({
    touchpointId: tp.id,
    credit: totalWeight > 0 ? weights[index] / totalWeight : 0,
    position: index + 1,
    totalTouchpoints: total
  }));
}

/**
 * Position Based: 40% first, 40% last, 20% middle
 */
function positionBasedAttribution(touchpoints: Touchpoint[], total: number): AttributionCredit[] {
  if (total === 1) {
    return [{ touchpointId: touchpoints[0].id, credit: 1.0, position: 1, totalTouchpoints: 1 }];
  }

  if (total === 2) {
    return [
      { touchpointId: touchpoints[0].id, credit: 0.5, position: 1, totalTouchpoints: 2 },
      { touchpointId: touchpoints[1].id, credit: 0.5, position: 2, totalTouchpoints: 2 }
    ];
  }

  const middleCount = total - 2;
  const middleCredit = 0.2 / middleCount;

  return touchpoints.map((tp, index) => {
    let credit: number;
    if (index === 0) {
      credit = 0.4; // First touch
    } else if (index === total - 1) {
      credit = 0.4; // Last touch
    } else {
      credit = middleCredit; // Middle touches split 20%
    }

    return {
      touchpointId: tp.id,
      credit,
      position: index + 1,
      totalTouchpoints: total
    };
  });
}

/**
 * Calculate and store attribution for an order
 */
export async function attributeOrder(
  orderId: string,
  storeId: string,
  customerEmail: string,
  orderTotal: number,
  orderTime: Date,
  model?: AttributionModel
): Promise<AttributionCredit[]> {
  const supabase = getSupabaseClient();

  // Get store's attribution model preference
  let attributionModel = model || 'last_click';
  let windowDays = 30;

  if (!model) {
    const { data: settings } = await supabase
      .from('store_settings')
      .select('attribution_model, attribution_window_days')
      .eq('store_id', storeId)
      .maybeSingle();

    if (settings) {
      attributionModel = settings.attribution_model || 'last_click';
      windowDays = settings.attribution_window_days || 30;
    }
  }

  // Get customer touchpoints
  const touchpoints = await getCustomerTouchpoints(storeId, customerEmail, orderTime, windowDays);

  if (touchpoints.length === 0) {
    // No touchpoints - attribute to direct
    return [];
  }

  // Calculate attribution
  const credits = calculateAttribution(touchpoints, attributionModel as AttributionModel, orderTime);

  // Store attribution results
  const results = credits.map(credit => ({
    order_id: orderId,
    touchpoint_id: credit.touchpointId,
    attribution_model: attributionModel,
    credit: credit.credit,
    attributed_revenue: orderTotal * credit.credit,
    touchpoint_position: credit.position,
    total_touchpoints: credit.totalTouchpoints
  }));

  // Delete existing results for this order/model combination
  await supabase
    .from('attribution_results')
    .delete()
    .eq('order_id', orderId)
    .eq('attribution_model', attributionModel);

  // Insert new results
  if (results.length > 0) {
    const { error } = await supabase
      .from('attribution_results')
      .insert(results);

    if (error) {
      console.error('Error storing attribution results:', error);
    }
  }

  return credits;
}

/**
 * Get channel attribution summary
 */
export async function getChannelAttribution(
  storeId: string,
  model: AttributionModel = 'last_click',
  startDate?: Date,
  endDate?: Date
): Promise<ChannelAttribution[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('attribution_results')
    .select(`
      credit,
      attributed_revenue,
      order_id,
      attribution_touchpoints!inner (
        store_id,
        utm_source,
        touchpoint_type
      ),
      adwyse_orders!inner (
        order_created_at
      )
    `)
    .eq('attribution_model', model)
    .eq('attribution_touchpoints.store_id', storeId);

  if (startDate) {
    query = query.gte('adwyse_orders.order_created_at', startDate.toISOString());
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('adwyse_orders.order_created_at', endOfDay.toISOString());
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate by channel
  const channelMap = new Map<string, { credit: number; revenue: number; orders: Set<string> }>();

  for (const result of data) {
    const tp = result.attribution_touchpoints as any;
    const channel = tp.utm_source || tp.touchpoint_type || 'direct';

    const existing = channelMap.get(channel) || { credit: 0, revenue: 0, orders: new Set() };
    existing.credit += parseFloat(result.credit) || 0;
    existing.revenue += parseFloat(result.attributed_revenue) || 0;
    existing.orders.add(result.order_id);
    channelMap.set(channel, existing);
  }

  const totalRevenue = Array.from(channelMap.values()).reduce((sum, c) => sum + c.revenue, 0);

  return Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      totalCredit: data.credit,
      attributedRevenue: data.revenue,
      orderCount: data.orders.size,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue);
}

/**
 * Compare attribution across models
 */
export async function compareAttributionModels(
  storeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<AttributionModel, ChannelAttribution[]>> {
  const models: AttributionModel[] = ['last_click', 'first_click', 'linear', 'time_decay', 'position_based'];

  const results: Record<string, ChannelAttribution[]> = {};

  for (const model of models) {
    results[model] = await getChannelAttribution(storeId, model, startDate, endDate);
  }

  return results as Record<AttributionModel, ChannelAttribution[]>;
}

/**
 * Re-calculate attribution for all orders in a date range
 * Useful when changing attribution model
 */
export async function recalculateAttribution(
  storeId: string,
  model: AttributionModel,
  startDate?: Date,
  endDate?: Date
): Promise<{ processed: number; errors: string[] }> {
  const supabase = getSupabaseClient();
  const errors: string[] = [];
  let processed = 0;

  // Get orders in date range
  let query = supabase
    .from('adwyse_orders')
    .select('id, customer_email, total_price, order_created_at')
    .eq('store_id', storeId);

  if (startDate) {
    query = query.gte('order_created_at', startDate.toISOString());
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('order_created_at', endOfDay.toISOString());
  }

  const { data: orders } = await query;

  if (!orders || orders.length === 0) {
    return { processed: 0, errors: [] };
  }

  // Process orders in batches
  for (const order of orders) {
    if (!order.customer_email) continue;

    try {
      await attributeOrder(
        order.id,
        storeId,
        order.customer_email,
        parseFloat(order.total_price) || 0,
        new Date(order.order_created_at),
        model
      );
      processed++;
    } catch (error) {
      errors.push(`Order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { processed, errors };
}

/**
 * Determine touchpoint type from URL parameters
 */
export function determineTouchpointType(params: {
  utmSource?: string;
  utmMedium?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  referrer?: string;
}): string {
  // Paid ad click
  if (params.fbclid) return 'facebook_ad';
  if (params.gclid) return 'google_ad';
  if (params.ttclid) return 'tiktok_ad';

  // UTM-based
  if (params.utmMedium?.toLowerCase().includes('cpc') ||
      params.utmMedium?.toLowerCase().includes('paid')) {
    return 'paid_ad';
  }

  if (params.utmMedium?.toLowerCase().includes('email')) {
    return 'email_click';
  }

  if (params.utmMedium?.toLowerCase().includes('social')) {
    return 'social';
  }

  // Referrer-based
  if (params.referrer) {
    const ref = params.referrer.toLowerCase();
    if (ref.includes('google.com') && !params.gclid) return 'organic_search';
    if (ref.includes('facebook.com') && !params.fbclid) return 'social';
    if (ref.includes('instagram.com')) return 'social';
    if (ref.includes('twitter.com') || ref.includes('x.com')) return 'social';
    return 'referral';
  }

  // UTM source present but not categorized above
  if (params.utmSource) return 'campaign';

  return 'direct';
}
