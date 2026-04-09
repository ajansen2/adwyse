import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface CohortRow {
  cohortMonth: string; // 'YYYY-MM'
  cohortSize: number;
  // months[i] = % of cohort that placed an order in month i (0 = first month)
  retention: number[];
  revenue: number[];
}

function generateDemoCohorts(): CohortRow[] {
  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  // Synthetic but realistic-looking retention curves
  return months.map((m, i) => {
    const monthsAvailable = months.length - i;
    const cohortSize = 30 + Math.floor(Math.random() * 50);
    const retention = [100];
    const revenue = [cohortSize * 85];
    let r = 100;
    for (let j = 1; j < monthsAvailable; j++) {
      r = Math.max(8, r * (0.42 + Math.random() * 0.18));
      retention.push(Math.round(r));
      revenue.push(Math.round((cohortSize * (r / 100)) * 95));
    }
    return { cohortMonth: m, cohortSize, retention, revenue };
  });
}

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    const monthsBack = parseInt(
      request.nextUrl.searchParams.get('months') || '6',
      10
    );

    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json({ isDemo: true, cohorts: generateDemoCohorts() });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);

    // Pull all orders since the cohort window start
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_email, order_total, order_created_at')
      .eq('store_id', storeId)
      .gte('order_created_at', startDate.toISOString())
      .not('customer_email', 'is', null)
      .order('order_created_at', { ascending: true });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ isDemo: false, cohorts: [] });
    }

    // CRITICAL: A customer's "first order" must be their TRUE all-time first order,
    // not just the first order we see in the window. Otherwise customers who joined
    // years ago and re-purchased recently would be wrongly placed in a recent cohort.
    //
    // Query: for every email present in the window, look up the minimum
    // order_created_at across ALL their orders (any time).
    const emailsInWindow = Array.from(
      new Set(
        orders.map((o) => o.customer_email!.toLowerCase()).filter(Boolean)
      )
    );

    const firstOrderByEmail = new Map<string, Date>();

    // Batch the IN query to avoid Postgres parameter limits (~1000 emails per batch)
    const BATCH = 500;
    for (let i = 0; i < emailsInWindow.length; i += BATCH) {
      const batch = emailsInWindow.slice(i, i + BATCH);
      const { data: allTimeFirsts } = await supabase
        .from('orders')
        .select('customer_email, order_created_at')
        .eq('store_id', storeId)
        .in('customer_email', batch)
        .order('order_created_at', { ascending: true });

      (allTimeFirsts || []).forEach((row: any) => {
        const email = row.customer_email?.toLowerCase();
        if (!email) return;
        if (!firstOrderByEmail.has(email)) {
          // ascending order means first one we see is the earliest
          firstOrderByEmail.set(email, new Date(row.order_created_at));
        }
      });
    }

    // Drop customers whose true first order is BEFORE the window — they're
    // existing customers, not part of any displayed cohort.
    const validEmails = new Set<string>();
    firstOrderByEmail.forEach((firstDate, email) => {
      if (firstDate >= startDate) validEmails.add(email);
    });

    // Build cohorts: { '2026-03': { customers: Set, monthlyData: [...] } }
    interface CohortInternal {
      cohortMonth: string;
      customers: Set<string>;
      // monthOffset → set of emails who ordered, plus revenue
      monthlyActive: Map<number, Set<string>>;
      monthlyRevenue: Map<number, number>;
    }
    const cohorts = new Map<string, CohortInternal>();

    orders.forEach((o) => {
      const email = o.customer_email!.toLowerCase();
      // Skip pre-existing customers (their first order was before the window)
      if (!validEmails.has(email)) return;
      const orderDate = new Date(o.order_created_at);
      const firstDate = firstOrderByEmail.get(email)!;
      const cohortMonth = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
      const monthOffset =
        (orderDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (orderDate.getMonth() - firstDate.getMonth());

      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, {
          cohortMonth,
          customers: new Set(),
          monthlyActive: new Map(),
          monthlyRevenue: new Map(),
        });
      }
      const c = cohorts.get(cohortMonth)!;
      c.customers.add(email);
      if (!c.monthlyActive.has(monthOffset)) {
        c.monthlyActive.set(monthOffset, new Set());
      }
      c.monthlyActive.get(monthOffset)!.add(email);
      c.monthlyRevenue.set(
        monthOffset,
        (c.monthlyRevenue.get(monthOffset) || 0) + (o.order_total || 0)
      );
    });

    // Convert to retention percentages
    const result: CohortRow[] = Array.from(cohorts.values())
      .sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth))
      .map((c) => {
        const cohortSize = c.customers.size;
        const maxOffset = Math.max(...Array.from(c.monthlyActive.keys()), 0);
        const retention: number[] = [];
        const revenue: number[] = [];
        for (let i = 0; i <= maxOffset; i++) {
          const active = c.monthlyActive.get(i)?.size || 0;
          retention.push(cohortSize > 0 ? Math.round((active / cohortSize) * 100) : 0);
          revenue.push(Math.round(c.monthlyRevenue.get(i) || 0));
        }
        return { cohortMonth: c.cohortMonth, cohortSize, retention, revenue };
      });

    return NextResponse.json({ isDemo: false, cohorts: result });
  } catch (err: any) {
    console.error('Cohorts error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to compute cohorts' },
      { status: 500 }
    );
  }
}
