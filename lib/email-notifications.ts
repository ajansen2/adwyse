/**
 * Email Notifications using Resend
 * Sends alert emails and digest summaries
 */

import { Resend } from 'resend';
import { Alert, AlertSeverity, AlertType, markAlertEmailSent, logNotification } from './alerts';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb'
};

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  roas_low: 'Low ROAS',
  spend_high: 'High Spend',
  budget_pacing: 'Budget Pacing',
  creative_fatigue: 'Creative Fatigue',
  conversion_drop: 'Conversion Drop',
  cpc_spike: 'CPC Spike',
  impression_drop: 'Impression Drop'
};

/**
 * Send an individual alert email
 */
export async function sendAlertEmail(
  alert: Alert,
  recipientEmail: string,
  storeName: string
): Promise<boolean> {
  try {
    const severityColor = SEVERITY_COLORS[alert.severity];
    const alertLabel = ALERT_TYPE_LABELS[alert.type] || alert.type;

    const { data, error } = await resend.emails.send({
      from: 'AdWyse Alerts <alerts@adwyse.ca>',
      to: recipientEmail,
      subject: `🚨 ${alert.severity.toUpperCase()}: ${alertLabel} - ${storeName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">AdWyse Alert</h1>
      </div>

      <!-- Alert Badge -->
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #e4e4e7;">
        <span style="display: inline-block; padding: 8px 16px; background: ${severityColor}; color: white; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px;">
          ${alert.severity}
        </span>
        <h2 style="margin: 16px 0 8px; color: #18181b; font-size: 20px;">${alertLabel}</h2>
        <p style="margin: 0; color: #71717a; font-size: 14px;">${storeName}</p>
      </div>

      <!-- Alert Details -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
          ${alert.message}
        </p>

        ${alert.campaign_name ? `
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600;">Campaign</p>
          <p style="margin: 4px 0 0; color: #18181b; font-size: 16px; font-weight: 500;">${alert.campaign_name}</p>
        </div>
        ` : ''}

        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #dc2626; font-size: 12px; text-transform: uppercase; font-weight: 600;">Current Value</p>
            <p style="margin: 4px 0 0; color: #dc2626; font-size: 24px; font-weight: 700;">${formatAlertValue(alert.type, alert.value)}</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #16a34a; font-size: 12px; text-transform: uppercase; font-weight: 600;">Threshold</p>
            <p style="margin: 4px 0 0; color: #16a34a; font-size: 24px; font-weight: 700;">${formatAlertValue(alert.type, alert.threshold)}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="padding: 0 24px 24px; text-align: center;">
        <a href="https://adwyse.ca/dashboard?shop=${encodeURIComponent(storeName)}"
           style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Dashboard
        </a>
      </div>

      <!-- Footer -->
      <div style="background: #f4f4f5; padding: 20px 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          You received this alert because you have notifications enabled for ${alertLabel.toLowerCase()} events.
        </p>
        <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 12px;">
          <a href="https://adwyse.ca/dashboard/settings?shop=${encodeURIComponent(storeName)}&tab=notifications" style="color: #71717a;">Manage notification settings</a>
        </p>
      </div>
    </div>

    <p style="text-align: center; margin-top: 24px; color: #a1a1aa; font-size: 12px;">
      © ${new Date().getFullYear()} AdWyse. All rights reserved.
    </p>
  </div>
</body>
</html>
      `
    });

    if (error) {
      console.error('Failed to send alert email:', error);
      await logNotification(alert.store_id, alert.id, {
        notification_type: 'email',
        recipient: recipientEmail,
        subject: `Alert: ${alertLabel}`,
        status: 'failed',
        error_message: error.message
      });
      return false;
    }

    // Mark alert as email sent
    await markAlertEmailSent(alert.id);

    // Log successful notification
    await logNotification(alert.store_id, alert.id, {
      notification_type: 'email',
      recipient: recipientEmail,
      subject: `Alert: ${alertLabel}`,
      status: 'sent',
      external_id: data?.id
    });

    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    return false;
  }
}

/**
 * Send daily digest email
 */
export async function sendDailyDigest(
  recipientEmail: string,
  storeName: string,
  storeId: string,
  alerts: Alert[],
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgRoas: number;
    totalSpend: number;
  }
): Promise<boolean> {
  try {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const highCount = alerts.filter(a => a.severity === 'high').length;
    const hasAlerts = alerts.length > 0;

    const { data, error } = await resend.emails.send({
      from: 'AdWyse <digest@adwyse.ca>',
      to: recipientEmail,
      subject: `📊 Daily Report: ${storeName} - ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Daily Digest</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${storeName}</p>
      </div>

      <!-- Metrics Grid -->
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px;">Yesterday's Performance</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Revenue</p>
            <p style="margin: 4px 0 0; color: #18181b; font-size: 20px; font-weight: 700;">$${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Orders</p>
            <p style="margin: 4px 0 0; color: #18181b; font-size: 20px; font-weight: 700;">${metrics.totalOrders}</p>
          </div>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Ad Spend</p>
            <p style="margin: 4px 0 0; color: #18181b; font-size: 20px; font-weight: 700;">$${metrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style="background: ${metrics.avgRoas >= 2 ? '#f0fdf4' : metrics.avgRoas >= 1 ? '#fefce8' : '#fef2f2'}; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase;">ROAS</p>
            <p style="margin: 4px 0 0; color: ${metrics.avgRoas >= 2 ? '#16a34a' : metrics.avgRoas >= 1 ? '#ca8a04' : '#dc2626'}; font-size: 20px; font-weight: 700;">${metrics.avgRoas.toFixed(2)}x</p>
          </div>
        </div>
      </div>

      ${hasAlerts ? `
      <!-- Alerts Section -->
      <div style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; background: ${criticalCount > 0 ? '#dc2626' : highCount > 0 ? '#ea580c' : '#ca8a04'}; border-radius: 50%;"></span>
          ${alerts.length} Active Alert${alerts.length > 1 ? 's' : ''}
        </h2>
        <div style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
          ${alerts.slice(0, 5).map(alert => `
          <div style="padding: 12px 16px; border-bottom: 1px solid #e4e4e7; display: flex; align-items: center; gap: 12px;">
            <span style="display: inline-block; padding: 4px 8px; background: ${SEVERITY_COLORS[alert.severity]}; color: white; border-radius: 4px; font-size: 10px; text-transform: uppercase; font-weight: 600;">
              ${alert.severity}
            </span>
            <p style="margin: 0; color: #3f3f46; font-size: 14px; flex: 1;">${alert.message}</p>
          </div>
          `).join('')}
          ${alerts.length > 5 ? `
          <div style="padding: 12px 16px; text-align: center;">
            <a href="https://adwyse.ca/dashboard?shop=${encodeURIComponent(storeName)}" style="color: #f97316; font-size: 14px;">View ${alerts.length - 5} more alerts</a>
          </div>
          ` : ''}
        </div>
      </div>
      ` : `
      <div style="padding: 0 24px 24px; text-align: center;">
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px;">
          <p style="margin: 0; color: #16a34a; font-size: 16px;">✓ No active alerts - all systems healthy</p>
        </div>
      </div>
      `}

      <!-- CTA -->
      <div style="padding: 0 24px 24px; text-align: center;">
        <a href="https://adwyse.ca/dashboard?shop=${encodeURIComponent(storeName)}"
           style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Full Dashboard
        </a>
      </div>

      <!-- Footer -->
      <div style="background: #f4f4f5; padding: 20px 24px; text-align: center;">
        <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
          <a href="https://adwyse.ca/dashboard/settings?shop=${encodeURIComponent(storeName)}&tab=notifications" style="color: #71717a;">Manage notification settings</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    if (error) {
      console.error('Failed to send daily digest:', error);
      await logNotification(storeId, null, {
        notification_type: 'email',
        recipient: recipientEmail,
        subject: 'Daily Digest',
        status: 'failed',
        error_message: error.message
      });
      return false;
    }

    await logNotification(storeId, null, {
      notification_type: 'email',
      recipient: recipientEmail,
      subject: 'Daily Digest',
      status: 'sent',
      external_id: data?.id
    });

    return true;
  } catch (error) {
    console.error('Error sending daily digest:', error);
    return false;
  }
}

/**
 * Format alert value based on type
 */
function formatAlertValue(type: AlertType, value: number): string {
  switch (type) {
    case 'roas_low':
      return `${value.toFixed(2)}x`;
    case 'spend_high':
      return `$${value.toFixed(2)}`;
    case 'conversion_drop':
    case 'impression_drop':
    case 'creative_fatigue':
      return `${value.toFixed(0)}%`;
    case 'cpc_spike':
      return `$${value.toFixed(2)}`;
    default:
      return value.toString();
  }
}
