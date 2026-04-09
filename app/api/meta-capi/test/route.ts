import { NextRequest, NextResponse } from 'next/server';
import { sendCapiEvent } from '@/lib/meta-capi';

/**
 * Send a test PageView event to Meta CAPI to verify a store's credentials.
 * Used by the settings page "Test connection" button.
 */
export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ error: 'storeId required' }, { status: 400 });
    }

    const result = await sendCapiEvent(storeId, {
      eventName: 'PageView',
      eventTime: Math.floor(Date.now() / 1000),
      eventId: `test_${Date.now()}`,
      actionSource: 'website',
      eventSourceUrl: 'https://adwyse.ca/test',
      userData: {
        clientIpAddress: '127.0.0.1',
        clientUserAgent: 'AdWyse-CAPI-Test/1.0',
        externalId: `test_user_${Date.now()}`,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      eventsReceived: result.eventsReceived,
      message: 'Test event sent. Check Meta Events Manager → Test Events to confirm.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Test failed' },
      { status: 500 }
    );
  }
}
