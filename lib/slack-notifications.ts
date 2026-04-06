/**
 * Slack Notifications
 * Sends alerts and reports to Slack via incoming webhooks
 */

import { createClient } from '@supabase/supabase-js';

interface SlackAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  campaignName?: string;
  platform?: string;
  storeName: string;
  shopDomain?: string;
}

/**
 * Get Slack webhook URL for a store
 */
export async function getSlackWebhook(storeId: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from('store_settings')
    .select('slack_webhook_url, slack_enabled')
    .eq('store_id', storeId)
    .maybeSingle();

  if (!data?.slack_enabled || !data?.slack_webhook_url) {
    return null;
  }

  return data.slack_webhook_url;
}

/**
 * Get severity emoji
 */
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return ':rotating_light:';
    case 'high': return ':warning:';
    case 'medium': return ':large_yellow_circle:';
    default: return ':information_source:';
  }
}

/**
 * Get type emoji
 */
function getTypeEmoji(type: string): string {
  switch (type) {
    case 'roas_low': return ':chart_with_downwards_trend:';
    case 'spend_high': return ':money_with_wings:';
    case 'conversion_drop': return ':arrow_down:';
    case 'creative_fatigue': return ':yawning_face:';
    case 'cpc_spike': return ':chart_with_upwards_trend:';
    case 'impression_drop': return ':eyes:';
    default: return ':bell:';
  }
}

/**
 * Get severity color for Slack attachment
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#3b82f6';
  }
}

/**
 * Build Slack message payload for an alert
 */
export function buildAlertMessage(alert: SlackAlert): object {
  const shopName = alert.shopDomain?.replace('.myshopify.com', '') || '';
  const dashboardUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard`
    : 'https://adwyse.ca/dashboard';

  const fields: Array<{ title: string; value: string; short: boolean }> = [];

  if (alert.value !== undefined) {
    fields.push({
      title: 'Current Value',
      value: alert.type === 'roas_low' ? `${alert.value.toFixed(2)}x` :
             alert.type === 'spend_high' ? `$${alert.value.toFixed(2)}` :
             `${alert.value.toFixed(0)}%`,
      short: true
    });
  }

  if (alert.threshold !== undefined) {
    fields.push({
      title: 'Threshold',
      value: alert.type === 'roas_low' ? `${alert.threshold.toFixed(2)}x` :
             alert.type === 'spend_high' ? `$${alert.threshold.toFixed(2)}` :
             `${alert.threshold.toFixed(0)}%`,
      short: true
    });
  }

  if (alert.campaignName) {
    fields.push({
      title: 'Campaign',
      value: alert.campaignName,
      short: true
    });
  }

  if (alert.platform) {
    fields.push({
      title: 'Platform',
      value: alert.platform,
      short: true
    });
  }

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${getSeverityEmoji(alert.severity)} ${alert.title}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${getTypeEmoji(alert.type)} ${alert.message}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Store:* ${alert.storeName} | *Severity:* ${alert.severity.toUpperCase()}`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Dashboard',
              emoji: true
            },
            url: dashboardUrl,
            style: 'primary'
          }
        ]
      }
    ],
    attachments: [
      {
        color: getSeverityColor(alert.severity),
        fields: fields
      }
    ]
  };
}

/**
 * Send alert to Slack
 */
export async function sendSlackAlert(
  webhookUrl: string,
  alert: SlackAlert
): Promise<boolean> {
  try {
    const payload = buildAlertMessage(alert);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Slack alert:', response.statusText);
      return false;
    }

    console.log(`✅ Slack alert sent: ${alert.title}`);
    return true;
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return false;
  }
}

/**
 * Send daily summary to Slack
 */
export async function sendSlackDailySummary(
  webhookUrl: string,
  data: {
    storeName: string;
    shopDomain?: string;
    totalOrders: number;
    totalRevenue: number;
    attributedRevenue: number;
    totalSpend: number;
    roas: number;
    alertCount: number;
  }
): Promise<boolean> {
  const shopName = data.shopDomain?.replace('.myshopify.com', '') || '';
  const dashboardUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard`
    : 'https://adwyse.ca/dashboard';

  const roasColor = data.roas >= 2 ? '#22c55e' : data.roas >= 1 ? '#eab308' : '#ef4444';
  const roasEmoji = data.roas >= 2 ? ':rocket:' : data.roas >= 1 ? ':chart_with_upwards_trend:' : ':warning:';

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':bar_chart: Daily Performance Summary',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${data.storeName}* - Yesterday's Performance`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `:moneybag: *Revenue*\n$${data.totalRevenue.toFixed(2)}`
          },
          {
            type: 'mrkdwn',
            text: `:shopping_bags: *Orders*\n${data.totalOrders}`
          },
          {
            type: 'mrkdwn',
            text: `:credit_card: *Ad Spend*\n$${data.totalSpend.toFixed(2)}`
          },
          {
            type: 'mrkdwn',
            text: `${roasEmoji} *ROAS*\n${data.roas.toFixed(2)}x`
          }
        ]
      },
      ...(data.alertCount > 0 ? [{
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `:bell: ${data.alertCount} alert${data.alertCount > 1 ? 's' : ''} triggered yesterday`
        }]
      }] : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Full Dashboard',
              emoji: true
            },
            url: dashboardUrl,
            style: 'primary'
          }
        ]
      }
    ],
    attachments: [
      {
        color: roasColor,
        fields: [
          {
            title: 'Attributed Revenue',
            value: `$${data.attributedRevenue.toFixed(2)} from ads`,
            short: true
          },
          {
            title: 'Net Profit (Est.)',
            value: `$${(data.totalRevenue - data.totalSpend).toFixed(2)}`,
            short: true
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Slack summary:', response.statusText);
      return false;
    }

    console.log(`✅ Slack daily summary sent for ${data.storeName}`);
    return true;
  } catch (error) {
    console.error('Error sending Slack summary:', error);
    return false;
  }
}

/**
 * Test Slack webhook connection
 */
export async function testSlackWebhook(webhookUrl: string): Promise<boolean> {
  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':white_check_mark: *AdWyse Connected!*\nYou will now receive performance alerts and summaries in this channel.'
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing Slack webhook:', error);
    return false;
  }
}
