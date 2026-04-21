'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard, DataTable, PlatformBadge, DashboardSkeleton, type Column } from '@/components/ui';
import { authenticatedFetch } from '@/lib/shopify-app-bridge';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

interface DateRange {
  start: Date | null;
  end: Date | null;
  label: string;
}

interface Order {
  id: string;
  shopify_order_id: string;
  order_number: string;
  customer_email: string | null;
  total_price: number;
  currency: string;
  attributed_platform: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  order_created_at: string;
  created_at: string;
}

function OrdersContent() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const searchParams = useSearchParams();

  // Calculate date range based on selection
  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateRangeOption) {
      case '7d':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end, label: 'Last 7 days' };
      case '14d':
        return { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), end, label: 'Last 14 days' };
      case '30d':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end, label: 'Last 30 days' };
      case '90d':
        return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end, label: 'Last 90 days' };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59') : end,
          label: customStartDate && customEndDate
            ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
            : 'Custom range'
        };
      case 'all':
      default:
        return { start: null, end: null, label: 'All time' };
    }
  }, [dateRangeOption, customStartDate, customEndDate]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.start) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.order_created_at);
      return orderDate >= dateRange.start! && (!dateRange.end || orderDate <= dateRange.end);
    });
  }, [orders, dateRange]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const shop = searchParams.get('shop');

        if (!shop) {
          setLoading(false);
          return;
        }

        const lookupRes = await authenticatedFetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
        if (lookupRes.ok) {
          const data = await lookupRes.json();

          if (data.merchant) {
            const ordersRes = await authenticatedFetch(`/api/orders/list?merchant_id=${data.merchant.id}`);
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setOrders(ordersData.orders || []);
            }
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [searchParams]);

  // Calculate previous period metrics for comparison
  const previousPeriodMetrics = useMemo(() => {
    if (!dateRange.start || dateRangeOption === 'all') return null;

    const periodLength = dateRange.end
      ? dateRange.end.getTime() - dateRange.start.getTime()
      : 30 * 24 * 60 * 60 * 1000;

    const prevStart = new Date(dateRange.start.getTime() - periodLength);
    const prevEnd = new Date(dateRange.start.getTime() - 1);

    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.order_created_at);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total_price, 0);
    const prevAOV = prevOrders.length > 0 ? prevRevenue / prevOrders.length : 0;
    const prevAttributedOrders = prevOrders.filter(o => o.attributed_platform && o.attributed_platform !== 'direct');

    return {
      totalOrders: prevOrders.length,
      totalRevenue: prevRevenue,
      avgOrderValue: prevAOV,
      attributionRate: prevOrders.length > 0 ? (prevAttributedOrders.length / prevOrders.length) * 100 : 0,
    };
  }, [orders, dateRange, dateRangeOption]);

  // Calculate totals from filtered orders
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const adAttributedOrders = filteredOrders.filter(o => o.attributed_platform && o.attributed_platform !== 'direct');
  const adAttributedRevenue = adAttributedOrders.reduce((sum, o) => sum + o.total_price, 0);

  // Define table columns
  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order',
      sortable: true,
      sortValue: (row) => row.order_number,
      exportValue: (row) => row.order_number,
      accessor: (row) => (
        <span className="font-medium text-white">#{row.order_number}</span>
      )
    },
    {
      key: 'customer_email',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.customer_email || '',
      exportValue: (row) => row.customer_email || '',
      accessor: (row) => (
        <span className="text-white/80">{row.customer_email || 'No email'}</span>
      )
    },
    {
      key: 'total_price',
      header: 'Total',
      sortable: true,
      sortValue: (row) => row.total_price,
      exportValue: (row) => row.total_price,
      align: 'right',
      accessor: (row) => (
        <div>
          <div className="font-bold text-white">${row.total_price.toFixed(2)}</div>
          <div className="text-white/40 text-xs">{row.currency}</div>
        </div>
      )
    },
    {
      key: 'attributed_platform',
      header: 'Source',
      sortable: true,
      sortValue: (row) => row.attributed_platform || 'direct',
      exportValue: (row) => row.attributed_platform || 'direct',
      accessor: (row) => (
        <PlatformBadge platform={(row.attributed_platform as any) || 'direct'} />
      )
    },
    {
      key: 'utm_campaign',
      header: 'Campaign',
      sortable: true,
      sortValue: (row) => row.utm_campaign || '',
      exportValue: (row) => row.utm_campaign || '',
      accessor: (row) => (
        <div>
          <div className="text-white/80">{row.utm_campaign || '-'}</div>
          {row.utm_source && (
            <div className="text-white/40 text-xs">UTM: {row.utm_source}</div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      sortValue: (row) => new Date(row.created_at).getTime(),
      exportValue: (row) => new Date(row.created_at).toISOString(),
      accessor: (row) => (
        <div>
          <div className="text-white/80">
            {new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-white/40 text-xs">
            {new Date(row.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="orders" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="orders" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Orders</h1>

            {/* Date Range Picker */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dateRange.label}
                <svg className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2">
                      {[
                        { value: '7d', label: 'Last 7 days' },
                        { value: '14d', label: 'Last 14 days' },
                        { value: '30d', label: 'Last 30 days' },
                        { value: '90d', label: 'Last 90 days' },
                        { value: 'all', label: 'All time' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setDateRangeOption(option.value as DateRangeOption);
                            setShowDatePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                            dateRangeOption === option.value
                              ? 'bg-orange-600 text-white'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-white/10 p-3">
                      <div className="text-white/60 text-xs mb-2">Custom range</div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setDateRangeOption('custom');
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!customStartDate || !customEndDate}
                        className="w-full px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 disabled:text-white/40 rounded text-white text-sm font-medium transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Orders"
              value={filteredOrders.length}
              previousValue={previousPeriodMetrics?.totalOrders}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Total Revenue"
              value={totalRevenue}
              previousValue={previousPeriodMetrics?.totalRevenue}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Average Order Value"
              value={averageOrderValue}
              previousValue={previousPeriodMetrics?.avgOrderValue}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Attribution Rate"
              value={filteredOrders.length > 0 ? (adAttributedOrders.length / filteredOrders.length) * 100 : 0}
              previousValue={previousPeriodMetrics?.attributionRate}
              format="percent"
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Orders Table */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <DataTable
              data={filteredOrders}
              columns={columns}
              keyExtractor={(row) => row.id}
              searchable={true}
              searchPlaceholder="Search by order #, email, or campaign..."
              searchFn={(row, query) => {
                const q = query.toLowerCase();
                return (
                  row.order_number?.toLowerCase().includes(q) ||
                  row.customer_email?.toLowerCase().includes(q) ||
                  row.utm_campaign?.toLowerCase().includes(q) ||
                  row.attributed_platform?.toLowerCase().includes(q)
                );
              }}
              exportable={true}
              exportFilename="adwyse_orders"
              emptyMessage="No orders found. Orders will appear here once customers make purchases."
              pageSize={20}
              striped={false}
              hoverable={true}
              variant="dark"
            />
          </div>
        </div>
      </main>
      <MobileNav activePage="orders" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading orders...</div>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
