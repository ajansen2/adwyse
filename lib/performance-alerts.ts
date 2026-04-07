/**
 * Performance Alerts System
 * Sends email alerts when campaign metrics exceed thresholds
 */

import { createClient } from '@supabase/supabase-js';

interface AlertData {
  storeName: string;
  shopDomain: string;
  alertType: 'low_roas' | 'high_spend' | 'creative_fatigue' | 'conversion_drop' | 'budget_pacing';
  currentValue: number;
  threshold: number;
  campaignName?: string;
  platform?: string;
  additionalInfo?: string;
}

/**
 * Generate HTML email template for performance alert
 */
export function generateAlertEmail(data: AlertData): string {
  const shopName = data.shopDomain?.replace('.myshopify.com', '') || '';
  const dashboardUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard`
    : 'https://adwyse.ca/dashboard';
  const settingsUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard/settings`
    : 'https://adwyse.ca/dashboard/settings';

  // Determine alert styling based on type
  const alertConfig = {
    low_roas: {
      color: '#ef4444',
      icon: '📉',
      title: 'Low ROAS Alert',
      message: `Your ROAS has dropped to <strong>${data.currentValue.toFixed(2)}x</strong>, which is below your threshold of ${data.threshold}x.`,
      action: 'Review your campaign targeting and ad creatives. Consider pausing underperforming ads or adjusting your bidding strategy.',
    },
    high_spend: {
      color: '#f59e0b',
      icon: '💸',
      title: 'High Spend Alert',
      message: `Your daily ad spend has reached <strong>$${data.currentValue.toFixed(2)}</strong>, exceeding your limit of $${data.threshold}.`,
      action: 'Review your campaign budgets and consider pausing or reducing spend on campaigns that aren\'t meeting performance goals.',
    },
    creative_fatigue: {
      color: '#8b5cf6',
      icon: '🎨',
      title: 'Creative Fatigue Alert',
      message: `Your ad creative CTR has dropped by <strong>${data.currentValue.toFixed(1)}%</strong>. Your audience may be experiencing ad fatigue.`,
      action: 'Refresh your ad creatives with new images, videos, or copy. Consider A/B testing new variations to re-engage your audience.',
    },
    conversion_drop: {
      color: '#ec4899',
      icon: '📊',
      title: 'Conversion Drop Alert',
      message: `Your conversions have dropped by <strong>${data.currentValue.toFixed(1)}%</strong> compared to last week.`,
      action: 'Check your landing pages, checkout flow, and ad targeting. Review if any recent changes might have impacted performance.',
    },
    budget_pacing: {
      color: '#06b6d4',
      icon: '⏱️',
      title: 'Budget Pacing Alert',
      message: `Your campaign is spending <strong>${data.currentValue.toFixed(0)}%</strong> faster than expected. You may exhaust your budget early.`,
      action: 'Review your bid strategy and budget allocation. Consider spreading your budget more evenly throughout the day.',
    },
  };

  const config = alertConfig[data.alertType] || alertConfig.low_roas;
  const alertColor = config.color;
  const alertIcon = config.icon;
  const alertTitle = config.title;
  const alertMessage = config.message;
  const recommendedAction = config.action;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdWyse Performance Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: ${alertColor}; padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${alertIcon}</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">${alertTitle}</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">${data.storeName}</p>
            </td>
          </tr>

          <!-- Alert Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px; line-height: 1.6;">
                  ${alertMessage}
                </p>
              </div>

              ${data.campaignName ? `
              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Affected Campaign</p>
                <p style="color: white; margin: 0; font-size: 16px; font-weight: 500;">${data.campaignName}</p>
                ${data.platform ? `<p style="color: rgba(255,255,255,0.4); margin: 5px 0 0 0; font-size: 14px;">${data.platform}</p>` : ''}
              </div>
              ` : ''}

              <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px;">
                <p style="color: #fca5a5; margin: 0; font-size: 14px;">
                  <strong>Recommended Action:</strong><br>
                  ${recommendedAction}
                </p>
              </div>

              ${data.additionalInfo ? `
              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-top: 15px;">
                <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 13px;">
                  <strong>Additional Details:</strong> ${data.additionalInfo}
                </p>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: rgba(0,0,0,0.2); text-align: center;">
              <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 12px;">
                You're receiving this because you enabled performance alerts in AdWyse.
                <br>
                <a href="${settingsUrl}" style="color: #f97316;">Manage alert settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send alert email using Resend API
 */
export async function sendAlertEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AdWyse Alerts <alerts@send.adwyse.ca>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send alert email:', error);
      return false;
    }

    console.log(`✅ Alert email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    return false;
  }
}

/**
 * Check all stores for alert conditions and send notifications
 */
export async function checkAndSendAlerts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all stores with alerts enabled
  const { data: settings, error: settingsError } = await supabase
    .from('store_settings')
    .select(`
      store_id,
      roas_alert_enabled,
      roas_threshold,
      spend_alert_enabled,
      spend_threshold
    `)
    .or('roas_alert_enabled.eq.true,spend_alert_enabled.eq.true');

  if (settingsError || !settings || settings.length === 0) {
    console.log('No stores with alerts enabled');
    return { checked: 0, alerts_sent: 0 };
  }

  console.log(`🔔 Checking alerts for ${settings.length} stores`);

  let alertsSent = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const setting of settings) {
    try {
      // Get store info
      const { data: store } = await supabase
        .from('stores')
        .select('id, store_name, shop_domain, email')
        .eq('id', setting.store_id)
        .single();

      if (!store || !store.email) continue;

      // Get today's campaign data
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('campaign_name, source, ad_spend, revenue')
        .eq('store_id', setting.store_id);

      if (!campaigns || campaigns.length === 0) continue;

      // Calculate totals
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.ad_spend || 0), 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
      const currentRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      // Check ROAS alert
      if (setting.roas_alert_enabled && currentRoas < setting.roas_threshold && totalSpend > 0) {
        // Find worst performing campaign
        const worstCampaign = campaigns
          .filter(c => c.ad_spend > 0)
          .map(c => ({ ...c, roas: c.revenue / c.ad_spend }))
          .sort((a, b) => a.roas - b.roas)[0];

        const alertData: AlertData = {
          storeName: store.store_name,
          shopDomain: store.shop_domain,
          alertType: 'low_roas',
          currentValue: currentRoas,
          threshold: setting.roas_threshold,
          campaignName: worstCampaign?.campaign_name,
          platform: worstCampaign?.source,
        };

        const html = generateAlertEmail(alertData);
        const sent = await sendAlertEmail(
          store.email,
          `⚠️ Low ROAS Alert: ${currentRoas.toFixed(2)}x - ${store.store_name}`,
          html
        );

        if (sent) alertsSent++;
      }

      // Check spend alert
      if (setting.spend_alert_enabled && totalSpend > setting.spend_threshold) {
        // Find highest spending campaign
        const highestSpender = campaigns
          .sort((a, b) => (b.ad_spend || 0) - (a.ad_spend || 0))[0];

        const alertData: AlertData = {
          storeName: store.store_name,
          shopDomain: store.shop_domain,
          alertType: 'high_spend',
          currentValue: totalSpend,
          threshold: setting.spend_threshold,
          campaignName: highestSpender?.campaign_name,
          platform: highestSpender?.source,
        };

        const html = generateAlertEmail(alertData);
        const sent = await sendAlertEmail(
          store.email,
          `💸 High Spend Alert: $${totalSpend.toFixed(2)} - ${store.store_name}`,
          html
        );

        if (sent) alertsSent++;
      }
    } catch (error) {
      console.error(`Error checking alerts for store ${setting.store_id}:`, error);
    }
  }

  return { checked: settings.length, alerts_sent: alertsSent };
}
