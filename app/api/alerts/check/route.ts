import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendAlerts } from '@/lib/performance-alerts';

/**
 * Check all stores for alert conditions and send notifications
 * Called by cron job (daily)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');

    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Running performance alert check...');

    const result = await checkAndSendAlerts();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check alerts' },
      { status: 500 }
    );
  }
}
