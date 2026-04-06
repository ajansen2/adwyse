'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard, DataTable, PlatformBadge, EmptyState, EmptyStateIcons, DashboardSkeleton, type Column } from '@/components/ui';
import { navigateInApp } from '@/lib/shopify-app-bridge';

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

function CampaignsContent() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>

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
              title="Total Campaigns"
              value={filteredCampaigns.length}
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
          {filteredCampaigns.length > 0 ? (
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
                title="No Campaigns Found"
                description="Connect your ad accounts to sync campaign data and track ROAS"
                className="[&_svg]:text-white/30 [&_h3]:text-white [&_p]:text-white/60"
              />

              {/* Connect Ads Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button
                  onClick={() => navigateInApp('/dashboard/settings')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Connect Facebook Ads
                </button>
                <button
                  onClick={() => navigateInApp('/dashboard/settings')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                  Connect Google Ads
                </button>
                <button
                  onClick={() => navigateInApp('/dashboard/settings')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  Connect TikTok Ads
                </button>
              </div>

              <div className="max-w-md mx-auto mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-white/80 text-sm font-medium mb-2">How it works:</p>
                <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                  <li>Orders with UTM parameters automatically create campaigns</li>
                  <li>Connect Facebook/Google/TikTok Ads to sync spend data</li>
                  <li>ROAS is calculated automatically once spend data is available</li>
                </ul>
              </div>
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
