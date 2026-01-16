import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('💰 [BILLING CREATE] Starting...');

  try {
    const { storeId, shop } = await request.json();
    console.log('💰 [BILLING CREATE] Params:', { storeId, shop });

    if (!storeId || !shop) {
      console.log('❌ [BILLING CREATE] Missing params');
      return NextResponse.json({ error: 'Missing storeId or shop' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store with access token
    console.log('💰 [BILLING CREATE] Looking up store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.log('❌ [BILLING CREATE] Store not found:', storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('✅ [BILLING CREATE] Found store:', store.shop_domain);

    const accessToken = store.access_token;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
    const isTestCharge = shop.includes('-test') || shop.includes('development');
    console.log('💰 [BILLING CREATE] Test charge:', isTestCharge, 'App URL:', appUrl);

    // Check for existing pending or active charges
    console.log('💰 [BILLING CREATE] Checking existing charges...');
    const existingChargesResponse = await fetch(
      `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
      {
        headers: { 'X-Shopify-Access-Token': accessToken },
      }
    );

    console.log('💰 [BILLING CREATE] Existing charges response:', existingChargesResponse.status);

    if (existingChargesResponse.ok) {
      const existingCharges = await existingChargesResponse.json();
      console.log('💰 [BILLING CREATE] Found charges:', existingCharges.recurring_application_charges?.length || 0);

      // If already has active subscription, return success
      const activeCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'active'
      );
      if (activeCharge) {
        console.log('✅ [BILLING CREATE] Found active charge:', activeCharge.id);
        // Update store status
        await supabase
          .from('stores')
          .update({ subscription_status: 'active', billing_charge_id: activeCharge.id.toString() })
          .eq('id', storeId);
        return NextResponse.json({ status: 'active', message: 'Already subscribed' });
      }

      // If has pending charge, return confirmation URL
      const pendingCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'pending'
      );
      if (pendingCharge) {
        console.log('💰 [BILLING CREATE] Found pending charge:', pendingCharge.id);
        return NextResponse.json({
          status: 'pending',
          confirmationUrl: pendingCharge.confirmation_url
        });
      }

      console.log('💰 [BILLING CREATE] No active or pending charges found');
    } else {
      const errorText = await existingChargesResponse.text();
      console.log('❌ [BILLING CREATE] Failed to get existing charges:', errorText);
    }

    // Create new charge - return URL goes to Shopify admin app page
    const shopName = shop.replace('.myshopify.com', '');
    const apiKey = process.env.SHOPIFY_API_KEY || process.env.SHOPIFY_CLIENT_ID_PRODUCTION || '08fa8bc27e0e3ac857912c7e7ee289d0';
    const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
    console.log('💰 [BILLING CREATE] Creating new charge with return URL:', returnUrl);

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

    console.log('💰 [BILLING CREATE] Charge creation response:', chargeResponse.status);

    if (!chargeResponse.ok) {
      const errorData = await chargeResponse.json().catch(() => null);
      console.error('❌ [BILLING CREATE] Failed to create charge:', chargeResponse.status, errorData);
      return NextResponse.json({ error: 'Failed to create billing charge', details: errorData }, { status: 500 });
    }

    const chargeData = await chargeResponse.json();
    const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;
    console.log('✅ [BILLING CREATE] Charge created, confirmation URL:', confirmationUrl);

    return NextResponse.json({
      status: 'created',
      confirmationUrl
    });

  } catch (error) {
    console.error('❌ [BILLING CREATE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
