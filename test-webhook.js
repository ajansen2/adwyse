const crypto = require('crypto');

// Test webhook payload (simulating a Shopify abandoned checkout)
const webhookPayload = {
  id: 123456789,
  email: 'test@example.com',
  customer: {
    first_name: 'Test',
    last_name: 'User'
  },
  total_price: '1229.95',
  line_items: [
    {
      product_id: 1,
      variant_id: 1,
      title: 'The Collection Snowboard: Hydrogen',
      quantity: 1,
      price: '600.00'
    },
    {
      product_id: 2,
      variant_id: 2,
      title: 'The Multi-managed Snowboard',
      quantity: 1,
      price: '629.95'
    }
  ],
  abandoned_checkout_url: 'https://argora-test.myshopify.com/checkout/abandon',
  updated_at: new Date().toISOString(),
  completed_at: null
};

const rawBody = JSON.stringify(webhookPayload);

// Generate HMAC signature
const secret = 'd177d2c14396945711f74b1caa530a08';
const hmac = crypto
  .createHmac('sha256', secret)
  .update(rawBody, 'utf8')
  .digest('base64');

console.log('🚀 Sending test webhook...\n');
console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
console.log('\nHMAC:', hmac);

// Send the webhook
fetch('http://localhost:3000/api/webhooks/shopify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Hmac-Sha256': hmac,
    'X-Shopify-Topic': 'checkouts/create',
    'X-Shopify-Shop-Domain': 'argora-test.myshopify.com'
  },
  body: rawBody
})
  .then(res => res.json())
  .then(data => {
    console.log('\n✅ Response:', data);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
  });
