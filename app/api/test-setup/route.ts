import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Test endpoint to create a fresh abandoned cart for testing email automation
 * This creates a cart with current timestamp so email sequence starts immediately
 */
export async function GET() {
  try {
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

    // Get the first active store (for testing)
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, merchant_id')
      .limit(1)
      .single();

    if (storesError || !stores) {
      return NextResponse.json(
        { error: 'No stores found', details: storesError?.message },
        { status: 404 }
      );
    }

    // Create a test cart with current timestamp
    const testCart = {
      store_id: stores.id,
      customer_email: 'adam.user@gmail.com',
      customer_name: 'Adam User',
      cart_data: {
        items: [
          {
            id: 'test-item-' + Date.now(),
            title: 'Test Product - The Compass at Price Snowboard',
            quantity: 1,
            price: 785.95,
            variant_id: 'variant-123',
            variant_title: 'Default',
            product_id: 'product-456',
            image: null
          }
        ],
        total_price: 785.95,
        currency: 'USD'
      },
      abandoned_at: new Date().toISOString(),
      status: 'abandoned',
      emails_sent: 0,
      first_email_sent_at: null,
      second_email_sent_at: null,
      third_email_sent_at: null
    };

    const { data: cart, error: cartError } = await supabase
      .from('abandoned_carts')
      .insert(testCart)
      .select()
      .single();

    if (cartError) {
      console.error('Failed to create test cart:', cartError);
      return NextResponse.json(
        { error: 'Failed to create test cart', details: cartError.message },
        { status: 500 }
      );
    }

    console.log('✅ Test cart created:', cart.id);

    return NextResponse.json({
      success: true,
      message: 'Fresh test cart created successfully',
      cart: {
        id: cart.id,
        email: cart.customer_email,
        abandonedAt: cart.abandoned_at,
        totalPrice: testCart.cart_data.total_price
      },
      nextSteps: [
        'The automated cron job will pick up this cart',
        'Email 1: Will send in ~3 minutes (0.05h)',
        'Email 2: Will send in ~6 minutes (0.10h)',
        'Email 3: Will send in ~9 minutes (0.15h)',
        '',
        'Cron runs every 5 minutes, so expect slight delays'
      ]
    });

  } catch (error) {
    console.error('❌ Test setup error:', error);
    return NextResponse.json(
      {
        error: 'Test setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
