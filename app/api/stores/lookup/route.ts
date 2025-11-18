import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API endpoint to look up merchant by shop URL (bypasses RLS)
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Look up merchant by store URL (use limit(1) to handle duplicate stores)
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('merchant_id, id, store_name, store_url, platform, status')
      .eq('store_url', `https://${shop}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storeError || !storeData) {
      console.error('Store lookup error:', storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get merchant profile
    const { data: merchantData, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', storeData.merchant_id)
      .single();

    if (merchantError || !merchantData) {
      console.error('Merchant lookup error:', merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    return NextResponse.json({
      merchant: merchantData,
      store: storeData
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
