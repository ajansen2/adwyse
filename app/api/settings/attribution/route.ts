import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('store_settings')
      .select('attribution_model')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading attribution model:', error);
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }

    return NextResponse.json({
      attribution_model: data?.attribution_model || 'last_click'
    });
  } catch (error) {
    console.error('Error loading attribution model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, attribution_model } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Missing storeId' }, { status: 400 });
    }

    const validModels = ['last_click', 'first_click', 'linear', 'time_decay', 'position_based'];
    if (!validModels.includes(attribution_model)) {
      return NextResponse.json({ error: 'Invalid attribution model' }, { status: 400 });
    }

    // Upsert the settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        store_id: storeId,
        attribution_model,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_id'
      });

    if (error) {
      console.error('Error saving attribution model:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving attribution model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
