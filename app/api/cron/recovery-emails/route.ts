import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job - Runs every hour to check for abandoned carts needing recovery emails
 *
 * NOTE: Requires Vercel Pro plan ($20/month) for hourly cron jobs.
 *
 * Email Sequence (customizable per merchant):
 * - Email 1: X hours after abandonment (default: 1 hour)
 * - Email 2: Y hours after Email 1 (default: 24 hours)
 * - Email 3: Z hours after Email 2 (default: 48 hours)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a valid cron request (from Vercel or external cron service)
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');

    if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting cart recovery email cron job...');

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

    // Get all merchants with email recovery enabled
    const { data: merchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('id, settings')
      .not('settings', 'is', null);

    if (merchantsError) {
      console.error('Failed to fetch merchants:', merchantsError);
      return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
    }

    // Filter merchants with emails enabled
    const enabledMerchants = merchants?.filter(
      m => m.settings?.emails_enabled === true
    ) || [];

    console.log(`📊 Found ${enabledMerchants.length} merchants with email recovery enabled`);

    let totalEmailsSent = 0;
    let totalCartsProcessed = 0;
    const errors: Array<{ cartId: string; error: string }> = [];

    // Process each merchant
    for (const merchant of enabledMerchants) {
      const settings = merchant.settings || {};
      const firstEmailDelay = settings.first_email_delay || 1; // hours
      const secondEmailDelay = settings.second_email_delay || 24; // hours
      const thirdEmailDelay = settings.third_email_delay || 48; // hours

      // Get stores for this merchant
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', merchant.id);

      if (!stores || stores.length === 0) continue;

      const storeIds = stores.map(s => s.id);

      // Get abandoned carts for these stores
      const { data: carts } = await supabase
        .from('abandoned_carts')
        .select('*')
        .in('store_id', storeIds)
        .in('status', ['abandoned', 'recovering']) // Only active carts
        .lt('emails_sent', 3); // Max 3 emails

      if (!carts || carts.length === 0) continue;

      console.log(`📦 Processing ${carts.length} carts for merchant ${merchant.id}`);

      const now = new Date();

      for (const cart of carts) {
        totalCartsProcessed++;

        const emailsSent = cart.emails_sent || 0;
        let shouldSendEmail = false;
        let emailNumber: 0 | 1 | 2 | 3 = 0;

        // Determine which email to send based on timing
        if (emailsSent === 0 && cart.abandoned_at) {
          // Check if it's time for Email 1
          const abandonedAt = new Date(cart.abandoned_at);
          const hoursSinceAbandoned = (now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceAbandoned >= firstEmailDelay) {
            shouldSendEmail = true;
            emailNumber = 1;
          }
        } else if (emailsSent === 1 && cart.first_email_sent_at) {
          // Check if it's time for Email 2
          const firstEmailAt = new Date(cart.first_email_sent_at);
          const hoursSinceFirst = (now.getTime() - firstEmailAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceFirst >= secondEmailDelay) {
            shouldSendEmail = true;
            emailNumber = 2;
          }
        } else if (emailsSent === 2 && cart.second_email_sent_at) {
          // Check if it's time for Email 3
          const secondEmailAt = new Date(cart.second_email_sent_at);
          const hoursSinceSecond = (now.getTime() - secondEmailAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceSecond >= thirdEmailDelay) {
            shouldSendEmail = true;
            emailNumber = 3;
          }
        }

        if (shouldSendEmail && (emailNumber === 1 || emailNumber === 2 || emailNumber === 3)) {
          console.log(`📧 Sending email ${emailNumber} for cart ${cart.id}`);

          try {
            // Call the existing send-email API
            await sendRecoveryEmail(cart.id, emailNumber);
            totalEmailsSent++;
            console.log(`✅ Email ${emailNumber} sent successfully for cart ${cart.id}`);
          } catch (error) {
            console.error(`Failed to send email ${emailNumber} for cart ${cart.id}:`, error);
            errors.push({
              cartId: cart.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }

          // Add a small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log('✅ Cron job completed');
    console.log(`📊 Stats: ${totalEmailsSent} emails sent, ${totalCartsProcessed} carts processed`);

    return NextResponse.json({
      success: true,
      emailsSent: totalEmailsSent,
      cartsProcessed: totalCartsProcessed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cart recovery cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to send recovery email
async function sendRecoveryEmail(cartId: string, emailNumber: 1 | 2 | 3) {
  // Call the email service API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://argora.ai';
  const response = await fetch(
    `${baseUrl}/api/recovery/send-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartId,
        emailNumber,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to send email ${emailNumber} for cart ${cartId}`);
  }

  return response.json();
}
