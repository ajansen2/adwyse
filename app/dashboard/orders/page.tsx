'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MetricCard, DataTable, PlatformBadge, DashboardSkeleton, type Column } from '@/components/ui';

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
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const shop = searchParams.get('shop');

        if (!shop) {
          setLoading(false);
          return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        xhr.send();

        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);

          if (data.merchant) {
            const ordersXhr = new XMLHttpRequest();
            ordersXhr.open('GET', `/api/orders/list?merchant_id=${data.merchant.id}`, false);
            ordersXhr.send();

            if (ordersXhr.status === 200) {
              const ordersData = JSON.parse(ordersXhr.responseText);
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

  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const adAttributedOrders = orders.filter(o => o.attributed_platform && o.attributed_platform !== 'direct');
  const adAttributedRevenue = adAttributedOrders.reduce((sum, o) => sum + o.total_price, 0);

  // Define table columns
  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order',
      sortable: true,
      sortValue: (row) => row.order_number,
      accessor: (row) => (
        <span className="font-medium text-white">#{row.order_number}</span>
      )
    },
    {
      key: 'customer_email',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.customer_email || '',
      accessor: (row) => (
        <span className="text-white/80">{row.customer_email || 'No email'}</span>
      )
    },
    {
      key: 'total_price',
      header: 'Total',
      sortable: true,
      sortValue: (row) => row.total_price,
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
      accessor: (row) => (
        <PlatformBadge platform={(row.attributed_platform as any) || 'direct'} />
      )
    },
    {
      key: 'utm_campaign',
      header: 'Campaign',
      sortable: true,
      sortValue: (row) => row.utm_campaign || '',
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
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Orders</h1>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Orders"
              value={orders.length}
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
              value={orders.length > 0 ? (adAttributedOrders.length / orders.length) * 100 : 0}
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
              data={orders}
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
              className="dark-table"
            />
          </div>
        </div>
      </main>
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
