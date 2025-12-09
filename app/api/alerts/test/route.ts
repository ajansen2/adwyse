import { NextRequest, NextResponse } from 'next/server';
import { generateAlertEmail, sendAlertEmail } from '@/lib/performance-alerts';

/**
 * Send a test alert email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, storeName, shopDomain, alertType } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const type = alertType === 'high_spend' ? 'high_spend' : 'low_roas';

    // Generate test alert data
    const testData = {
      storeName: storeName || 'Test Store',
      shopDomain: shopDomain || '',
      alertType: type as 'low_roas' | 'high_spend',
      currentValue: type === 'low_roas' ? 0.85 : 250.00,
      threshold: type === 'low_roas' ? 1.5 : 100,
      campaignName: 'Summer Sale Campaign',
      platform: 'Facebook',
    };

    const html = generateAlertEmail(testData);
    const subject = type === 'low_roas'
      ? `⚠️ [TEST] Low ROAS Alert: ${testData.currentValue.toFixed(2)}x`
      : `💸 [TEST] High Spend Alert: $${testData.currentValue.toFixed(2)}`;

    const success = await sendAlertEmail(email, subject, html);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} alert sent to ${email}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send alert. Check RESEND_API_KEY configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test alert:', error);
    return NextResponse.json(
      { error: 'Failed to send test alert' },
      { status: 500 }
    );
  }
}
