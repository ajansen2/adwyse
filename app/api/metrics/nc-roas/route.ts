import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireProFeature } from '@/lib/subscription-tiers';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

function generateDemoNCRoas() {
  return {
    isDemo: true,
    windowDays: 30,
    newCustomers: {
      orders: 127,
      revenue: 52430.50,
      avgOrderValue: 412.84,
    },
    repeatCustomers: {
      orders: 89,
      revenue: 31247.80,
      avgOrderValue: 351.10,
    },
    totalSpend: 19850.00,
    ncRoas: 2.64,
    repeatRoas: 4.21,
    blendedRoas: 3.18,
    insight:
      'New customers are spending 18% more per order than repeat customers. Repeat ROAS is 60% higher than new customer ROAS, suggesting strong retention. Consider scaling acquisition spend while maintaining creative quality.',
  };
}

/**
 * NC-ROAS = revenue from first-time buyers / ad spend
 * Repeat ROAS = revenue from returning buyers / ad spend
 *
 * A customer is "new" if their order_created_at is their first-ever order
 * for this store (across all time, not just the window).
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    const windowDays = parseInt(request.nextUrl.searchParams.get('window') || '30', 10);

    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    const gate = await requireProFeature(storeId, 'ncRoas');
    if (gate) return gate;

    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json(generateDemoNCRoas());
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // Get all orders in window
    const { data: windowOrders } = await supabase
      .from('orders')
      .select('id, customer_email, total_price, order_created_at')
      .eq('store_id', storeId)
      .gte('order_created_at', windowStart.toISOString());

    // Get all customer emails that have orders BEFORE the window (i.e., existing customers)
    const { data: priorOrders } = await supabase
      .from('orders')
      .select('customer_email')
      .eq('store_id', storeId)
      .lt('order_created_at', windowStart.toISOString())
      .not('customer_email', 'is', null);

    const existingCustomers = new Set(
      (priorOrders || [])
        .map((o) => o.customer_email?.toLowerCase())
        .filter(Boolean)
    );

    // Categorize window orders
    const seenInWindow = new Set<string>();
    let newOrders = 0;
    let newRevenue = 0;
    let repeatOrders = 0;
    let repeatRevenue = 0;

    (windowOrders || []).forEach((o) => {
      const email = o.customer_email?.toLowerCase();
      const isExistingCustomer = email && existingCustomers.has(email);
      // Only the FIRST order in the window from a given email counts as "new"
      // for window-relative purposes; subsequent orders within the window
      // from the same email count as repeat
      const alreadySeenInWindow = email && seenInWindow.has(email);
      if (email) seenInWindow.add(email);

      if (!isExistingCustomer && !alreadySeenInWindow) {
        newOrders += 1;
        newRevenue += o.total_price || 0;
      } else {
        repeatOrders += 1;
        repeatRevenue += o.total_price || 0;
      }
    });

    // Get total ad spend for the window
    const { data: campaignRows } = await supabase
      .from('adwyse_campaigns')
      .select('spend')
      .eq('store_id', storeId)
      .gte('date', windowStart.toISOString().split('T')[0]);

    const totalSpend = (campaignRows || []).reduce(
      (s, r) => s + parseFloat((r as any).spend || 0),
      0
    );

    const ncRoas = totalSpend > 0 ? newRevenue / totalSpend : 0;
    const repeatRoas = totalSpend > 0 ? repeatRevenue / totalSpend : 0;
    const blendedRoas = totalSpend > 0 ? (newRevenue + repeatRevenue) / totalSpend : 0;

    // Auto-generated insight
    let insight = '';
    if (totalSpend === 0) {
      insight =
        'Connect an ad account to see your true acquisition efficiency split by new vs returning customers.';
    } else if (ncRoas >= 1.5) {
      insight = `Strong acquisition: NC-ROAS of ${ncRoas.toFixed(2)}x means every $1 spent on ads brings in $${ncRoas.toFixed(2)} from brand-new customers. Scale more.`;
    } else if (ncRoas >= 0.8) {
      insight = `NC-ROAS of ${ncRoas.toFixed(2)}x is below profitable on first purchase — you're investing in LTV. Make sure your repeat purchase rate justifies it.`;
    } else if (newOrders === 0) {
      insight =
        'No new customers acquired in this window. Your ads are mostly reaching existing buyers — consider broader targeting.';
    } else {
      insight = `NC-ROAS is only ${ncRoas.toFixed(2)}x — acquisition is unprofitable on first order. Your growth depends on repeat purchases.`;
    }

    return NextResponse.json({
      isDemo: false,
      windowDays,
      newCustomers: {
        orders: newOrders,
        revenue: newRevenue,
        avgOrderValue: newOrders > 0 ? newRevenue / newOrders : 0,
      },
      repeatCustomers: {
        orders: repeatOrders,
        revenue: repeatRevenue,
        avgOrderValue: repeatOrders > 0 ? repeatRevenue / repeatOrders : 0,
      },
      totalSpend,
      ncRoas,
      repeatRoas,
      blendedRoas,
      insight,
    });
  } catch (err: any) {
    console.error('NC-ROAS error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to calc NC-ROAS' },
      { status: 500 }
    );
  }
}
