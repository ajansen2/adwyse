import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Customer event webhooks for Built for Shopify requirements
 * Handles: customers/create, customers/update, customers/delete
 *
 * Required for: "30 subscribed customer events" criteria
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('Customer webhook received:', { topic, shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Log the event for debugging but no DB write needed
    switch (topic) {
      case 'customers/create':
        console.log('New customer created');
        break;
      case 'customers/update':
        console.log('Customer updated');
        break;
      case 'customers/delete':
        console.log('Customer deleted');
        break;
      default:
        console.log('Unknown customer topic:', topic);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Customer webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify Shopify webhook signature
function verifyWebhook(data: string, hmac: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET,
    process.env.SHOPIFY_API_SECRET_PRODUCTION,
    process.env.SHOPIFY_API_SECRET_DEV,
  ].filter(Boolean);

  if (secrets.length === 0) {
    console.error('No Shopify API secrets configured');
    return false;
  }

  for (const secret of secrets) {
    const hash = crypto
      .createHmac('sha256', secret!)
      .update(data, 'utf8')
      .digest('base64');

    if (hash === hmac) {
      return true;
    }
  }

  return false;
}
