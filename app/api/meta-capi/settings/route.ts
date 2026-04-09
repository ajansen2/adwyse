import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET — load a store's CAPI settings.
 * Returns the token MASKED (last 4 chars only) so it never round-trips
 * back to the client in plaintext.
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from('store_settings')
      .select('meta_pixel_id, meta_capi_token, meta_capi_test_code, meta_capi_enabled')
      .eq('store_id', storeId)
      .maybeSingle();

    const token = data?.meta_capi_token || '';
    const maskedToken = token
      ? `${'•'.repeat(Math.max(0, token.length - 4))}${token.slice(-4)}`
      : '';

    return NextResponse.json({
      enabled: data?.meta_capi_enabled || false,
      pixelId: data?.meta_pixel_id || '',
      tokenMasked: maskedToken,
      hasToken: !!token,
      testCode: data?.meta_capi_test_code || '',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load CAPI settings' },
      { status: 500 }
    );
  }
}

/**
 * POST — save CAPI settings.
 * Only updates the token if a new (non-masked) value is provided so users
 * don't accidentally wipe their token by saving the form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, enabled, pixelId, token, testCode } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Build update — only set token if user provided a real new one
    const update: any = {
      store_id: storeId,
      meta_capi_enabled: !!enabled,
      meta_pixel_id: pixelId || null,
      meta_capi_test_code: testCode || null,
      updated_at: new Date().toISOString(),
    };
    if (token && !token.includes('•')) {
      update.meta_capi_token = token;
    }

    const { error } = await supabase
      .from('store_settings')
      .upsert(update, { onConflict: 'store_id' });

    if (error) {
      console.error('Failed to save CAPI settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save CAPI settings' },
      { status: 500 }
    );
  }
}
