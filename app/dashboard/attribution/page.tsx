'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard, DashboardSkeleton, PlatformBadge } from '@/components/ui';

type AttributionModel = 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'position_based';

interface AttributionData {
  model: AttributionModel;
  channels: ChannelAttribution[];
  totalRevenue: number;
  totalOrders: number;
}

interface ChannelAttribution {
  channel: string;
  platform: string;
  revenue: number;
  orders: number;
  percentage: number;
  touchpoints: number;
}

interface TouchpointData {
  id: string;
  customer_identifier: string;
  touchpoint_type: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  occurred_at: string;
}

function AttributionContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('last_click');
  const [attributionData, setAttributionData] = useState<AttributionData | null>(null);
  const [touchpoints, setTouchpoints] = useState<TouchpointData[]>([]);

  // Load store ID from shop parameter
  useEffect(() => {
    const loadStore = async () => {
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
            setStoreId(storeData.id);
          }
        }
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [searchParams]);

  // Load attribution data
  useEffect(() => {
    if (!storeId) return;

    async function loadData() {
      try {
        // Load attribution summary
        const res = await fetch(`/api/attribution/summary?storeId=${storeId}&model=${selectedModel}`);
        if (res.ok) {
          const data = await res.json();
          setAttributionData(data);
        } else {
          // Generate sample data if API not available
          setAttributionData({
            model: selectedModel,
            totalRevenue: 0,
            totalOrders: 0,
            channels: []
          });
        }

        // Load recent touchpoints
        const touchpointRes = await fetch(`/api/attribution/touchpoints?storeId=${storeId}&limit=50`);
        if (touchpointRes.ok) {
          const data = await touchpointRes.json();
          setTouchpoints(data.touchpoints || []);
        }
      } catch (error) {
        console.error('Error loading attribution data:', error);
        // Set empty data on error
        setAttributionData({
          model: selectedModel,
          totalRevenue: 0,
          totalOrders: 0,
          channels: []
        });
      }
    }

    loadData();
  }, [storeId, selectedModel]);

  const modelDescriptions: Record<AttributionModel, string> = {
    last_click: 'Gives 100% credit to the last touchpoint before conversion',
    first_click: 'Gives 100% credit to the first touchpoint in the journey',
    linear: 'Distributes credit equally across all touchpoints',
    time_decay: 'Gives more credit to touchpoints closer to conversion (7-day half-life)',
    position_based: 'Gives 40% to first, 40% to last, and 20% distributed to middle touchpoints'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="attribution" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="attribution" />
        <main className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">No Store Connected</h2>
            <p className="mt-2 text-white/60">Please connect your Shopify store first.</p>
            <p className="mt-1 text-white/40 text-sm">Make sure the shop parameter is in the URL.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="attribution" />

      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Multi-Touch Attribution</h1>
            <p className="text-white/60 text-sm">Understand how your marketing channels contribute to conversions</p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Attribution Model Selector */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Attribution Model</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['last_click', 'first_click', 'linear', 'time_decay', 'position_based'] as AttributionModel[]).map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedModel === model
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {model.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
            <p className="mt-4 text-white/50 text-sm">
              {modelDescriptions[selectedModel]}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Attributed Revenue"
              value={attributionData?.totalRevenue || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Attributed Orders"
              value={attributionData?.totalOrders || 0}
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Channels Tracked"
              value={attributionData?.channels?.length || 0}
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Total Touchpoints"
              value={touchpoints.length}
              icon={
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Channel Attribution Table */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Channel Performance</h2>
              <p className="text-sm text-white/60">Revenue attribution by marketing channel</p>
            </div>

            {attributionData?.channels && attributionData.channels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Channel</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Orders</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">% of Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Touchpoints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {attributionData.channels.map((channel, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <PlatformBadge platform={channel.platform as any || 'direct'} />
                            <span className="text-white font-medium">{channel.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-white font-bold">
                          {formatCurrency(channel.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-white/80">
                          {channel.orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-white/10 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${channel.percentage}%` }}
                              />
                            </div>
                            <span className="text-white/70 w-12 text-right">{channel.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-white/60">
                          {channel.touchpoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-white/60 mb-2">No Attribution Data Yet</p>
                <p className="text-sm text-white/40">
                  Attribution data will appear here once orders with UTM parameters are tracked.
                </p>
                <div className="max-w-md mx-auto mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left">
                  <p className="text-white/80 text-sm font-medium mb-2">How to track attribution:</p>
                  <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                    <li>Add UTM parameters to your ad campaigns</li>
                    <li>Install the AdWyse pixel on your store</li>
                    <li>Orders will be attributed automatically</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Recent Touchpoints */}
          {touchpoints.length > 0 && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Recent Touchpoints</h2>
                <p className="text-sm text-white/60">Latest customer interactions tracked</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Medium</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {touchpoints.slice(0, 20).map((tp) => (
                      <tr key={tp.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/80">
                            {tp.touchpoint_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">
                          {tp.utm_source || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/60">
                          {tp.utm_medium || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/60">
                          {tp.utm_campaign || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/40 text-sm">
                          {new Date(tp.occurred_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="attribution" />
    </div>
  );
}

export default function AttributionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading attribution...</div>
        </div>
      </div>
    }>
      <AttributionContent />
    </Suspense>
  );
}
