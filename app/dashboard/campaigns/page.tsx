'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MetricCard, DataTable, PlatformBadge, EmptyState, EmptyStateIcons, DashboardSkeleton, type Column } from '@/components/ui';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  total_spend: number;
  total_revenue: number;
  total_orders: number;
  created_at: string;
  roas?: number;
}

function CampaignsContent() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadCampaigns = async () => {
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
          const storeData = data.store || data.merchant;

          if (storeData) {
            const campaignsXhr = new XMLHttpRequest();
            campaignsXhr.open('GET', `/api/campaigns/list?merchant_id=${storeData.id}`, false);
            campaignsXhr.send();

            if (campaignsXhr.status === 200) {
              const campaignsData = JSON.parse(campaignsXhr.responseText);
              setCampaigns(campaignsData.campaigns || []);
            }
          }
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [searchParams]);

  // Calculate totals
  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.total_spend, 0);
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.total_revenue, 0);
  const totalOrders = campaigns.reduce((sum, campaign) => sum + campaign.total_orders, 0);
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Define table columns
  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      sortable: true,
      sortValue: (row) => row.name,
      accessor: (row) => (
        <div>
          <div className="font-medium text-white">{row.name}</div>
          <div className="text-white/40 text-xs">
            {new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
      )
    },
    {
      key: 'platform',
      header: 'Platform',
      sortable: true,
      sortValue: (row) => row.platform,
      accessor: (row) => (
        <PlatformBadge platform={(row.platform as any) || 'direct'} />
      )
    },
    {
      key: 'total_spend',
      header: 'Spend',
      sortable: true,
      sortValue: (row) => row.total_spend,
      align: 'right',
      accessor: (row) => (
        <span className="text-white font-medium">${row.total_spend.toFixed(2)}</span>
      )
    },
    {
      key: 'total_revenue',
      header: 'Revenue',
      sortable: true,
      sortValue: (row) => row.total_revenue,
      align: 'right',
      accessor: (row) => (
        <span className="text-white font-bold">${row.total_revenue.toFixed(2)}</span>
      )
    },
    {
      key: 'total_orders',
      header: 'Orders',
      sortable: true,
      sortValue: (row) => row.total_orders,
      align: 'center',
      accessor: (row) => (
        <span className="text-white/80">{row.total_orders}</span>
      )
    },
    {
      key: 'roas',
      header: 'ROAS',
      sortable: true,
      sortValue: (row) => row.roas || 0,
      align: 'right',
      accessor: (row) => {
        const roas = row.roas || 0;
        const color = roas >= 2 ? 'text-green-400' : roas >= 1 ? 'text-yellow-400' : 'text-red-400';
        return (
          <span className={`font-bold ${color}`}>{roas.toFixed(2)}x</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Performance',
      sortable: true,
      sortValue: (row) => row.roas || 0,
      accessor: (row) => {
        const roas = row.roas || 0;
        if (roas >= 2) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Excellent
            </span>
          );
        }
        if (roas >= 1) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Profitable
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Needs Work
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="campaigns" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="campaigns" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Campaigns"
              value={campaigns.length}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Total Spend"
              value={totalSpend}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              title="Overall ROAS"
              value={overallROAS}
              format="multiplier"
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Campaigns Table or Empty State */}
          {campaigns.length > 0 ? (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <DataTable
                data={campaigns}
                columns={columns}
                keyExtractor={(row) => row.id}
                searchable={true}
                searchPlaceholder="Search by campaign name..."
                searchFn={(row, query) => {
                  const q = query.toLowerCase();
                  return row.name.toLowerCase().includes(q) || row.platform.toLowerCase().includes(q);
                }}
                exportable={true}
                exportFilename="adwyse_campaigns"
                emptyMessage="No campaigns found"
                pageSize={20}
                striped={false}
                hoverable={true}
                className="dark-table"
              />
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12">
              <EmptyState
                icon={EmptyStateIcons.campaigns}
                title="No Campaigns Found"
                description="Campaigns will be created automatically when orders with UTM parameters are tracked"
                className="[&_svg]:text-white/30 [&_h3]:text-white [&_p]:text-white/60"
              />
              <div className="max-w-md mx-auto mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-white/80 text-sm font-medium mb-2">How it works:</p>
                <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                  <li>Orders with UTM parameters automatically create campaigns</li>
                  <li>Connect Facebook/Google Ads to sync spend data</li>
                  <li>ROAS is calculated automatically once spend data is available</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading campaigns...</div>
        </div>
      </div>
    }>
      <CampaignsContent />
    </Suspense>
  );
}
