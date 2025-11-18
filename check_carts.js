import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCarts() {
  const { data, error } = await supabase
    .from('abandoned_carts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} abandoned carts`);
  if (data && data.length > 0) {
    console.log('Latest cart:', {
      id: data[0].id,
      email: data[0].customer_email,
      value: data[0].cart_value,
      created: data[0].created_at
    });
  } else {
    console.log('NO ABANDONED CARTS FOUND - This is why test email fails!');
  }
}

checkCarts();
