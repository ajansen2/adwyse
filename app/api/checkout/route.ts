// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { email, priceId, subdomain, fullName } = await request.json();

    console.log('Checkout request:', { email, priceId, subdomain, fullName });

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if STRIPE_PRICE_ID is set
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;
    if (!finalPriceId) {
      console.error('STRIPE_PRICE_ID not configured');
      return NextResponse.json(
        { error: 'Stripe price ID not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('Using price ID:', finalPriceId);

    // Create or retrieve customer
    let customer: Stripe.Customer;

    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name: fullName,
        metadata: {
          platform: 'argora-deals',
          subdomain: subdomain || 'default',
        },
      });
    }

    // Create checkout session with ONLY $5,000 one-time payment
    // After 30 days, we'll email customer about optional $1,000/month subscription
    console.log('Creating checkout session for customer:', customer.id);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId, // This should be the $5,000 one-time price
          quantity: 1,
        },
      ],
      mode: 'payment', // Payment mode for one-time charges (not subscription)
      metadata: {
        platform: 'argora-deals',
        subdomain: subdomain || 'default',
        email: email,
      },
      success_url: `https://argora.ai/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://argora.ai/onboarding?cancelled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error && typeof error === 'object' && 'type' in error ? String(error.type) : 'unknown';

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        type: errorType
      },
      { status: 500 }
    );
  }
}
