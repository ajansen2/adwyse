import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API endpoint to auto-create merchant and store for embedded Shopify apps
// This is called when a Shopify app is installed but records don't exist yet
export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json();

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

    // Extract shop name from URL for email
    const shopName = shop.replace('.myshopify.com', '');
    const email = `${shopName}@shopify-placeholder.com`;

    // Create merchant record
    const { data: merchantData, error: merchantError } = await supabase
      .from('merchants')
      .insert({
        email: email,
        full_name: shopName,
        company: shopName,
        subscription_tier: 'trial', // Start with trial
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (merchantError) {
      console.error('Error creating merchant:', merchantError);
      return NextResponse.json({ error: 'Failed to create merchant', details: merchantError }, { status: 500 });
    }

    console.log('✅ Created merchant:', merchantData.id);

    // Create store record
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        merchant_id: merchantData.id,
        store_name: shopName,
        store_url: `https://${shop}`,
        platform: 'shopify',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      return NextResponse.json({ error: 'Failed to create store', details: storeError }, { status: 500 });
    }

    console.log('✅ Created store:', storeData.id);

    return NextResponse.json({
      merchant: merchantData,
      store: storeData
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
