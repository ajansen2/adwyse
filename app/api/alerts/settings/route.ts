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

    const { data: settings } = await supabase
      .from('store_settings')
      .select('roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold')
      .eq('store_id', storeId)
      .maybeSingle();

    return NextResponse.json({
      roas_alert_enabled: settings?.roas_alert_enabled || false,
      roas_threshold: settings?.roas_threshold || 1.5,
      spend_alert_enabled: settings?.spend_alert_enabled || false,
      spend_threshold: settings?.spend_threshold || 100,
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

    // Upsert into store_settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        store_id: storeId,
        roas_alert_enabled,
        roas_threshold,
        spend_alert_enabled,
        spend_threshold,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id' });

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
