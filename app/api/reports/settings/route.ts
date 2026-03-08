import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkSubscription } from '@/lib/check-subscription';

/**
 * Get email report settings for a store
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Check subscription to determine if email reports are available
    const subscription = await checkSubscription(storeId);
    const canUseEmailReports = subscription.limits.emailReports;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: settings } = await supabase
      .from('store_settings')
      .select('email_report_frequency')
      .eq('store_id', storeId)
      .maybeSingle();

    return NextResponse.json({
      frequency: settings?.email_report_frequency || 'none',
      tier: subscription.tier,
      canUseEmailReports,
    });
  } catch (error) {
    console.error('Error fetching report settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * Update email report settings for a store
 * PRO FEATURE - Email reports require Pro subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, frequency } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    if (!['none', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Use "none", "weekly", or "monthly"' },
        { status: 400 }
      );
    }

    // Check subscription - Email Reports is a Pro feature
    // Allow setting to 'none' for any tier, but require Pro for weekly/monthly
    if (frequency !== 'none') {
      const subscription = await checkSubscription(storeId);
      if (!subscription.limits.emailReports) {
        return NextResponse.json({
          error: 'Pro feature required',
          message: 'Email reports are a Pro feature. Upgrade to unlock.',
          currentTier: subscription.tier
        }, { status: 403 });
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert into store_settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        store_id: storeId,
        email_report_frequency: frequency,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id' });

    if (error) {
      console.error('Error updating report settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      frequency,
    });
  } catch (error) {
    console.error('Error updating report settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
