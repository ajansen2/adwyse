/**
 * Webhook Error Handling
 * Provides utilities for tracking and monitoring webhook reliability
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type WebhookErrorType =
  | 'signature_invalid'
  | 'store_not_found'
  | 'cart_insert_error'
  | 'cart_insert_exception'
  | 'cart_update_error'
  | 'order_insert_error'
  | 'order_duplicate'
  | 'payload_parse_error'
  | 'unknown_error';

export interface WebhookMetric {
  id: string;
  shop_domain: string;
  webhook_topic: string;
  error_type: WebhookErrorType | null;
  error_message: string | null;
  processing_time_ms: number | null;
  success: boolean;
  created_at: string;
}

/**
 * Create a Supabase client for webhook operations
 */
export function getWebhookSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Log a webhook error to the database
 */
export async function logWebhookError(
  shopDomain: string,
  topic: string,
  errorType: WebhookErrorType,
  errorMessage: string,
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase || getWebhookSupabaseClient();

  try {
    await client
      .from('webhook_metrics')
      .insert({
        shop_domain: shopDomain,
        webhook_topic: topic,
        error_type: errorType,
        error_message: errorMessage.substring(0, 1000),
        success: false,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Silently fail - don't let logging affect webhook processing
    console.error('[Webhook Metrics] Failed to log error:', error);
  }
}

/**
 * Log a successful webhook
 */
export async function logWebhookSuccess(
  shopDomain: string,
  topic: string,
  processingTimeMs: number,
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase || getWebhookSupabaseClient();

  try {
    await client
      .from('webhook_metrics')
      .insert({
        shop_domain: shopDomain,
        webhook_topic: topic,
        success: true,
        processing_time_ms: processingTimeMs,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[Webhook Metrics] Failed to log success:', error);
  }
}

/**
 * Get webhook error statistics for a store
 */
export async function getWebhookStats(
  shopDomain: string,
  daysBack: number = 7
): Promise<{
  totalWebhooks: number;
  successCount: number;
  errorCount: number;
  errorsByType: Record<string, number>;
  avgProcessingTimeMs: number;
}> {
  const supabase = getWebhookSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: metrics } = await supabase
    .from('webhook_metrics')
    .select('*')
    .eq('shop_domain', shopDomain)
    .gte('created_at', cutoffDate.toISOString());

  if (!metrics || metrics.length === 0) {
    return {
      totalWebhooks: 0,
      successCount: 0,
      errorCount: 0,
      errorsByType: {},
      avgProcessingTimeMs: 0
    };
  }

  const successCount = metrics.filter(m => m.success).length;
  const errorCount = metrics.filter(m => !m.success).length;

  const errorsByType: Record<string, number> = {};
  for (const metric of metrics.filter(m => !m.success && m.error_type)) {
    errorsByType[metric.error_type] = (errorsByType[metric.error_type] || 0) + 1;
  }

  const processingTimes = metrics
    .filter(m => m.processing_time_ms != null)
    .map(m => m.processing_time_ms!);
  const avgProcessingTimeMs = processingTimes.length > 0
    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
    : 0;

  return {
    totalWebhooks: metrics.length,
    successCount,
    errorCount,
    errorsByType,
    avgProcessingTimeMs
  };
}

/**
 * Get recent webhook errors for debugging
 */
export async function getRecentWebhookErrors(
  shopDomain: string,
  limit: number = 20
): Promise<WebhookMetric[]> {
  const supabase = getWebhookSupabaseClient();

  const { data } = await supabase
    .from('webhook_metrics')
    .select('*')
    .eq('shop_domain', shopDomain)
    .eq('success', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
