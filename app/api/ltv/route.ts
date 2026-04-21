import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

interface CustomerLTV {
  customer_id: string;
  customer_email: string;
  first_order_date: string;
  last_order_date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  acquisition_source: string | null;
  predicted_ltv: number;
  ltv_score: 'high' | 'medium' | 'low';
  days_since_first_order: number;
  purchase_frequency: number; // orders per month
}

interface RetentionCohort {
  cohort: string;
  totalCustomers: number;
  retention: number[];
}

interface LTVMetrics {
  totalCustomers: number;
  avgLTV: number;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  avgPredictedLTV: number;
  predictedTotalValue: number;
  highValueCustomers: number;
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
    avgPredictedLTV: number;
  }[];
  retentionCohorts: RetentionCohort[];
}

/**
 * Calculate predicted LTV based on customer behavior patterns
 * Uses a simple model based on:
 * - Historical purchase frequency
 * - Average order value
 * - Customer lifetime (tenure)
 * - Recency of last purchase
 */
function calculatePredictedLTV(
  totalRevenue: number,
  totalOrders: number,
  daysSinceFirstOrder: number,
  daysSinceLastOrder: number,
  avgStoreOrderValue: number
): { predictedLTV: number; score: 'high' | 'medium' | 'low' } {
  // Calculate purchase frequency (orders per month)
  const monthsActive = Math.max(daysSinceFirstOrder / 30, 1);
  const purchaseFrequency = totalOrders / monthsActive;

  // Calculate average order value
  const customerAOV = totalOrders > 0 ? totalRevenue / totalOrders : avgStoreOrderValue;

  // Recency factor: customers who purchased recently are more likely to purchase again
  // Score from 0-1 (1 = purchased very recently)
  const recencyFactor = Math.max(0, 1 - (daysSinceLastOrder / 180)); // Decays over 6 months

  // Frequency factor: higher frequency = higher predicted future purchases
  // Expected purchases in next 12 months based on historical frequency
  const expectedOrdersNext12Months = purchaseFrequency * 12 * (0.5 + recencyFactor * 0.5);

  // Predicted additional revenue in next 12 months
  const predictedFutureValue = expectedOrdersNext12Months * customerAOV;

  // Total predicted LTV = current LTV + predicted future value
  const predictedLTV = totalRevenue + predictedFutureValue;

  // Calculate LTV score
  let score: 'high' | 'medium' | 'low' = 'low';
  if (predictedLTV >= avgStoreOrderValue * 5 || totalOrders >= 3) {
    score = 'high';
  } else if (predictedLTV >= avgStoreOrderValue * 2 || totalOrders >= 2) {
    score = 'medium';
  }

  return { predictedLTV, score };
}

/**
 * Get LTV metrics for a store
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

    // Get all orders for the store
    // Use 'orders' view which is an alias for adwyse_orders
    const { data: orders, error } = await supabase
      .from('orders')
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
        retentionCohorts: [],
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
        // Ensure order_created_at is a string for date processing
        const orderDate = order.order_created_at
          ? (typeof order.order_created_at === 'string'
              ? order.order_created_at
              : new Date(order.order_created_at).toISOString())
          : new Date().toISOString();

        customerMap.set(customerId, {
          customer_id: customerId,
          customer_email: order.customer_email || 'Unknown',
          orders: [],
          first_order_date: orderDate,
          acquisition_source: order.attributed_platform,
        });
      }

      customerMap.get(customerId)!.orders.push(order);
    }

    // First pass: calculate store-wide average order value for predictions
    const storeAvgOrderValue = orders.length > 0
      ? orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) / orders.length
      : 0;

    const now = new Date();

    // Calculate LTV for each customer
    const customerLTVs: CustomerLTV[] = [];
    let totalLTV = 0;
    let totalPredictedLTV = 0;
    let highValueCount = 0;

    for (const [, customer] of customerMap) {
      const totalRevenue = customer.orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
      const totalOrders = customer.orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const lastOrder = customer.orders[customer.orders.length - 1];

      // Ensure last_order_date is a string
      const lastOrderDate = lastOrder?.order_created_at
        ? (typeof lastOrder.order_created_at === 'string'
            ? lastOrder.order_created_at
            : new Date(lastOrder.order_created_at).toISOString())
        : customer.first_order_date;

      // Calculate days for prediction model
      const firstOrderDate = new Date(customer.first_order_date);
      const lastOrderDateObj = new Date(lastOrderDate);
      const daysSinceFirstOrder = Math.max(1, Math.floor((now.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysSinceLastOrder = Math.floor((now.getTime() - lastOrderDateObj.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate predicted LTV
      const { predictedLTV, score } = calculatePredictedLTV(
        totalRevenue,
        totalOrders,
        daysSinceFirstOrder,
        daysSinceLastOrder,
        storeAvgOrderValue
      );

      // Calculate purchase frequency (orders per month)
      const monthsActive = Math.max(daysSinceFirstOrder / 30, 1);
      const purchaseFrequency = totalOrders / monthsActive;

      const ltv: CustomerLTV = {
        customer_id: customer.customer_id,
        customer_email: customer.customer_email,
        first_order_date: customer.first_order_date,
        last_order_date: lastOrderDate,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        acquisition_source: customer.acquisition_source,
        predicted_ltv: predictedLTV,
        ltv_score: score,
        days_since_first_order: daysSinceFirstOrder,
        purchase_frequency: purchaseFrequency,
      };

      customerLTVs.push(ltv);
      totalLTV += totalRevenue;
      totalPredictedLTV += predictedLTV;
      if (score === 'high') highValueCount++;
    }

    // Sort by predicted LTV (highest potential first)
    customerLTVs.sort((a, b) => b.predicted_ltv - a.predicted_ltv);
    const topCustomers = customerLTVs.slice(0, 10);

    // Calculate averages
    const totalCustomers = customerLTVs.length;
    const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;
    const avgPredictedLTV = totalCustomers > 0 ? totalPredictedLTV / totalCustomers : 0;
    const avgOrderValue = storeAvgOrderValue;
    const avgOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;

    // Calculate cohort data (customers grouped by acquisition month)
    const cohortMap = new Map<string, { customers: Set<string>; revenue: number }>();

    for (const customer of customerLTVs) {
      // Extract YYYY-MM from ISO date string
      const cohortMonth = customer.first_order_date
        ? customer.first_order_date.substring(0, 7) // YYYY-MM
        : 'unknown';

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

    // Calculate source breakdown with predicted LTV
    const sourceMap = new Map<string, { customers: Set<string>; revenue: number; predictedRevenue: number }>();

    for (const customer of customerLTVs) {
      const source = customer.acquisition_source || 'direct';

      if (!sourceMap.has(source)) {
        sourceMap.set(source, { customers: new Set(), revenue: 0, predictedRevenue: 0 });
      }

      sourceMap.get(source)!.customers.add(customer.customer_id);
      sourceMap.get(source)!.revenue += customer.total_revenue;
      sourceMap.get(source)!.predictedRevenue += customer.predicted_ltv;
    }

    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        customers: data.customers.size,
        avgLTV: data.customers.size > 0 ? data.revenue / data.customers.size : 0,
        avgPredictedLTV: data.customers.size > 0 ? data.predictedRevenue / data.customers.size : 0,
      }))
      .sort((a, b) => b.avgPredictedLTV - a.avgPredictedLTV);

    // Calculate retention cohorts
    const retentionCohorts: RetentionCohort[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Group customers by first order month
    const customersByMonth = new Map<string, Set<string>>();
    const customerOrderMonths = new Map<string, Set<string>>();

    for (const customer of customerLTVs) {
      const firstOrderDate = new Date(customer.first_order_date);
      const cohortKey = `${firstOrderDate.getFullYear()}-${String(firstOrderDate.getMonth() + 1).padStart(2, '0')}`;

      if (!customersByMonth.has(cohortKey)) {
        customersByMonth.set(cohortKey, new Set());
      }
      customersByMonth.get(cohortKey)!.add(customer.customer_id);

      // Track all months this customer ordered in
      if (!customerOrderMonths.has(customer.customer_id)) {
        customerOrderMonths.set(customer.customer_id, new Set());
      }
    }

    // For each customer, find all months they ordered in
    for (const order of orders) {
      const customerId = order.customer_id || order.customer_email || 'unknown';
      const orderDate = new Date(order.order_created_at);
      const orderMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

      if (!customerOrderMonths.has(customerId)) {
        customerOrderMonths.set(customerId, new Set());
      }
      customerOrderMonths.get(customerId)!.add(orderMonthKey);
    }

    // Calculate retention for last 6 cohorts
    const sortedCohorts = Array.from(customersByMonth.keys()).sort().slice(-6);

    for (const cohortKey of sortedCohorts) {
      const [year, month] = cohortKey.split('-').map(Number);
      const cohortCustomers = customersByMonth.get(cohortKey)!;
      const totalInCohort = cohortCustomers.size;

      if (totalInCohort === 0) continue;

      const retention: number[] = [100]; // M0 is always 100%

      // Calculate retention for up to 6 periods
      for (let period = 1; period <= 5; period++) {
        const targetDate = new Date(year, month - 1 + period, 1);

        // Don't calculate future months
        if (targetDate > now) break;

        const targetMonthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

        let retained = 0;
        for (const customerId of cohortCustomers) {
          const orderMonths = customerOrderMonths.get(customerId);
          if (orderMonths && orderMonths.has(targetMonthKey)) {
            retained++;
          }
        }

        retention.push(Math.round((retained / totalInCohort) * 100));
      }

      retentionCohorts.push({
        cohort: `${monthNames[month - 1]} ${year}`,
        totalCustomers: totalInCohort,
        retention,
      });
    }

    const metrics: LTVMetrics = {
      totalCustomers,
      avgLTV,
      avgOrderValue,
      avgOrdersPerCustomer,
      avgPredictedLTV,
      predictedTotalValue: totalPredictedLTV,
      highValueCustomers: highValueCount,
      topCustomers,
      cohortData,
      sourceBreakdown,
      retentionCohorts,
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
