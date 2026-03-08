import { NextRequest, NextResponse } from 'next/server';
import { checkSubscription } from '@/lib/check-subscription';

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const subscription = await checkSubscription(storeId);

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      limits: subscription.limits,
      daysRemaining: subscription.daysRemaining,
      message: subscription.message,
    });
  } catch (error) {
    console.error('Error checking subscription tier:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
