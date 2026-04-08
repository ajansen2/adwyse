'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { PlatformBadge, DashboardSkeleton } from '@/components/ui';
import { navigateInApp } from '@/lib/shopify-app-bridge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  total_spend: number;
  total_revenue: number;
  total_orders: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  roas: number;
}

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7'];

function CompareContent() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const shop = searchParams.get('shop');
        const preselected = searchParams.get('campaigns')?.split(',') || [];

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
              const loaded = campaignsData.campaigns || [];
              setCampaigns(loaded);

              // Pre-select campaigns from URL or default to first 2
              if (preselected.length > 0) {
                setSelectedCampaigns(preselected.filter((id: string) =>
                  loaded.some((c: Campaign) => c.id === id)
                ));
              } else if (loaded.length >= 2) {
                setSelectedCampaigns([loaded[0].id, loaded[1].id]);
              }
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

  const comparingCampaigns = useMemo(() => {
    return campaigns.filter(c => selectedCampaigns.includes(c.id));
  }, [campaigns, selectedCampaigns]);

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  // Calculate metrics for comparison
  const metrics = useMemo(() => {
    if (comparingCampaigns.length === 0) return [];

    const metricDefs = [
      { key: 'total_spend', label: 'Ad Spend', format: 'currency', lower: true },
      { key: 'total_revenue', label: 'Revenue', format: 'currency', lower: false },
      { key: 'total_orders', label: 'Orders', format: 'number', lower: false },
      { key: 'roas', label: 'ROAS', format: 'multiplier', lower: false },
      { key: 'impressions', label: 'Impressions', format: 'number', lower: false },
      { key: 'clicks', label: 'Clicks', format: 'number', lower: false },
      { key: 'conversions', label: 'Conversions', format: 'number', lower: false },
    ];

    return metricDefs.map(def => {
      const values = comparingCampaigns.map(c => (c as any)[def.key] || 0);
      const best = def.lower ? Math.min(...values) : Math.max(...values);
      const bestIndex = values.indexOf(best);

      return {
        ...def,
        values,
        bestIndex,
        best,
      };
    });
  }, [comparingCampaigns]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (comparingCampaigns.length === 0) return [];

    return [
      {
        key: 'cpc',
        label: 'Cost Per Click',
        format: 'currency',
        lower: true,
        values: comparingCampaigns.map(c => c.clicks > 0 ? c.total_spend / c.clicks : 0),
      },
      {
        key: 'ctr',
        label: 'Click-Through Rate',
        format: 'percent',
        lower: false,
        values: comparingCampaigns.map(c => c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0),
      },
      {
        key: 'cvr',
        label: 'Conversion Rate',
        format: 'percent',
        lower: false,
        values: comparingCampaigns.map(c => c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0),
      },
      {
        key: 'aov',
        label: 'Avg Order Value',
        format: 'currency',
        lower: false,
        values: comparingCampaigns.map(c => c.total_orders > 0 ? c.total_revenue / c.total_orders : 0),
      },
      {
        key: 'cpa',
        label: 'Cost Per Acquisition',
        format: 'currency',
        lower: true,
        values: comparingCampaigns.map(c => c.total_orders > 0 ? c.total_spend / c.total_orders : 0),
      },
    ].map(m => ({
      ...m,
      bestIndex: m.lower
        ? m.values.indexOf(Math.min(...m.values.filter(v => v > 0)))
        : m.values.indexOf(Math.max(...m.values)),
      best: m.lower
        ? Math.min(...m.values.filter(v => v > 0))
        : Math.max(...m.values),
    }));
  }, [comparingCampaigns]);

  // Chart data for bar comparison
  const barChartData = useMemo(() => {
    if (comparingCampaigns.length === 0) return [];

    return [
      { metric: 'Spend ($)', ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, c.total_spend])) },
      { metric: 'Revenue ($)', ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, c.total_revenue])) },
      { metric: 'ROAS (x)', ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, c.roas])) },
    ];
  }, [comparingCampaigns]);

  // Radar chart data for normalized comparison
  const radarChartData = useMemo(() => {
    if (comparingCampaigns.length === 0) return [];

    const normalize = (values: number[]) => {
      const max = Math.max(...values);
      return values.map(v => max > 0 ? (v / max) * 100 : 0);
    };

    const roasValues = normalize(comparingCampaigns.map(c => c.roas));
    const revenueValues = normalize(comparingCampaigns.map(c => c.total_revenue));
    const ctrValues = normalize(comparingCampaigns.map(c => c.impressions > 0 ? c.clicks / c.impressions : 0));
    const cvrValues = normalize(comparingCampaigns.map(c => c.clicks > 0 ? c.conversions / c.clicks : 0));
    const ordersValues = normalize(comparingCampaigns.map(c => c.total_orders));

    return [
      { metric: 'ROAS', fullMark: 100, ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, roasValues[i]])) },
      { metric: 'Revenue', fullMark: 100, ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, revenueValues[i]])) },
      { metric: 'CTR', fullMark: 100, ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, ctrValues[i]])) },
      { metric: 'CVR', fullMark: 100, ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, cvrValues[i]])) },
      { metric: 'Orders', fullMark: 100, ...Object.fromEntries(comparingCampaigns.map((c, i) => [`campaign${i}`, ordersValues[i]])) },
    ];
  }, [comparingCampaigns]);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'multiplier':
        return `${value.toFixed(2)}x`;
      case 'percent':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateInApp('/dashboard/campaigns')}
                className="text-white/60 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Campaign Comparison</h1>
            </div>

            <button
              onClick={() => setShowSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Select Campaigns ({selectedCampaigns.length}/4)
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {comparingCampaigns.length === 0 ? (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Select campaigns to compare</h3>
              <p className="text-white/60 mb-6">Choose 2-4 campaigns to see a side-by-side comparison</p>
              <button
                onClick={() => setShowSelector(true)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
              >
                Select Campaigns
              </button>
            </div>
          ) : (
            <>
              {/* Campaign Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparingCampaigns.length}, minmax(0, 1fr))` }}>
                {comparingCampaigns.map((campaign, idx) => (
                  <div
                    key={campaign.id}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"
                    style={{ borderTopColor: COLORS[idx], borderTopWidth: '3px' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
                        <PlatformBadge platform={campaign.platform as any} className="mt-1" />
                      </div>
                      <button
                        onClick={() => toggleCampaign(campaign.id)}
                        className="text-white/40 hover:text-white/80 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Metrics Comparison */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h2 className="font-semibold text-white">Core Metrics</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {metrics.map((metric) => (
                    <div key={metric.key} className="grid items-center" style={{ gridTemplateColumns: `160px repeat(${comparingCampaigns.length}, minmax(0, 1fr))` }}>
                      <div className="px-4 py-3 text-white/60 text-sm font-medium">
                        {metric.label}
                      </div>
                      {metric.values.map((value, idx) => (
                        <div
                          key={idx}
                          className={`px-4 py-3 text-center ${metric.bestIndex === idx ? 'bg-green-500/10' : ''}`}
                        >
                          <span className={`font-semibold ${metric.bestIndex === idx ? 'text-green-400' : 'text-white'}`}>
                            {formatValue(value, metric.format)}
                          </span>
                          {metric.bestIndex === idx && (
                            <span className="ml-2 text-xs text-green-400">Best</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived Metrics */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h2 className="font-semibold text-white">Efficiency Metrics</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {derivedMetrics.map((metric) => (
                    <div key={metric.key} className="grid items-center" style={{ gridTemplateColumns: `160px repeat(${comparingCampaigns.length}, minmax(0, 1fr))` }}>
                      <div className="px-4 py-3 text-white/60 text-sm font-medium">
                        {metric.label}
                      </div>
                      {metric.values.map((value, idx) => (
                        <div
                          key={idx}
                          className={`px-4 py-3 text-center ${metric.bestIndex === idx && value > 0 ? 'bg-green-500/10' : ''}`}
                        >
                          <span className={`font-semibold ${metric.bestIndex === idx && value > 0 ? 'text-green-400' : 'text-white'}`}>
                            {value > 0 ? formatValue(value, metric.format) : '-'}
                          </span>
                          {metric.bestIndex === idx && value > 0 && (
                            <span className="ml-2 text-xs text-green-400">Best</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                  <h2 className="font-semibold text-white mb-4">Spend vs Revenue</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                          }}
                          formatter={(value: number) => value.toFixed(2)}
                        />
                        <Legend />
                        {comparingCampaigns.map((c, idx) => (
                          <Bar
                            key={c.id}
                            dataKey={`campaign${idx}`}
                            name={c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name}
                            fill={COLORS[idx]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                  <h2 className="font-semibold text-white mb-4">Performance Overview</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarChartData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                        {comparingCampaigns.map((c, idx) => (
                          <Radar
                            key={c.id}
                            name={c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name}
                            dataKey={`campaign${idx}`}
                            stroke={COLORS[idx]}
                            fill={COLORS[idx]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                          }}
                          formatter={(value: number) => value.toFixed(1)}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Winner Summary */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur border border-green-500/30 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Winner Summary
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...metrics.slice(0, 4), ...derivedMetrics.slice(0, 2)].map((metric) => {
                    const winner = comparingCampaigns[metric.bestIndex];
                    if (!winner) return null;
                    return (
                      <div key={metric.key} className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/60 text-xs mb-1">{metric.label}</div>
                        <div className="font-medium text-white truncate">{winner.name}</div>
                        <div className="text-green-400 text-sm">{formatValue(metric.best, metric.format)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <MobileNav activePage="campaigns" />

      {/* Campaign Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Select Campaigns to Compare</h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-white/60 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 text-white/60 text-sm">
              Select 2-4 campaigns ({selectedCampaigns.length} selected)
            </div>
            <div className="max-h-96 overflow-y-auto px-4 pb-4 space-y-2">
              {campaigns.map((campaign) => {
                const isSelected = selectedCampaigns.includes(campaign.id);
                const isDisabled = !isSelected && selectedCampaigns.length >= 4;

                return (
                  <button
                    key={campaign.id}
                    onClick={() => toggleCampaign(campaign.id)}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-orange-600/20 border-orange-500/50'
                        : isDisabled
                        ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-white/30'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{campaign.name}</div>
                          <div className="text-white/40 text-xs flex items-center gap-2">
                            <PlatformBadge platform={campaign.platform as any} className="!text-xs !px-1.5 !py-0.5" />
                            <span>ROAS: {campaign.roas.toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">${campaign.total_revenue.toFixed(0)}</div>
                        <div className="text-white/40 text-xs">revenue</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowSelector(false)}
                className="px-4 py-2 text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSelector(false)}
                disabled={selectedCampaigns.length < 2}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg font-medium transition"
              >
                Compare ({selectedCampaigns.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading comparison...</div>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
