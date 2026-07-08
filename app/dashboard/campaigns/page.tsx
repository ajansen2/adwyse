'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard, DataTable, PlatformBadge, EmptyState, EmptyStateIcons, ErrorState, DashboardSkeleton, type Column } from '@/components/ui';
import { navigateInApp, authenticatedFetch } from '@/lib/shopify-app-bridge';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

interface DateRange {
  start: Date | null;
  end: Date | null;
  label: string;
}

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

interface AdAccount {
  id: string;
  platform: string;
  sync_status: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
}

function CampaignsContent() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
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

  // Filter campaigns by date range
  const filteredCampaigns = useMemo(() => {
    if (!dateRange.start) return campaigns;
    return campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.created_at);
      return campaignDate >= dateRange.start! && (!dateRange.end || campaignDate <= dateRange.end);
    });
  }, [campaigns, dateRange]);

  // OAuth connect helpers
  const openOAuthPopup = (url: string, name: string) => {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(url, name, `width=${width},height=${height},left=${left},top=${top}`);
  };

  const handleConnectGoogle = () => {
    if (!storeId) return;
    openOAuthPopup(`/api/auth/google?store_id=${storeId}`, 'Google OAuth');
  };

  const handleConnectMeta = () => {
    if (!storeId) return;
    openOAuthPopup(`/api/auth/facebook?store_id=${storeId}`, 'Facebook OAuth');
  };

  const handleConnectTikTok = () => {
    if (!storeId) return;
    openOAuthPopup(`/api/auth/tiktok?store_id=${storeId}`, 'TikTok OAuth');
  };

  // Check if any account is doing its first-ever sync
  const isFirstSync = adAccounts.some(a => a.sync_status === 'syncing' && !a.last_synced_at);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const shop = searchParams.get('shop');

        if (!shop) {
          setLoading(false);
          return;
        }

        const lookupRes = await authenticatedFetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
        if (lookupRes.ok) {
          const data = await lookupRes.json();
          const storeData = data.store || data.merchant;

          if (storeData) {
            setStoreId(storeData.id);

            // Fetch ad accounts for sync status context
            try {
              const accountsRes = await authenticatedFetch(`/api/ad-accounts?store_id=${storeData.id}`);
              if (accountsRes.ok) {
                const accountsData = await accountsRes.json();
                setAdAccounts(accountsData.accounts || []);
              }
            } catch { /* non-critical */ }

            const campaignsRes = await authenticatedFetch(`/api/campaigns/list?merchant_id=${storeData.id}`);
            if (campaignsRes.ok) {
              const campaignsData = await campaignsRes.json();
              setCampaigns(campaignsData.campaigns || []);
            } else {
              setFetchError(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [searchParams]);

  // Calculate previous period metrics for comparison
  const previousPeriodMetrics = useMemo(() => {
    if (!dateRange.start || dateRangeOption === 'all') return null;

    const periodLength = dateRange.end
      ? dateRange.end.getTime() - dateRange.start.getTime()
      : 30 * 24 * 60 * 60 * 1000;

    const prevStart = new Date(dateRange.start.getTime() - periodLength);
    const prevEnd = new Date(dateRange.start.getTime() - 1);

    const prevCampaigns = campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.created_at);
      return campaignDate >= prevStart && campaignDate <= prevEnd;
    });

    const prevSpend = prevCampaigns.reduce((sum, c) => sum + c.total_spend, 0);
    const prevRevenue = prevCampaigns.reduce((sum, c) => sum + c.total_revenue, 0);
    const prevOrders = prevCampaigns.reduce((sum, c) => sum + c.total_orders, 0);
    const prevROAS = prevSpend > 0 ? prevRevenue / prevSpend : 0;

    return {
      totalCampaigns: prevCampaigns.length,
      totalSpend: prevSpend,
      totalRevenue: prevRevenue,
      totalOrders: prevOrders,
      overallROAS: prevROAS,
    };
  }, [campaigns, dateRange, dateRangeOption]);

  // Calculate totals from filtered campaigns
  const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_spend, 0);
  const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_revenue, 0);
  const totalOrders = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_orders, 0);
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Define table columns
  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      sortable: true,
      sortValue: (row) => row.name,
      exportValue: (row) => row.name,
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
      exportValue: (row) => row.platform,
      accessor: (row) => (
        <PlatformBadge platform={(row.platform as any) || 'direct'} />
      )
    },
    {
      key: 'total_spend',
      header: 'Spend',
      sortable: true,
      sortValue: (row) => row.total_spend,
      exportValue: (row) => row.total_spend,
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
      exportValue: (row) => row.total_revenue,
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
      exportValue: (row) => row.total_orders,
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
      exportValue: (row) => row.roas || 0,
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
      exportValue: (row) => {
        const roas = row.roas || 0;
        return roas >= 2 ? 'Excellent' : roas >= 1 ? 'Profitable' : 'Needs Work';
      },
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
            <div className="text-white text-sm">
              Loading campaigns...{isFirstSync ? ' — first sync can take a few minutes' : ''}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="campaigns" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>

            <div className="flex items-center gap-3">
              {/* Compare Button */}
              <button
                onClick={() => navigateInApp('/dashboard/campaigns/compare')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare
              </button>

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
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Campaigns"
              value={filteredCampaigns.length}
              previousValue={previousPeriodMetrics?.totalCampaigns}
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
              previousValue={previousPeriodMetrics?.totalSpend}
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
              title="Overall ROAS"
              value={overallROAS}
              previousValue={previousPeriodMetrics?.overallROAS}
              format="multiplier"
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Campaigns Table, Empty State, or Error State */}
          {fetchError ? (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl">
              <ErrorState
                message="Couldn't load campaign data"
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <DataTable
                data={filteredCampaigns}
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
                variant="dark"
              />
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12">
              <EmptyState
                icon={EmptyStateIcons.campaigns}
                title="No campaigns yet"
                description="Connect an ad account to sync your campaigns and start tracking ROAS."
              >
                {/* Inline connect buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleConnectGoogle}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Ads
                  </button>
                  <button
                    onClick={handleConnectMeta}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Meta Ads
                  </button>
                  <button
                    onClick={handleConnectTikTok}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11V9.03a6.37 6.37 0 00-.81-.05 6.3 6.3 0 00-6.3 6.3A6.3 6.3 0 009.49 21.6a6.3 6.3 0 006.3-6.3V9.41a8.16 8.16 0 004.78 1.53V7.51a4.82 4.82 0 01-.98-.82z"/>
                    </svg>
                    TikTok Ads
                  </button>
                </div>
              </EmptyState>
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="campaigns" />
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
