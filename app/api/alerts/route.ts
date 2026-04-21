import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch alerts for this store
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alerts:', error);
      // Return empty array instead of error to prevent client crashes
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }

    return NextResponse.json({ alerts: alerts || [] }, { status: 200 });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ alerts: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json({ error: 'Missing alertIds' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Mark alerts as read
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .in('id', alertIds);

    if (error) {
      console.error('Error updating alerts:', error);
      return NextResponse.json({ error: 'Failed to update alerts' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Alerts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
