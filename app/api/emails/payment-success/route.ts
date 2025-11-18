// app/api/emails/payment-success/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, amountPaid, subscriptionId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@argora.ai';

    if (!SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured - email not sent');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 200 }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border: 1px solid #333333; border-radius: 16px; padding: 30px; margin: 20px 0; }
    .success-badge { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
    .amount { font-size: 36px; font-weight: 700; margin: 10px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; color: #666666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ARGORA DEALS</div>
      <h1 style="color: #ffffff; margin: 20px 0;">Payment Successful! ✅</h1>
    </div>

    <div class="success-badge">
      <p style="margin: 0; font-size: 18px;">Payment Received</p>
      <div class="amount">$${(amountPaid / 100).toFixed(2)}</div>
      <p style="margin: 0; color: #d1fae5;">Thank you for your payment!</p>
    </div>

    <div class="card">
      <h2 style="color: #ffffff; margin-bottom: 20px;">Your Subscription is Active</h2>
      <p style="color: #cccccc; line-height: 1.6;">
        Your payment has been processed successfully and your subscription has been renewed.
        You continue to have full access to all ARGORA DEALS features.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://deals.argora.ai/dashboard" class="button">
          Go to Dashboard →
        </a>
      </div>
    </div>

    <div class="card">
      <h3 style="color: #ffffff; margin-bottom: 15px;">Payment Details</h3>
      <p style="color: #888888; margin: 5px 0;">Subscription ID: ${subscriptionId || 'N/A'}</p>
      <p style="color: #888888; margin: 5px 0;">Amount Paid: $${(amountPaid / 100).toFixed(2)}</p>
      <p style="color: #888888; margin: 5px 0;">Payment Date: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="card">
      <p style="color: #cccccc;">
        Questions about your payment? Contact us at
        <a href="mailto:support@argora.ai" style="color: #667eea;">support@argora.ai</a>
      </p>
    </div>

    <div class="footer">
      <p>© 2025 Argora.ai - All Rights Reserved</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: 'Payment Successful - ARGORA DEALS',
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: 'ARGORA DEALS',
        },
        content: [
          {
            type: 'text/html',
            value: emailHtml,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment success email sent',
    });

  } catch (error) {
    console.error('Error sending payment success email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
