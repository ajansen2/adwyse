import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Visit: https://adwyse.ca/api/billing/test?shop=argora-test.myshopify.com
// This will create a billing charge and redirect you to approve it

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({
      error: 'Missing shop parameter',
      usage: 'Visit /api/billing/test?shop=your-store.myshopify.com'
    }, { status: 400 });
  }

  console.log('🧪 [BILLING TEST] Starting for shop:', shop);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get store with access token
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('shop_domain', shop)
    .single();

  if (storeError || !store) {
    console.log('❌ [BILLING TEST] Store not found:', storeError);
    return NextResponse.json({ error: 'Store not found', shop }, { status: 404 });
  }

  if (!store.access_token) {
    console.log('❌ [BILLING TEST] No access token for store');
    return NextResponse.json({ error: 'No access token - app needs to be reinstalled properly' }, { status: 400 });
  }

  console.log('✅ [BILLING TEST] Found store with access token');

  const accessToken = store.access_token;
  const isTestCharge = shop.includes('-test') || shop.includes('development');
  const shopName = shop.replace('.myshopify.com', '');
  const clientId = '08fa8bc27e0e3ac857912c7e7ee289d0';
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${clientId}`;

  // Check for existing charges first
  const existingResponse = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  );

  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    const pending = existing.recurring_application_charges?.find((c: any) => c.status === 'pending');
    if (pending) {
      console.log('✅ [BILLING TEST] Found pending charge, redirecting');
      return NextResponse.redirect(pending.confirmation_url);
    }

    const active = existing.recurring_application_charges?.find((c: any) => c.status === 'active');
    if (active) {
      return NextResponse.json({
        status: 'Already has active subscription',
        charge_id: active.id,
        name: active.name
      });
    }
  }

  // Create new charge
  console.log('🧪 [BILLING TEST] Creating new charge...');
  const chargeResponse = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'AdWyse - Pro Plan',
          price: 99.99,
          trial_days: 7,
          return_url: returnUrl,
          test: isTestCharge,
        },
      }),
    }
  );

  if (!chargeResponse.ok) {
    const error = await chargeResponse.json().catch(() => ({}));
    console.log('❌ [BILLING TEST] Failed:', chargeResponse.status, error);
    return NextResponse.json({
      error: 'Failed to create charge',
      status: chargeResponse.status,
      details: error
    }, { status: 500 });
  }

  const chargeData = await chargeResponse.json();
  const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;

  console.log('✅ [BILLING TEST] Charge created, redirecting to:', confirmationUrl);

  return NextResponse.redirect(confirmationUrl);
}
