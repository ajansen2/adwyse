/**
 * Shared Email Templates
 *
 * Dark-themed HTML wrapper used by all transactional emails.
 * Each email type calls `buildEmail()` with its content.
 */

interface EmailContent {
  /** Main heading */
  title: string;
  /** HTML body content (paragraphs, lists, etc.) */
  body: string;
  /** CTA button text */
  ctaText: string;
  /** CTA button URL */
  ctaUrl: string;
  /** Optional preheader text (shows in inbox preview) */
  preheader?: string;
}

/**
 * Generates a complete HTML email with AdWyse dark branding.
 * Mobile-responsive, single-column, renders in all major clients.
 */
export function buildEmail(content: EmailContent): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${content.title}</title>
<!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
${content.preheader ? `<div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${content.preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px;">
    <img src="https://adwyse.ca/logo.png" alt="AdWyse" width="44" height="44" style="display:block;margin-bottom:6px;">
    <span style="font-size:22px;font-weight:700;background:linear-gradient(to right,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#f97316;">AdWyse</span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 28px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">${content.title}</h1>
    <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;">
      ${content.body}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr><td align="center">
        <a href="${content.ctaUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#ffffff;font-weight:600;font-size:16px;text-decoration:none;border-radius:12px;">${content.ctaText}</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-top:24px;color:rgba(255,255,255,0.25);font-size:12px;line-height:1.6;">
    <p style="margin:0;">AdWyse &mdash; Ad Attribution for Shopify</p>
    <p style="margin:6px 0 0;">You received this because you installed AdWyse on your store.<br><a href="https://adwyse.ca" style="color:rgba(255,255,255,0.35);text-decoration:underline;">Unsubscribe</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Helpers ────────────────────────────────────────────────

export function dashboardUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  const apiKey = process.env.SHOPIFY_API_KEY;
  return `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
}

// ─── Welcome Email ──────────────────────────────────────────

export function welcomeEmailContent(shopDomain: string): { subject: string; from: string; html: string } {
  const url = dashboardUrl(shopDomain);
  return {
    subject: 'Welcome to AdWyse \u2014 see your true ROAS in about 10 minutes',
    from: 'AdWyse <welcome@send.adwyse.ca>',
    html: buildEmail({
      title: 'Welcome to AdWyse!',
      preheader: 'Your 7-day free trial is active. Connect your ad account to start.',
      body: `
        <p style="margin:0 0 16px;">Your <strong style="color:#22c55e;">7-day free trial</strong> is active. All Pro features are unlocked.</p>
        <p style="margin:0 0 20px;">Connect a Facebook, Google, or TikTok ad account and AdWyse will start calculating your true ROAS within minutes &mdash; no code or pixel setup required.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr><td style="background:rgba(255,255,255,0.05);border-radius:10px;padding:18px;">
            <p style="color:#f97316;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">What you get during trial</p>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2;margin:0;">
              AI Chat &mdash; ask anything about your campaigns<br>
              Competitor Spy &mdash; see rivals' live ads<br>
              Cohort Retention &amp; Creative Score<br>
              NC-ROAS, Budget Optimizer &amp; more
            </p>
          </td></tr>
        </table>
      `,
      ctaText: 'Connect your ad account',
      ctaUrl: url,
    }),
  };
}

// ─── Subscription Confirmation Email ────────────────────────

export function subscriptionConfirmationContent(shopDomain: string): { subject: string; from: string; html: string } {
  const url = dashboardUrl(shopDomain);
  return {
    subject: "You're on AdWyse Pro \u2014 all features unlocked",
    from: 'AdWyse <billing@send.adwyse.ca>',
    html: buildEmail({
      title: "You're on AdWyse Pro",
      preheader: 'All Pro features are now unlocked. Here is what you can do.',
      body: `
        <p style="margin:0 0 20px;">Your subscription is confirmed. Every Pro feature is now permanently unlocked for your store.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr><td style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:10px;padding:18px;">
            <p style="color:#22c55e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">Pro features unlocked</p>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:2;margin:0;">
              <strong style="color:white;">AI Chat</strong> &mdash; ask anything about your ad performance<br>
              <strong style="color:white;">Competitor Spy</strong> &mdash; real-time competitor ad monitoring<br>
              <strong style="color:white;">Cohort Retention</strong> &mdash; track repeat purchase behavior<br>
              <strong style="color:white;">Creative Score</strong> &mdash; rank and kill underperformers
            </p>
          </td></tr>
        </table>
        <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0;">Billed through Shopify. Cancel anytime from your Shopify admin.</p>
      `,
      ctaText: 'Go to Dashboard',
      ctaUrl: url,
    }),
  };
}
