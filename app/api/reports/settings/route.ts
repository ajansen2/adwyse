import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get email report settings for a store
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
      .select('email_report_frequency')
      .eq('store_id', storeId)
      .maybeSingle();

    return NextResponse.json({
      frequency: settings?.email_report_frequency || 'none',
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
