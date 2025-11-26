import { NextRequest, NextResponse } from 'next/server';
import { getAlerts, getUnreadAlertsCount, markAlertsRead, checkAlerts } from '@/lib/alerts';
import { createClient } from '@supabase/supabase-js';

/**
 * Get alerts for a store
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Check for new alerts first
    await checkAlerts(storeId);

    const alerts = await getAlerts(storeId);
    const unreadCount = await getUnreadAlertsCount(storeId);

    return NextResponse.json({
      alerts,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * Mark alerts as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json({ error: 'Alert IDs required' }, { status: 400 });
    }

    await markAlertsRead(alertIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking alerts read:', error);
    return NextResponse.json(
      { error: 'Failed to mark alerts read' },
      { status: 500 }
    );
  }
}
