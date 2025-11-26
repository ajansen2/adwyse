import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}

// GDPR: Customer Data Request
// Shopify sends this when a customer requests their data
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';

    // Verify HMAC signature
    if (SHOPIFY_API_SECRET && hmacHeader) {
      const isValid = verifyShopifyWebhook(body, hmacHeader);
      if (!isValid) {
        console.error('Invalid webhook signature for customers/data_request');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log('Customer data request webhook received:', {
      shop_domain: data.shop_domain,
      customer_id: data.customer?.id,
      customer_email: data.customer?.email,
    });

    // For AdWyse, we store minimal customer data (only order info with emails)
    // In a real implementation, you would:
    // 1. Query your database for all data related to this customer
    // 2. Compile it into a format that can be sent to the customer
    // 3. Send it to the merchant or customer as requested

    // Since we only store order attribution data, we acknowledge the request
    // The merchant can export order data from our dashboard if needed

    return NextResponse.json({
      success: true,
      message: 'Customer data request acknowledged'
    });
  } catch (error) {
    console.error('Error processing customer data request webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
