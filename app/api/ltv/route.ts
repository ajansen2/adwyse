import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CustomerLTV {
  customer_id: string;
  customer_email: string;
  first_order_date: string;
  last_order_date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  acquisition_source: string | null;
}

interface LTVMetrics {
  totalCustomers: number;
  avgLTV: number;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  topCustomers: CustomerLTV[];
  cohortData: {
    month: string;
    customers: number;
    revenue: number;
    avgLTV: number;
  }[];
  sourceBreakdown: {
    source: string;
    customers: number;
    avgLTV: number;
  }[];
}

/**
 * Get LTV metrics for a store
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

    // Get all orders for the store
    const { data: orders, error } = await supabase
      .from('adwyse_orders')
      .select('*')
      .eq('store_id', storeId)
      .order('order_created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        totalCustomers: 0,
        avgLTV: 0,
        avgOrderValue: 0,
        avgOrdersPerCustomer: 0,
        topCustomers: [],
        cohortData: [],
        sourceBreakdown: [],
      });
    }

    // Group orders by customer
    const customerMap = new Map<string, {
      customer_id: string;
      customer_email: string;
      orders: typeof orders;
      first_order_date: string;
      acquisition_source: string | null;
    }>();

    for (const order of orders) {
      const customerId = order.customer_id || order.customer_email || 'unknown';

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_email: order.customer_email || 'Unknown',
          orders: [],
          first_order_date: order.order_created_at,
          acquisition_source: order.attributed_platform,
        });
      }

      customerMap.get(customerId)!.orders.push(order);
    }

    // Calculate LTV for each customer
    const customerLTVs: CustomerLTV[] = [];
    let totalLTV = 0;

    for (const [, customer] of customerMap) {
      const totalRevenue = customer.orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
      const totalOrders = customer.orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const lastOrder = customer.orders[customer.orders.length - 1];

      const ltv: CustomerLTV = {
        customer_id: customer.customer_id,
        customer_email: customer.customer_email,
        first_order_date: customer.first_order_date,
        last_order_date: lastOrder.order_created_at,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        acquisition_source: customer.acquisition_source,
      };

      customerLTVs.push(ltv);
      totalLTV += totalRevenue;
    }

    // Sort by LTV and get top customers
    customerLTVs.sort((a, b) => b.total_revenue - a.total_revenue);
    const topCustomers = customerLTVs.slice(0, 10);

    // Calculate averages
    const totalCustomers = customerLTVs.length;
    const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;
    const avgOrderValue = orders.length > 0
      ? orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) / orders.length
      : 0;
    const avgOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;

    // Calculate cohort data (customers grouped by acquisition month)
    const cohortMap = new Map<string, { customers: Set<string>; revenue: number }>();

    for (const customer of customerLTVs) {
      const cohortMonth = customer.first_order_date.substring(0, 7); // YYYY-MM

      if (!cohortMap.has(cohortMonth)) {
        cohortMap.set(cohortMonth, { customers: new Set(), revenue: 0 });
      }

      cohortMap.get(cohortMonth)!.customers.add(customer.customer_id);
      cohortMap.get(cohortMonth)!.revenue += customer.total_revenue;
    }

    const cohortData = Array.from(cohortMap.entries())
      .map(([month, data]) => ({
        month,
        customers: data.customers.size,
        revenue: data.revenue,
        avgLTV: data.customers.size > 0 ? data.revenue / data.customers.size : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate source breakdown
    const sourceMap = new Map<string, { customers: Set<string>; revenue: number }>();

    for (const customer of customerLTVs) {
      const source = customer.acquisition_source || 'direct';

      if (!sourceMap.has(source)) {
        sourceMap.set(source, { customers: new Set(), revenue: 0 });
      }

      sourceMap.get(source)!.customers.add(customer.customer_id);
      sourceMap.get(source)!.revenue += customer.total_revenue;
    }

    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        customers: data.customers.size,
        avgLTV: data.customers.size > 0 ? data.revenue / data.customers.size : 0,
      }))
      .sort((a, b) => b.avgLTV - a.avgLTV);

    const metrics: LTVMetrics = {
      totalCustomers,
      avgLTV,
      avgOrderValue,
      avgOrdersPerCustomer,
      topCustomers,
      cohortData,
      sourceBreakdown,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error calculating LTV:', error);
    return NextResponse.json(
      { error: 'Failed to calculate LTV metrics' },
      { status: 500 }
    );
  }
}
