/**
 * Email Reports System
 * Sends weekly/monthly performance summaries to merchants
 */

import { createClient } from '@supabase/supabase-js';

interface ReportData {
  storeName: string;
  shopDomain: string; // e.g., "argora-test.myshopify.com"
  dateRange: string;
  totalOrders: number;
  totalRevenue: number;
  attributedOrders: number;
  attributedRevenue: number;
  totalSpend: number;
  roas: number;
  topCampaigns: Array<{
    name: string;
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
  }>;
}

/**
 * Generate HTML email template for performance report
 */
export function generateReportEmail(data: ReportData): string {
  const roasColor = data.roas >= 2 ? '#22c55e' : data.roas >= 1 ? '#eab308' : '#ef4444';

  // Generate Shopify admin URL for the dashboard
  const shopName = data.shopDomain?.replace('.myshopify.com', '') || '';
  const dashboardUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard`
    : 'https://adwyse.ca/dashboard';
  const settingsUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard/settings`
    : 'https://adwyse.ca/dashboard/settings';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdWyse Performance Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <img src="https://adwyse.ca/logo.png" alt="AdWyse" width="50" height="50" style="margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Performance Report</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">${data.storeName} • ${data.dateRange}</p>
            </td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Total Revenue</p>
                      <p style="color: #22c55e; margin: 0; font-size: 28px; font-weight: bold;">$${data.totalRevenue.toFixed(2)}</p>
                      <p style="color: rgba(255,255,255,0.4); margin: 5px 0 0 0; font-size: 12px;">${data.totalOrders} orders</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Ad Spend</p>
                      <p style="color: #ef4444; margin: 0; font-size: 28px; font-weight: bold;">$${data.totalSpend.toFixed(2)}</p>
                      <p style="color: rgba(255,255,255,0.4); margin: 5px 0 0 0; font-size: 12px;">across all platforms</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Attributed Revenue</p>
                      <p style="color: #f97316; margin: 0; font-size: 28px; font-weight: bold;">$${data.attributedRevenue.toFixed(2)}</p>
                      <p style="color: rgba(255,255,255,0.4); margin: 5px 0 0 0; font-size: 12px;">${data.attributedOrders} orders from ads</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">ROAS</p>
                      <p style="color: ${roasColor}; margin: 0; font-size: 28px; font-weight: bold;">${data.roas.toFixed(2)}x</p>
                      <p style="color: rgba(255,255,255,0.4); margin: 5px 0 0 0; font-size: 12px;">return on ad spend</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top Campaigns -->
          ${data.topCampaigns.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Top Performing Campaigns</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden;">
                <tr style="background-color: rgba(255,255,255,0.1);">
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase;">Campaign</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">Spend</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">Revenue</td>
                  <td style="padding: 12px 15px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; text-align: right;">ROAS</td>
                </tr>
                ${data.topCampaigns.map((campaign, index) => `
                <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
                  <td style="padding: 15px;">
                    <p style="color: white; margin: 0; font-weight: 500;">${campaign.name}</p>
                    <p style="color: rgba(255,255,255,0.4); margin: 3px 0 0 0; font-size: 12px;">${campaign.platform}</p>
                  </td>
                  <td style="padding: 15px; color: #ef4444; text-align: right;">$${campaign.spend.toFixed(2)}</td>
                  <td style="padding: 15px; color: #22c55e; text-align: right;">$${campaign.revenue.toFixed(2)}</td>
                  <td style="padding: 15px; color: ${campaign.roas >= 2 ? '#22c55e' : campaign.roas >= 1 ? '#eab308' : '#ef4444'}; text-align: right; font-weight: bold;">${campaign.roas.toFixed(2)}x</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Full Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: rgba(0,0,0,0.2); text-align: center;">
              <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 12px;">
                You're receiving this because you enabled email reports in AdWyse.
                <br>
                <a href="${settingsUrl}" style="color: #f97316;">Manage preferences</a>
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
 * Send email report using Resend API
 */
export async function sendReportEmail(
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
        from: 'AdWyse <reports@send.adwyse.ca>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log(`✅ Report email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate and send weekly/monthly reports for all subscribed merchants
 */
export async function sendScheduledReports(frequency: 'weekly' | 'monthly') {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all stores with email reports enabled
  const { data: stores, error } = await supabase
    .from('stores')
    .select(`
      *,
      merchants (email, full_name),
      email_report_frequency
    `)
    .eq('email_report_frequency', frequency)
    .eq('status', 'active');

  if (error || !stores) {
    console.error('Failed to fetch stores for reports:', error);
    return;
  }

  console.log(`📧 Sending ${frequency} reports to ${stores.length} stores`);

  const now = new Date();
  const startDate = frequency === 'weekly'
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  for (const store of stores) {
    try {
      // Get orders for the period
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      // Get campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('store_id', store.id);

      if (!orders) continue;

      const totalRevenue = orders.reduce((sum, o) => sum + o.order_total, 0);
      const attributedOrders = orders.filter(o => o.ad_source && o.ad_source !== 'direct');
      const attributedRevenue = attributedOrders.reduce((sum, o) => sum + o.order_total, 0);
      const totalSpend = campaigns?.reduce((sum, c) => sum + c.ad_spend, 0) || 0;

      const reportData: ReportData = {
        storeName: store.store_name,
        dateRange: frequency === 'weekly' ? 'Last 7 days' : 'Last 30 days',
        totalOrders: orders.length,
        totalRevenue,
        attributedOrders: attributedOrders.length,
        attributedRevenue,
        totalSpend,
        roas: totalSpend > 0 ? attributedRevenue / totalSpend : 0,
        topCampaigns: (campaigns || [])
          .filter(c => c.ad_spend > 0)
          .map(c => ({
            name: c.campaign_name,
            platform: c.source,
            spend: c.ad_spend,
            revenue: c.revenue || 0,
            roas: c.ad_spend > 0 ? (c.revenue || 0) / c.ad_spend : 0,
          }))
          .sort((a, b) => b.roas - a.roas)
          .slice(0, 5),
      };

      const html = generateReportEmail(reportData);
      const subject = `${frequency === 'weekly' ? 'Weekly' : 'Monthly'} Report: ${store.store_name}`;

      await sendReportEmail(store.merchants?.email, subject, html);
    } catch (error) {
      console.error(`Failed to send report for store ${store.id}:`, error);
    }
  }
}
