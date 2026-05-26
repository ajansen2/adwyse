import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { accountId, storeId } = await request.json();

    if (!accountId || !storeId) {
      return NextResponse.json({ error: 'Account ID and Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Delete the ad account (only if it belongs to this store)
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', accountId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Failed to disconnect ad account:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
