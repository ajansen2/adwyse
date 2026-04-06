import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('roas_alert_enabled, roas_threshold, spend_alert_enabled, spend_threshold')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching alert settings:', error);
      return NextResponse.json({
        roas_alert_enabled: false,
        spend_alert_enabled: false
      });
    }

    return NextResponse.json({
      roas_alert_enabled: settings?.roas_alert_enabled || false,
      roas_threshold: settings?.roas_threshold || 1.5,
      spend_alert_enabled: settings?.spend_alert_enabled || false,
      spend_threshold: settings?.spend_threshold || 100
    });
  } catch (error) {
    console.error('Error in alerts settings GET:', error);
    return NextResponse.json({
      roas_alert_enabled: false,
      spend_alert_enabled: false
    });
  }
}
