import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface GoalProgress {
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percent: number;
  period: string;
  period_start: string;
  period_end: string;
  on_track: boolean;
  projected_value: number;
}

/**
 * Get goal progress for a store
 */
export async function GET(request: NextRequest) {
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

    // Get active goals
    const { data: goals } = await supabase
      .from('store_goals')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (!goals || goals.length === 0) {
      return NextResponse.json({ progress: [] });
    }

    // Calculate period dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getPeriodDates = (period: string) => {
      const periodStart = new Date(today);
      const periodEnd = new Date(today);

      switch (period) {
        case 'daily':
          // Today
          return { start: periodStart, end: periodEnd, totalDays: 1, daysPassed: 1 };
        case 'weekly':
          // Start of week (Sunday)
          periodStart.setDate(today.getDate() - today.getDay());
          periodEnd.setDate(periodStart.getDate() + 6);
          return {
            start: periodStart,
            end: periodEnd,
            totalDays: 7,
            daysPassed: today.getDay() + 1
          };
        case 'monthly':
          // Start of month
          periodStart.setDate(1);
          periodEnd.setMonth(periodEnd.getMonth() + 1, 0); // Last day of month
          return {
            start: periodStart,
            end: periodEnd,
            totalDays: periodEnd.getDate(),
            daysPassed: today.getDate()
          };
        case 'quarterly':
          // Start of quarter
          const quarter = Math.floor(today.getMonth() / 3);
          periodStart.setMonth(quarter * 3, 1);
          periodEnd.setMonth(quarter * 3 + 3, 0);
          const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const daysPassed = Math.ceil((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return { start: periodStart, end: periodEnd, totalDays, daysPassed };
        default:
          return { start: periodStart, end: periodEnd, totalDays: 30, daysPassed: today.getDate() };
      }
    };

    // Get orders for the current period
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: orders } = await supabase
      .from('adwyse_orders')
      .select('total_price, order_created_at, attributed_platform')
      .eq('store_id', storeId)
      .gte('order_created_at', startOfMonth.toISOString());

    // Get campaigns for spend data
    const { data: campaigns } = await supabase
      .from('adwyse_campaigns')
      .select('ad_spend, revenue')
      .eq('store_id', storeId);

    // Calculate totals
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalSpend = campaigns?.reduce((sum, c) => sum + (c.ad_spend || 0), 0) || 0;
    const attributedRevenue = orders
      ?.filter(o => o.attributed_platform && o.attributed_platform !== 'direct')
      .reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const roas = totalSpend > 0 ? attributedRevenue / totalSpend : 0;

    // Calculate progress for each goal
    const progress: GoalProgress[] = goals.map(goal => {
      const periodDates = getPeriodDates(goal.period);
      let currentValue = 0;

      switch (goal.goal_type) {
        case 'revenue':
          currentValue = totalRevenue;
          break;
        case 'orders':
          currentValue = totalOrders;
          break;
        case 'roas':
          currentValue = roas;
          break;
        case 'spend_limit':
          currentValue = totalSpend;
          break;
        case 'aov':
          currentValue = avgOrderValue;
          break;
      }

      const progressPercent = goal.target_value > 0
        ? Math.min((currentValue / goal.target_value) * 100, 200) // Cap at 200%
        : 0;

      // Project end-of-period value based on current run rate
      const runRate = periodDates.daysPassed > 0 ? currentValue / periodDates.daysPassed : 0;
      const projectedValue = runRate * periodDates.totalDays;

      // For spend_limit, being "on track" means staying under budget
      const onTrack = goal.goal_type === 'spend_limit'
        ? currentValue <= goal.target_value
        : projectedValue >= goal.target_value;

      return {
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        current_value: currentValue,
        progress_percent: progressPercent,
        period: goal.period,
        period_start: periodDates.start.toISOString().split('T')[0],
        period_end: periodDates.end.toISOString().split('T')[0],
        on_track: onTrack,
        projected_value: projectedValue,
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return NextResponse.json({ error: 'Failed to calculate progress' }, { status: 500 });
  }
}
