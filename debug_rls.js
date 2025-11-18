const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env vars
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

async function debugRLS() {
  console.log('🔍 Debugging RLS issue...\n');

  // Get the merchant record
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('*')
    .eq('email', 'adamjansen639@yahoo.ca')
    .single();

  if (merchantError || !merchant) {
    console.error('❌ Merchant not found:', merchantError);
    return;
  }

  console.log('Merchant user_id:', merchant.user_id);
  console.log('Merchant email:', merchant.email);

  // Get the auth user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error listing users:', usersError);
    return;
  }

  const user = users.find(u => u.email === 'adamjansen639@yahoo.ca');
  if (!user) {
    console.error('❌ Auth user not found');
    return;
  }

  console.log('\nAuth user.id:', user.id);

  if (merchant.user_id === user.id) {
    console.log('\n✅ IDs MATCH! RLS should work.');
    console.log('\n💡 The problem might be that the user is not authenticated in the browser.');
    console.log('💡 Try logging out and logging back in.');
  } else {
    console.log('\n❌ IDS DO NOT MATCH!');
    console.log('💡 Merchant user_id:', merchant.user_id);
    console.log('💡 Auth user.id:', user.id);
    console.log('\n💡 Fixing: updating merchant user_id to match auth user...');

    const { error: updateError } = await supabase
      .from('merchants')
      .update({ user_id: user.id })
      .eq('id', merchant.id);

    if (updateError) {
      console.error('❌ Error updating:', updateError);
    } else {
      console.log('✅ Fixed! Merchant user_id updated to', user.id);
    }
  }
}

debugRLS();
