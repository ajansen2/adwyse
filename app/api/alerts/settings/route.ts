import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get alert settings for a store
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: store, error } = await supabase
      .from('stores')
      .select('roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold')
      .eq('id', storeId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      roas_alert_enabled: store.roas_alert_enabled || false,
      roas_threshold: store.roas_threshold || 1.5,
      spend_alert_enabled: store.spend_alert_enabled || false,
      spend_threshold: store.spend_threshold || 100,
    });
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * Update alert settings for a store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from('stores')
      .update({
        roas_alert_enabled,
        roas_threshold,
        spend_alert_enabled,
        spend_threshold,
      })
      .eq('id', storeId);

    if (error) {
      console.error('Error updating alert settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
