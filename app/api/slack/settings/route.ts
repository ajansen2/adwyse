import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { testSlackWebhook } from '@/lib/slack-notifications';

/**
 * Get Slack settings for a store
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

    const { data } = await supabase
      .from('store_settings')
      .select('slack_enabled, slack_webhook_url, slack_daily_summary')
      .eq('store_id', storeId)
      .maybeSingle();

    return NextResponse.json({
      enabled: data?.slack_enabled || false,
      webhookUrl: data?.slack_webhook_url || '',
      dailySummary: data?.slack_daily_summary || false,
    });
  } catch (error) {
    console.error('Error fetching Slack settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * Update Slack settings for a store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, webhookUrl, enabled, dailySummary } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // If enabling and webhook URL provided, test it first
    if (enabled && webhookUrl) {
      const isValid = await testSlackWebhook(webhookUrl);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook URL. Please check and try again.' },
          { status: 400 }
        );
      }
    }

    // Upsert into store_settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        store_id: storeId,
        slack_enabled: enabled,
        slack_webhook_url: webhookUrl || null,
        slack_daily_summary: dailySummary || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id' });

    if (error) {
      console.error('Error updating Slack settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: enabled ? 'Slack integration enabled' : 'Slack integration disabled',
    });
  } catch (error) {
    console.error('Error updating Slack settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
