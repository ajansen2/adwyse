const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env vars from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function updateCartEmail() {
  console.log('🔍 Finding Test User cart...');

  // Find the test cart
  const { data: cart, error: findError } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('customer_name', 'Test User')
    .single();

  if (findError || !cart) {
    console.error('❌ Cart not found:', findError);
    return;
  }

  console.log('Found cart:', cart.id);
  console.log('Current email:', cart.customer_email);

  // Update to your Gmail
  const newEmail = 'adamjansen639@gmail.com';

  const { data: updated, error: updateError } = await supabase
    .from('abandoned_carts')
    .update({
      customer_email: newEmail,
      customer_name: 'Adam Jansen' // Update name too
    })
    .eq('id', cart.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating cart:', updateError);
  } else {
    console.log('✅ Cart updated successfully!');
    console.log('New email:', updated.customer_email);
    console.log('New name:', updated.customer_name);
  }
}

updateCartEmail();
