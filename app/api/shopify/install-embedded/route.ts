import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Handle first-time app installation for embedded apps
 * Called when dashboard loads and store not found in database
 * This is a fallback - the OAuth callback should have already created the store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔧 Install-embedded called for shop:', shop);

    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // AdWyse schema: Check if store already exists by shop_domain
    const { data: existingStore, error: lookupError } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error('❌ Error looking up store:', lookupError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingStore) {
      console.log('✅ Store already exists:', existingStore.id);

      // Map store data to merchant format (AdWyse: store IS the merchant)
      let subscriptionTier = 'trial';
      if (existingStore.subscription_status === 'active') {
        subscriptionTier = 'pro';
      }

      const merchantData = {
        id: existingStore.id,
        email: existingStore.email || '',
        full_name: existingStore.store_name || '',
        company: existingStore.store_name || '',
        subscription_tier: subscriptionTier
      };

      return NextResponse.json({
        merchant: merchantData,
        store: {
          id: existingStore.id,
          store_name: existingStore.store_name || shop.replace('.myshopify.com', ''),
          shop_domain: shop,
          email: existingStore.email || '',
          subscription_status: existingStore.subscription_status || 'trial',
          trial_ends_at: existingStore.trial_ends_at || null,
          store_url: `https://${shop}`,
          shopify_domain: shop,
          status: 'active'
        }
      });
    }

    // Store doesn't exist - this shouldn't happen if OAuth completed properly
    // But we'll create it as a fallback (without access token - they'll need to reinstall)
    console.log('⚠️ Store not found, creating placeholder for:', shop);

    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert({
        shop_domain: shop,
        store_name: shop.replace('.myshopify.com', ''),
        email: '',
        access_token: '', // Empty - will need proper OAuth
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create store:', createError);
      return NextResponse.json({
        error: 'Failed to create store record',
        details: createError.message
      }, { status: 500 });
    }

    console.log('✅ Created placeholder store:', newStore.id);

    const merchantData = {
      id: newStore.id,
      email: '',
      full_name: shop.replace('.myshopify.com', ''),
      company: shop.replace('.myshopify.com', ''),
      subscription_tier: 'trial'
    };

    return NextResponse.json({
      merchant: merchantData,
      store: {
        id: newStore.id,
        store_name: newStore.store_name,
        shop_domain: shop,
        email: '',
        subscription_status: 'trial',
        trial_ends_at: newStore.trial_ends_at,
        store_url: `https://${shop}`,
        shopify_domain: shop,
        status: 'active'
      },
      created: true
    });

  } catch (error) {
    console.error('❌ Install embedded error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
