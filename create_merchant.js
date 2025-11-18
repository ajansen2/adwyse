const { createClient } = require('@supabase/supabase-js');

// Load env vars from .env.local
const fs = require('fs');
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

async function createMerchant() {
  // Get current user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !users || users.length === 0) {
    console.error('No users found');
    return;
  }

  const user = users[0]; // Get first user
  console.log('Found user:', user.email);

  // Check if merchant exists
  const { data: existing } = await supabase
    .from('merchants')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    console.log('Merchant already exists!');
    return;
  }

  // Create merchant record
  const { data, error } = await supabase
    .from('merchants')
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'Test User',
      company: user.user_metadata?.company || 'Test Company',
      subscription_tier: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating merchant:', error);
  } else {
    console.log('✅ Merchant created successfully!', data);
  }
}

createMerchant();
