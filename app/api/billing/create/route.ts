import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { storeId, shop } = await request.json();

    if (!storeId || !shop) {
      return NextResponse.json({ error: 'Missing storeId or shop' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get store with access token
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const accessToken = store.access_token;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
    const isTestCharge = shop.includes('-test') || shop.includes('development');

    // Check for existing pending or active charges
    const existingChargesResponse = await fetch(
      `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
      {
        headers: { 'X-Shopify-Access-Token': accessToken },
      }
    );

    if (existingChargesResponse.ok) {
      const existingCharges = await existingChargesResponse.json();

      // If already has active subscription, return success
      const activeCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'active'
      );
      if (activeCharge) {
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
        return NextResponse.json({
          status: 'pending',
          confirmationUrl: pendingCharge.confirmation_url
        });
      }
    }

    // Create new charge
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${storeId}`;

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
      const errorData = await chargeResponse.json().catch(() => null);
      console.error('Failed to create billing charge:', errorData);
      return NextResponse.json({ error: 'Failed to create billing charge' }, { status: 500 });
    }

    const chargeData = await chargeResponse.json();
    const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;

    return NextResponse.json({
      status: 'created',
      confirmationUrl
    });

  } catch (error) {
    console.error('Billing create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
