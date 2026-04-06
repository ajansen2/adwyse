import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  checkAlerts,
  getAlertsNeedingEmail,
  markAlertEmailSent,
  logNotification
} from '@/lib/alerts';
import { getSlackWebhook, sendSlackAlert } from '@/lib/slack-notifications';

/**
 * Cron job to check alerts for all stores
 * Should be called hourly by Vercel Cron or similar
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-alerts",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results = {
    storesChecked: 0,
    alertsCreated: 0,
    emailsSent: 0,
    slackSent: 0,
    errors: [] as string[]
  };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all active stores
    const { data: stores } = await supabase
      .from('adwyse_stores')
      .select('id')
      .eq('subscription_status', 'active');

    if (!stores || stores.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active stores to check',
        results
      });
    }

    // Check alerts for each store
    for (const store of stores) {
      try {
        const alerts = await checkAlerts(store.id);
        results.storesChecked++;
        results.alertsCreated += alerts.length;
      } catch (error) {
        results.errors.push(`Store ${store.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send email notifications for high/critical alerts
    if (process.env.RESEND_API_KEY) {
      const emailResults = await sendAlertEmails();
      results.emailsSent = emailResults.sent;
      results.errors.push(...emailResults.errors);
    }

    // Send Slack notifications for high/critical alerts
    const slackResults = await sendSlackAlerts(supabase);
    results.slackSent = slackResults.sent;
    results.errors.push(...slackResults.errors);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Alert cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 });
  }
}

/**
 * Send email notifications for pending alerts
 */
async function sendAlertEmails(): Promise<{ sent: number; errors: string[] }> {
  const results = { sent: 0, errors: [] as string[] };

  if (!process.env.RESEND_API_KEY) {
    results.errors.push('RESEND_API_KEY not configured');
    return results;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const alertsNeedingEmail = await getAlertsNeedingEmail();

  for (const alert of alertsNeedingEmail) {
    if (!alert.store_email) {
      continue;
    }

    try {
      const subject = getEmailSubject(alert);
      const body = getEmailBody(alert);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'AdWyse <alerts@adwyse.io>',
        to: alert.store_email,
        subject,
        html: body
      });

      if (error) {
        results.errors.push(`Alert ${alert.id}: ${error.message}`);
        await logNotification(alert.store_id, alert.id, {
          notification_type: 'email',
          recipient: alert.store_email,
          subject,
          status: 'failed',
          error_message: error.message
        });
      } else {
        results.sent++;
        await markAlertEmailSent(alert.id);
        await logNotification(alert.store_id, alert.id, {
          notification_type: 'email',
          recipient: alert.store_email,
          subject,
          status: 'sent',
          external_id: data?.id
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Alert ${alert.id}: ${errorMsg}`);
    }
  }

  return results;
}

/**
 * Generate email subject based on alert
 */
function getEmailSubject(alert: any): string {
  const severityEmoji = alert.severity === 'critical' ? '🚨' : '⚠️';

  switch (alert.type) {
    case 'roas_low':
      return `${severityEmoji} ROAS Alert: ${alert.campaign_name || 'Campaign'} underperforming`;
    case 'spend_high':
      return `${severityEmoji} Spend Alert: ${alert.campaign_name || 'Campaign'} over budget`;
    case 'conversion_drop':
      return `${severityEmoji} Conversion Alert: Orders dropped significantly`;
    case 'creative_fatigue':
      return `${severityEmoji} Creative Fatigue: ${alert.campaign_name || 'Ad'} needs refresh`;
    default:
      return `${severityEmoji} AdWyse Alert: Action Required`;
  }
}

/**
 * Generate email body based on alert
 */
function getEmailBody(alert: any): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.adwyse.io';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">AdWyse Alert</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="background: ${alert.severity === 'critical' ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: ${alert.severity === 'critical' ? '#dc2626' : '#d97706'};">
        ${alert.severity.toUpperCase()} ALERT
      </p>
      <p style="margin: 8px 0 0; color: #374151;">
        ${alert.message}
      </p>
    </div>

    ${alert.campaign_name ? `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Campaign</p>
      <p style="margin: 4px 0 0; font-weight: 600;">${alert.campaign_name}</p>
    </div>
    ` : ''}

    <div style="display: flex; gap: 24px; margin-bottom: 24px;">
      <div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Current Value</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #111827;">
          ${formatAlertValue(alert)}
        </p>
      </div>
      <div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Threshold</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #6b7280;">
          ${formatThreshold(alert)}
        </p>
      </div>
    </div>

    <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
      View Dashboard →
    </a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      You're receiving this because you have alert notifications enabled.
      <a href="${dashboardUrl}/dashboard/settings" style="color: #6366f1;">Manage preferences</a>
    </p>
  </div>
</body>
</html>
`;
}

function formatAlertValue(alert: any): string {
  switch (alert.type) {
    case 'roas_low':
      return `${alert.value.toFixed(2)}x`;
    case 'spend_high':
      return `$${alert.value.toFixed(2)}`;
    case 'conversion_drop':
    case 'creative_fatigue':
      return `${alert.value.toFixed(0)}%`;
    default:
      return alert.value.toString();
  }
}

function formatThreshold(alert: any): string {
  switch (alert.type) {
    case 'roas_low':
      return `${alert.threshold}x`;
    case 'spend_high':
      return `$${alert.threshold}`;
    case 'conversion_drop':
    case 'creative_fatigue':
      return `${alert.threshold}%`;
    default:
      return alert.threshold.toString();
  }
}

/**
 * Send Slack notifications for pending alerts
 */
async function sendSlackAlerts(supabase: any): Promise<{ sent: number; errors: string[] }> {
  const results = { sent: 0, errors: [] as string[] };

  try {
    // Get alerts that need Slack notification
    const { data: alertsNeedingSlack } = await supabase
      .from('alerts')
      .select(`
        *,
        adwyse_stores!inner(store_name, shop_domain)
      `)
      .eq('slack_sent', false)
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (!alertsNeedingSlack || alertsNeedingSlack.length === 0) {
      return results;
    }

    for (const alert of alertsNeedingSlack) {
      try {
        // Get Slack webhook for this store
        const webhookUrl = await getSlackWebhook(alert.store_id);
        if (!webhookUrl) {
          continue; // Slack not configured for this store
        }

        const storeName = (alert.adwyse_stores as any)?.store_name || 'Your Store';
        const shopDomain = (alert.adwyse_stores as any)?.shop_domain;

        const sent = await sendSlackAlert(webhookUrl, {
          type: alert.type,
          severity: alert.severity,
          title: getAlertTitle(alert),
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          campaignName: alert.campaign_name,
          platform: alert.metadata?.platform,
          storeName,
          shopDomain,
        });

        if (sent) {
          results.sent++;
          // Mark alert as Slack sent
          await supabase
            .from('alerts')
            .update({
              slack_sent: true,
              slack_sent_at: new Date().toISOString()
            })
            .eq('id', alert.id);

          // Log notification
          await logNotification(alert.store_id, alert.id, {
            notification_type: 'webhook',
            recipient: 'slack',
            subject: getAlertTitle(alert),
            status: 'sent'
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Slack alert ${alert.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Slack send error: ${errorMsg}`);
  }

  return results;
}

/**
 * Get a human-readable title for an alert
 */
function getAlertTitle(alert: any): string {
  switch (alert.type) {
    case 'roas_low':
      return 'Low ROAS Alert';
    case 'spend_high':
      return 'High Spend Alert';
    case 'conversion_drop':
      return 'Conversion Drop Alert';
    case 'creative_fatigue':
      return 'Creative Fatigue Alert';
    case 'cpc_spike':
      return 'CPC Spike Alert';
    case 'impression_drop':
      return 'Impression Drop Alert';
    default:
      return 'Performance Alert';
  }
}
