import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to extend a merchant's trial period
 * Use this to give testers free access for extended periods
 *
 * Example usage:
 * POST /api/admin/extend-trial
 * Headers: { "x-admin-key": "your-secret-admin-key" }
 * Body: { "shop_domain": "store.myshopify.com", "months": 6 }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin key
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_SECRET_KEY;

    if (!expectedKey || adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shop_domain, months = 6, note } = body;

    if (!shop_domain) {
      return NextResponse.json({ error: 'shop_domain is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Calculate new trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + months);

    // Update the store
    const { data: store, error } = await supabase
      .from('stores')
      .update({
        subscription_status: 'extended_trial',
        trial_ends_at: trialEndsAt.toISOString(),
        trial_note: note || `Extended trial: ${months} months`,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_domain', shop_domain)
      .select()
      .single();

    if (error) {
      console.error('Error extending trial:', error);
      return NextResponse.json({ error: 'Store not found or update failed' }, { status: 404 });
    }

    console.log(`✅ Extended trial for ${shop_domain} to ${trialEndsAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Trial extended for ${months} months`,
      store: {
        shop_domain: store.shop_domain,
        trial_ends_at: store.trial_ends_at,
        subscription_status: store.subscription_status,
      },
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET endpoint to check a store's trial status
 */
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_SECRET_KEY;

    if (!expectedKey || adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shop_domain = request.nextUrl.searchParams.get('shop_domain');

    if (!shop_domain) {
      return NextResponse.json({ error: 'shop_domain is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: store, error } = await supabase
      .from('stores')
      .select('shop_domain, store_name, subscription_status, trial_ends_at, created_at')
      .eq('shop_domain', shop_domain)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      store,
    });
  } catch (error) {
    console.error('Check trial error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
