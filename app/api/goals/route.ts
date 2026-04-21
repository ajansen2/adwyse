import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

interface Goal {
  id: string;
  store_id: string;
  goal_type: string;
  target_value: number;
  period: string;
  is_active: boolean;
}

/**
 * Get all goals for a store
 */
export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: goals, error } = await supabase
      .from('store_goals')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('goal_type');

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error('Error in goals GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Create or update a goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, goalType, targetValue, period = 'monthly' } = body;

    if (!storeId || !goalType || targetValue === undefined) {
      return NextResponse.json(
        { error: 'Store ID, goal type, and target value are required' },
        { status: 400 }
      );
    }

    const validGoalTypes = ['revenue', 'orders', 'roas', 'spend_limit', 'aov'];
    if (!validGoalTypes.includes(goalType)) {
      return NextResponse.json(
        { error: `Invalid goal type. Must be one of: ${validGoalTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert the goal
    const { data: goal, error } = await supabase
      .from('store_goals')
      .upsert({
        store_id: storeId,
        goal_type: goalType,
        target_value: targetValue,
        period,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,goal_type,period'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving goal:', error);
      return NextResponse.json({ error: 'Failed to save goal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      goal,
      message: `${goalType} goal set to ${targetValue} per ${period}`,
    });
  } catch (error) {
    console.error('Error in goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Delete a goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    const goalType = request.nextUrl.searchParams.get('goal_type');
    const period = request.nextUrl.searchParams.get('period') || 'monthly';

    if (!storeId || !goalType) {
      return NextResponse.json(
        { error: 'Store ID and goal type are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('store_goals')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('store_id', storeId)
      .eq('goal_type', goalType)
      .eq('period', period);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${goalType} goal removed`,
    });
  } catch (error) {
    console.error('Error in goals DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
