import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Handle first-time app installation for embedded apps
 * Called when dashboard loads and store not found in database
 * Uses session token from Shopify to create merchant/store records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, sessionToken } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔧 Installing embedded app for shop:', shop);

    // TODO: Verify session token with Shopify
    // For now, we'll create records based on shop parameter
    // In production, you should verify the session token

    // Check if store already exists (lookup by store_url)
    const storeUrl = `https://${shop}`;
    const { data: existingStore } = await supabase
      .from('stores')
      .select('*, merchants(*)')
      .eq('store_url', storeUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingStore) {
      // If store is disconnected, reactivate it and clear old data for fresh start
      if (existingStore.status === 'disconnected') {
        console.log('🔄 Reactivating disconnected store:', existingStore.id);

        // Delete old abandoned carts for fresh start
        await supabase
          .from('abandoned_carts')
          .delete()
          .eq('store_id', existingStore.id);

        // Reactivate store
        const { data: reactivatedStore } = await supabase
          .from('stores')
          .update({
            status: 'active',
            connected_at: new Date().toISOString(),
          })
          .eq('id', existingStore.id)
          .select('*, merchants(*)')
          .single();

        console.log('✅ Store reactivated with fresh data:', existingStore.id);

        return NextResponse.json({
          merchant: reactivatedStore.merchants,
          store: reactivatedStore
        });
      }

      // Store is active, return it as-is
      console.log('✅ Store already exists:', existingStore.id);

      return NextResponse.json({
        merchant: existingStore.merchants,
        store: existingStore
      });
    }

    // Check if auth user already exists, or create new one
    const merchantEmail = `${shop.replace('.myshopify.com', '')}@shopify.com`;

    // Try to get existing user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === merchantEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Found existing auth user:', userId);
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: merchantEmail,
        email_confirm: true,
        user_metadata: {
          shop: shop,
          store_name: shop.replace('.myshopify.com', ''),
        }
      });

      if (authError) {
        console.error('❌ Failed to create auth user:', authError);
        console.error('❌ Auth error details:', JSON.stringify(authError, null, 2));
        return NextResponse.json({
          error: 'Failed to create user account',
          details: authError.message || authError
        }, { status: 500 });
      }

      userId = authData.user.id;
      console.log('✅ Created new auth user:', userId);
    }

    // Check if merchant already exists for this user
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .single();

    let merchantData;

    if (existingMerchant) {
      merchantData = existingMerchant;
      console.log('✅ Found existing merchant:', merchantData.id);
    } else {
      // Create new merchant
      const { data: newMerchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          user_id: userId,
          email: merchantEmail,
          full_name: shop.replace('.myshopify.com', ''),
          company: shop.replace('.myshopify.com', ''),
          subscription_tier: 'trial',
          settings: {
            emails_enabled: true,
            first_email_delay: 1,
            second_email_delay: 24,
            third_email_delay: 48,
          }
        })
        .select()
        .single();

      if (merchantError) {
        console.error('❌ Failed to create merchant:', merchantError);
        console.error('❌ Merchant error details:', JSON.stringify(merchantError, null, 2));
        return NextResponse.json({
          error: 'Failed to create merchant',
          details: merchantError.message || merchantError
        }, { status: 500 });
      }

      merchantData = newMerchant;
      console.log('✅ Created new merchant:', merchantData.id);
    }

    // Create store (only if doesn't exist - we checked at the beginning)
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        merchant_id: merchantData.id,
        platform: 'shopify',
        store_name: shop.replace('.myshopify.com', ''),
        store_url: storeUrl,
        status: 'active',
        connected_at: new Date().toISOString(),
        // access_token will be set later when we get proper OAuth access
      })
      .select()
      .single();

    if (storeError) {
      console.error('❌ Failed to create store:', storeError);
      console.error('❌ Store error details:', JSON.stringify(storeError, null, 2));
      return NextResponse.json({
        error: 'Failed to create store',
        details: storeError.message || storeError
      }, { status: 500 });
    }

    console.log('✅ Created new store:', newStore.id);

    return NextResponse.json({
      merchant: merchantData,
      store: newStore,
      created: true
    });

  } catch (error) {
    console.error('❌ Install embedded error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
