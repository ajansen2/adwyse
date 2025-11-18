// app/api/emails/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, dashboardUrl } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // SendGrid API configuration
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@argora.ai';

    if (!SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured - email not sent');
      return NextResponse.json(
        {
          success: false,
          message: 'Email service not configured',
          devNote: 'Set SENDGRID_API_KEY in environment variables'
        },
        { status: 200 } // Return 200 to not break the flow
      );
    }

    // Prepare the email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
    .subtitle { font-size: 18px; color: #888888; }
    .card { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border: 1px solid #333333; border-radius: 16px; padding: 30px; margin: 20px 0; }
    .dashboard-url { background: #0f0f0f; border: 1px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .url-link { color: #667eea; font-size: 18px; text-decoration: none; word-break: break-all; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .checklist { margin: 20px 0; }
    .checklist-item { display: flex; align-items: start; margin: 15px 0; }
    .checkmark { color: #667eea; font-size: 24px; margin-right: 15px; }
    .footer { text-align: center; color: #666666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ARGORA DEALS</div>
      <h1 class="title">Welcome to Your Investment Dashboard! 🎉</h1>
      <p class="subtitle">Your personalized real estate analysis platform is ready</p>
    </div>

    <div class="card">
      <h2 style="color: #ffffff; margin-bottom: 20px;">You're All Set!</h2>
      <p style="color: #cccccc; line-height: 1.6;">
        Thank you for joining ARGORA DEALS! Your dashboard has been created and is ready to help you find and analyze profitable real estate investments.
      </p>

      <div class="dashboard-url">
        <p style="color: #888888; margin-bottom: 10px;">Your Dashboard URL:</p>
        <a href="${dashboardUrl || 'https://demo.argora.ai'}" class="url-link">${dashboardUrl || 'https://demo.argora.ai'}</a>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl || 'https://demo.argora.ai'}" class="button">
          Access My Dashboard →
        </a>
      </div>
    </div>

    <div class="card">
      <h3 style="color: #ffffff; margin-bottom: 20px;">What's Included:</h3>
      <div class="checklist">
        <div class="checklist-item">
          <span class="checkmark">✓</span>
          <div>
            <strong style="color: #ffffff;">Real-time Market Intelligence</strong>
            <p style="color: #888888; margin: 5px 0 0 0;">ATTOM Data & RentCast integration for accurate property data and rental comps</p>
          </div>
        </div>
        <div class="checklist-item">
          <span class="checkmark">✓</span>
          <div>
            <strong style="color: #ffffff;">AI-Powered Insights</strong>
            <p style="color: #888888; margin: 5px 0 0 0;">Claude AI analyzes deals and provides investment recommendations</p>
          </div>
        </div>
        <div class="checklist-item">
          <span class="checkmark">✓</span>
          <div>
            <strong style="color: #ffffff;">Comprehensive Financial Metrics</strong>
            <p style="color: #888888; margin: 5px 0 0 0;">NOI, Cap Rate, Cash Flow, ROI, IRR - all calculated instantly</p>
          </div>
        </div>
        <div class="checklist-item">
          <span class="checkmark">✓</span>
          <div>
            <strong style="color: #ffffff;">Portfolio Tracking</strong>
            <p style="color: #888888; margin: 5px 0 0 0;">Manage multiple properties and track performance over time</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="color: #ffffff; margin-bottom: 20px;">Quick Start Guide:</h3>
      <ol style="color: #cccccc; line-height: 1.8;">
        <li>Click the button above to access your dashboard</li>
        <li>Add your first property address for analysis</li>
        <li>Input purchase details and financing terms</li>
        <li>Review AI-powered insights and financial metrics</li>
        <li>Save profitable deals to your portfolio</li>
      </ol>
    </div>

    <div class="card" style="background: linear-gradient(135deg, #667eea20, #764ba220); border-color: #667eea;">
      <h3 style="color: #ffffff; margin-bottom: 15px;">Need Help?</h3>
      <p style="color: #cccccc; margin-bottom: 15px;">Our support team is here to help you get started:</p>
      <p style="color: #888888; margin: 5px 0;">📧 Email: <a href="mailto:support@argora.ai" style="color: #667eea;">support@argora.ai</a></p>
      <p style="color: #888888; margin: 5px 0;">📚 Documentation: <a href="https://deals.argora.ai/how-it-works" style="color: #667eea;">How It Works Guide</a></p>
    </div>

    <div class="footer">
      <p>© 2025 Argora.ai - All Rights Reserved</p>
      <p style="margin-top: 10px;">You're receiving this email because you signed up for ARGORA DEALS</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via SendGrid
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
            subject: 'Welcome to ARGORA DEALS - Your Dashboard is Ready! 🎉',
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
      message: 'Welcome email sent successfully',
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
