import { NextResponse } from 'next/server';

/**
 * Manual test endpoint for the recovery email cron job
 * Allows testing the cron job without waiting for the scheduled run
 */
export async function GET() {
  try {
    console.log('🧪 Manually triggering recovery email cron job...');

    // Call the actual cron endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://argora.ai';
    const response = await fetch(`${baseUrl}/api/cron/recovery-emails`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'User-Agent': 'vercel-cron/1.0', // Simulate Vercel cron
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Manual cron test completed',
      cronResponse: data,
    });
  } catch (error) {
    console.error('❌ Manual cron test error:', error);
    return NextResponse.json(
      {
        error: 'Manual cron test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
