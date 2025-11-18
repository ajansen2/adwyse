// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    const supabase = getSupabase();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, stripe, supabase);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Handler: Checkout completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: ReturnType<typeof getSupabase>) {
  console.log('💳 Checkout completed:', session.id);

  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const paymentMode = session.mode; // 'payment' or 'subscription'

  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  console.log(`Payment mode: ${paymentMode}, Amount: ${session.amount_total}`);

  // Update user profile in Supabase
  const { data: profile, error: fetchError} = await supabase
    .from('profiles')
    .select('*')
    .eq('email', customerEmail)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching profile:', fetchError);
    return;
  }

  if (profile) {
    // Update existing profile
    const updateData: Record<string, string | boolean> = {
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    };

    // Only set subscription fields if this was a subscription payment
    if (subscriptionId) {
      updateData.stripe_subscription_id = subscriptionId;
      updateData.subscription_status = 'active';
    } else {
      // One-time payment (setup fee)
      updateData.setup_fee_paid = true;
      updateData.setup_fee_paid_at = new Date().toISOString();
      // Set subscription_status to 'trial' or 'pending' until they opt-in after 30 days
      updateData.subscription_status = 'trial';
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log('✅ Profile updated with payment info');
    }
  }

  // Send welcome email with login credentials for one-time payment
  // or send payment success email for subscription renewal
  try {
    const emailEndpoint = subscriptionId
      ? '/api/emails/payment-success'  // Subscription renewal
      : '/api/emails/welcome';          // One-time setup fee (send login credentials)

    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${emailEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        subscriptionId,
        sessionId: session.id,
        amountPaid: session.amount_total || 5000,
        dashboardUrl: 'https://deals.argora.ai/dashboard',
      }),
    });
    console.log(`✅ Email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Handler: Subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription, stripe: ReturnType<typeof getStripe>, supabase: ReturnType<typeof getSupabase>) {
  console.log('🆕 Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);

  if ('deleted' in customer && customer.deleted) {
    console.error('Customer was deleted');
    return;
  }

  const customerEmail = customer.email;

  if (!customerEmail) {
    console.error('No customer email found');
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', customerEmail);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('✅ Subscription created in database');
  }
}

// Handler: Subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: ReturnType<typeof getSupabase>) {
  console.log('🔄 Subscription updated:', subscription.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated in database');
  }
}

// Handler: Subscription deleted/cancelled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: ReturnType<typeof getSupabase>) {
  console.log('🚫 Subscription cancelled:', subscription.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  } else {
    console.log('✅ Subscription cancelled in database');
  }

  // Send cancellation email (optional)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (profile?.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/emails/subscription-cancelled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  }
}

// Handler: Payment succeeded
async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: ReturnType<typeof getSupabase>) {
  console.log('💰 Payment succeeded:', invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      last_payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating payment status:', error);
  } else {
    console.log('✅ Payment recorded in database');
  }
}

// Handler: Payment failed
async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: ReturnType<typeof getSupabase>) {
  console.log('❌ Payment failed:', invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating payment failure:', error);
  } else {
    console.log('⚠️ Payment failure recorded');
  }

  // Get customer email and send payment failure notification
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (profile?.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/emails/payment-failed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          invoiceUrl: invoice.hosted_invoice_url,
        }),
      });
    } catch (error) {
      console.error('Error sending payment failure email:', error);
    }
  }
}
