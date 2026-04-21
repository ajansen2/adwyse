import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface Competitor {
  id: string;
  competitor_name: string;
  facebook_page_url: string | null;
  website_url: string | null;
  industry: string | null;
  notes: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

// Demo competitors for Adam's store
function getDemoCompetitors(): Competitor[] {
  return [
    {
      id: 'demo_comp_1',
      competitor_name: 'Gymshark',
      facebook_page_url: 'https://www.facebook.com/Gymshark',
      website_url: 'https://www.gymshark.com',
      industry: 'Fitness Apparel',
      notes: 'Strong influencer marketing, frequent sales campaigns',
      is_active: true,
      last_checked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo_comp_2',
      competitor_name: 'Lululemon',
      facebook_page_url: 'https://www.facebook.com/lululemon',
      website_url: 'https://www.lululemon.com',
      industry: 'Athletic Wear',
      notes: 'Premium positioning, lifestyle-focused creatives',
      is_active: true,
      last_checked_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo_comp_3',
      competitor_name: 'Fabletics',
      facebook_page_url: 'https://www.facebook.com/Fabletics',
      website_url: 'https://www.fabletics.com',
      industry: 'Activewear Subscription',
      notes: 'Heavy VIP membership push, celebrity partnerships',
      is_active: true,
      last_checked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo_comp_4',
      competitor_name: 'Alo Yoga',
      facebook_page_url: 'https://www.facebook.com/aloyoga',
      website_url: 'https://www.aloyoga.com',
      industry: 'Yoga & Lifestyle',
      notes: 'Instagram-first strategy, aspirational content',
      is_active: true,
      last_checked_at: null,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Return demo data for Adam's store
    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json({
        competitors: getDemoCompetitors(),
        total: 4,
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: competitors, error } = await supabase
      .from('competitor_tracking')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
    }

    return NextResponse.json({
      competitors: competitors || [],
      total: competitors?.length || 0,
    });
  } catch (error) {
    console.error('Error in competitors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { store_id, competitor_name, facebook_page_url, website_url, industry, notes } = body;

    if (!store_id || !competitor_name) {
      return NextResponse.json(
        { error: 'Store ID and competitor name required' },
        { status: 400 }
      );
    }

    // Demo store - return mock success
    if (store_id === DEMO_STORE_ID) {
      return NextResponse.json({
        id: `demo_comp_${Date.now()}`,
        competitor_name,
        facebook_page_url,
        website_url,
        industry,
        notes,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
      .from('competitor_tracking')
      .insert({
        store_id,
        competitor_name,
        facebook_page_url: facebook_page_url || null,
        website_url: website_url || null,
        industry: industry || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Competitor already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating competitor:', error);
      return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in competitors POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const competitorId = request.nextUrl.searchParams.get('id');
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!competitorId || !storeId) {
      return NextResponse.json(
        { error: 'Competitor ID and Store ID required' },
        { status: 400 }
      );
    }

    // Demo store - return mock success
    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json({ success: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from('competitor_tracking')
      .update({ is_active: false })
      .eq('id', competitorId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error deleting competitor:', error);
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in competitors DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
