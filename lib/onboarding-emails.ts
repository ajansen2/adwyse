/**
 * Onboarding Email Sequence
 *
 * Triggered by cron, sends timed emails based on when the merchant installed.
 * Sequence:
 *   Day 0 (immediate): Welcome to AdWyse
 *   Day 1: Have you connected your ad accounts?
 *   Day 3: Try AI Assistant — ask it about your campaigns
 *   Day 5: Set up Competitor Spy — see what rivals are running
 *   Day 6: Trial ending tomorrow — upgrade to keep Pro features
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'AdWyse <hello@send.adwyse.ca>';

function dashboardUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard`;
}

function settingsUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard/settings`;
}

function pricingUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard/pricing`;
}

function wrapEmail(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://adwyse.ca/logo.png" alt="AdWyse" width="48" height="48" style="margin-bottom:8px;">
      <div style="font-size:24px;font-weight:bold;background:linear-gradient(to right,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AdWyse</div>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:rgba(255,255,255,0.3);font-size:12px;">
      <p>AdWyse — Ad Attribution for Shopify</p>
      <p>You're receiving this because you installed AdWyse. <a href="https://adwyse.ca" style="color:rgba(255,255,255,0.4);">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#f59e0b,#ea580c);color:white;font-weight:bold;font-size:16px;text-decoration:none;border-radius:12px;margin-top:8px;">${text}</a>`;
}

// ─── Email Templates ────────────────────────────────────────

export function welcomeEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Welcome to AdWyse, ${storeName}!`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:28px;margin:0 0 8px;">Welcome to AdWyse!</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Your 7-day Pro trial has started. Here's how to get the most out of it.</p>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#f97316;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Quick Start Checklist</h3>
        <div style="color:white;font-size:15px;line-height:2;">
          1. Connect your ad accounts (Facebook, Google, TikTok)<br>
          2. Install the tracking pixel on your store<br>
          3. Ask the AI Assistant your first question<br>
          4. Set up performance alerts
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.6);font-size:14px;">Your dashboard is ready with demo data so you can explore all features right away.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Open Your Dashboard', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function connectAccountsEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `${storeName} — connect your ad accounts to see real ROAS`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Connect Your Ad Accounts</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">AdWyse works best with real data. Connect at least one ad account to start tracking ROAS automatically.</p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">📘</div>
          <div style="color:white;font-size:14px;font-weight:600;">Facebook Ads</div>
        </div>
        <div style="flex:1;background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">🔍</div>
          <div style="color:white;font-size:14px;font-weight:600;">Google Ads</div>
        </div>
        <div style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">🎵</div>
          <div style="color:white;font-size:14px;font-weight:600;">TikTok Ads</div>
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Takes 30 seconds per account. Your data stays private and encrypted.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Connect Ad Accounts', settingsUrl(shopDomain))}
      </div>
    `),
  };
}

export function tryAiChatEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Ask AdWyse: "What's my best campaign?"`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Try the AI Assistant</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Your data is loaded. Ask the AI anything about your ad performance — in plain English.</p>

      <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#f97316;font-size:14px;margin:0 0 12px;">Try asking:</h3>
        <div style="color:rgba(255,255,255,0.8);font-size:15px;line-height:2;">
          "What's my best performing campaign?"<br>
          "Which campaign is losing money?"<br>
          "What should I scale next week?"<br>
          "Why did my ROAS drop yesterday?"
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Click the orange chat button on your dashboard to start.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Chat with Your Data', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function competitorSpyEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `See what your competitors are running on Meta`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Spy on Competitor Ads</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Add any brand and see their currently-running Facebook & Instagram ads in real-time.</p>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:white;font-size:16px;margin:0 0 12px;">What you can see:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:2;">
          &#10003; Their live ad creatives (images, videos, carousels)<br>
          &#10003; Ad copy and headlines<br>
          &#10003; How long each ad has been running<br>
          &#10003; Which formats they're testing
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Most stores add 3-5 competitors. The more you track, the better your creative inspiration.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Add Your First Competitor', dashboardUrl(shopDomain) + '/competitor-spy')}
      </div>
    `),
  };
}

export function trialEndingEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Your AdWyse Pro trial ends tomorrow`,
    html: wrapEmail(`
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Your Trial Ends Tomorrow</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 24px;">Your 7-day Pro trial is almost over. Subscribe to keep all your Pro features.</p>

      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#ef4444;font-size:14px;margin:0 0 12px;">What you'll lose without Pro:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:2;">
          &#10007; AI Assistant (Ask AdWyse)<br>
          &#10007; Competitor Spy<br>
          &#10007; Creative Score & Cohort Retention<br>
          &#10007; NC-ROAS & Budget Optimizer<br>
          &#10007; Multi-touch Attribution & CAPI<br>
          &#10007; Unlimited orders & data history
        </div>
      </div>

      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#22c55e;font-size:14px;margin:0 0 12px;">What you keep on Free:</h3>
        <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.8;">
          &#10003; Basic ROAS dashboard<br>
          &#10003; 1 ad account, 100 orders/month<br>
          &#10003; Conversion funnel
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Upgrade to Pro — $99.99/mo', pricingUrl(shopDomain))}
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:12px;">Cancel anytime. Billed through Shopify.</p>
      </div>
    `),
  };
}

// ─── Send function ──────────────────────────────────────────

export async function sendOnboardingEmail(
  to: string,
  email: { subject: string; html: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      console.error('Onboarding email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Onboarding email failed:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
