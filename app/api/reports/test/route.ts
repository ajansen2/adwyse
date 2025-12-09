import { NextRequest, NextResponse } from 'next/server';
import { generateReportEmail, sendReportEmail } from '@/lib/email-reports';

/**
 * Send a test email report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, storeName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Generate test report data
    const testData = {
      storeName: storeName || 'Test Store',
      dateRange: 'Last 7 days (Test)',
      totalOrders: 42,
      totalRevenue: 3250.00,
      attributedOrders: 28,
      attributedRevenue: 2150.00,
      totalSpend: 450.00,
      roas: 4.78,
      topCampaigns: [
        { name: 'Summer Sale Campaign', platform: 'Facebook', spend: 200, revenue: 1200, roas: 6.0 },
        { name: 'Retargeting - Cart Abandoners', platform: 'Facebook', spend: 150, revenue: 650, roas: 4.33 },
        { name: 'Brand Awareness', platform: 'TikTok', spend: 100, revenue: 300, roas: 3.0 },
      ],
    };

    const html = generateReportEmail(testData);
    const subject = '📊 AdWyse Test Report';

    const success = await sendReportEmail(email, subject, html);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email. Check RESEND_API_KEY configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test report:', error);
    return NextResponse.json(
      { error: 'Failed to send test report' },
      { status: 500 }
    );
  }
}
