import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if we have received any pixel events from this store in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: events, error } = await supabase
      .from('pixel_events')
      .select('id')
      .eq('store_id', storeId)
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking pixel events:', error);
      // Don't fail - just report as not verified
      return NextResponse.json({ verified: false });
    }

    const verified = events && events.length > 0;

    return NextResponse.json({ verified });
  } catch (error) {
    console.error('Error verifying pixel:', error);
    return NextResponse.json({ verified: false });
  }
}
