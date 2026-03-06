import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, shop, type } = await request.json();
    if (!to || !shop || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) return NextResponse.json({ success: false, message: 'Email not configured' });

    const shopName = shop.replace('.myshopify.com', '');
    const appUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_API_KEY}`;
    const content = getEmailContent(type, shopName);
    const subjects: Record<string, string> = {
      expiring_soon: 'Your AdWyse trial is ending soon',
      expired: 'Your AdWyse trial has expired',
      pending: 'Complete your AdWyse subscription',
    };

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><style>
body { font-family: -apple-system, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 0; }
.container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
.logo { font-size: 32px; font-weight: 800; color: #8b5cf6; text-align: center; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 30px; margin: 20px 0; }
.alert { background: ${content.badgeColor}; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
.button { display: inline-block; background: #8b5cf6; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; }
</style></head>
<body>
<div class="container">
  <div class="logo">AdWyse</div>
  <h1 style="text-align:center; margin: 20px 0;">${content.title}</h1>
  <div class="alert"><h2 style="margin:0;">${content.badge}</h2><p style="margin:10px 0 0 0;">${content.badgeSubtext}</p></div>
  <div class="card">
    <p style="color:#cbd5e1; line-height:1.6;">${content.cardBody}</p>
    <div style="text-align:center; margin-top:30px;"><a href="${appUrl}" class="button">${content.buttonText} →</a></div>
  </div>
</div>
</body></html>`;

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject: subjects[type] }],
        from: { email: process.env.FROM_EMAIL || 'noreply@adwyse.io', name: 'AdWyse' },
        content: [{ type: 'text/html', value: emailHtml }],
      }),
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

function getEmailContent(type: string, shopName: string) {
  const contents: Record<string, any> = {
    expiring_soon: { title: 'Trial Ending Soon', badge: '⏰ 3 Days Left', badgeSubtext: 'Your trial expires soon', badgeColor: '#f59e0b', cardBody: `Your AdWyse trial for <strong>${shopName}</strong> is ending. Upgrade to keep optimizing your ads.`, buttonText: 'Upgrade Now' },
    expired: { title: 'Trial Expired', badge: '🔒 Expired', badgeSubtext: 'Access paused', badgeColor: '#ef4444', cardBody: `Your trial for <strong>${shopName}</strong> has expired. Upgrade to restore access.`, buttonText: 'Upgrade Now' },
    pending: { title: 'Complete Setup', badge: '⏳ Pending', badgeSubtext: 'Waiting for approval', badgeColor: '#3b82f6', cardBody: `Complete your subscription for <strong>${shopName}</strong>.`, buttonText: 'Complete Setup' },
  };
  return contents[type] || contents.expired;
}
