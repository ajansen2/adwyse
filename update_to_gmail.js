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

async function updateToGmail() {
  const cartId = 'f7796b06-88f3-4711-bf45-5a255c2f396d';
  const newEmail = 'adamjansen639@gmail.com';

  console.log('📧 Updating cart email to your Gmail...');

  const { data: updated, error } = await supabase
    .from('abandoned_carts')
    .update({
      customer_email: newEmail,
      customer_name: 'Adam Jansen',
      customer_first_name: 'Adam'
    })
    .eq('id', cartId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Cart updated successfully!');
    console.log('New email:', updated.customer_email);
    console.log('New name:', updated.customer_name);
    console.log('\nNow when you click "Send Test Email", it will go to:', newEmail);
  }
}

updateToGmail();
