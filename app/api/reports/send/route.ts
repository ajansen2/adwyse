import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledReports } from '@/lib/email-reports';

/**
 * Trigger scheduled email reports
 * Called by Vercel Cron (GET) or external service (POST)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine frequency from query param or default to weekly
    const frequency = request.nextUrl.searchParams.get('frequency') as 'weekly' | 'monthly' || 'weekly';

    if (!['weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Use "weekly" or "monthly"' },
        { status: 400 }
      );
    }

    console.log(`📧 Triggering ${frequency} email reports via cron`);

    await sendScheduledReports(frequency);

    return NextResponse.json({
      success: true,
      message: `${frequency} reports sent successfully`,
    });
  } catch (error) {
    console.error('Error sending reports:', error);
    return NextResponse.json(
      { error: 'Failed to send reports' },
      { status: 500 }
    );
  }
}

/**
 * Trigger scheduled email reports (POST for manual triggers)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { frequency } = body;

    if (!frequency || !['weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Use "weekly" or "monthly"' },
        { status: 400 }
      );
    }

    console.log(`📧 Triggering ${frequency} email reports`);

    await sendScheduledReports(frequency);

    return NextResponse.json({
      success: true,
      message: `${frequency} reports sent successfully`,
    });
  } catch (error) {
    console.error('Error sending reports:', error);
    return NextResponse.json(
      { error: 'Failed to send reports' },
      { status: 500 }
    );
  }
}
