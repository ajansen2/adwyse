import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the store ID from the request
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Get store from database
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

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Extract shop domain from store URL
    const shop = store.store_url.replace('https://', '');
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`;

    console.log('🔧 Registering webhooks for', shop);
    console.log('📍 Webhook URL:', webhookUrl);

    // Register checkouts/create webhook
    const createWebhook = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'checkouts/create',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const createResult = await createWebhook.json();
    console.log('✅ checkouts/create result:', createResult);

    // Register checkouts/update webhook
    const updateWebhook = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'checkouts/update',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const updateResult = await updateWebhook.json();
    console.log('✅ checkouts/update result:', updateResult);

    return NextResponse.json({
      success: true,
      webhooks: {
        create: createResult,
        update: updateResult,
      },
    });
  } catch (error) {
    console.error('❌ Webhook registration error:', error);
    return NextResponse.json({ error: 'Failed to register webhooks' }, { status: 500 });
  }
}
