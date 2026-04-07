'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard } from '@/components/ui';

interface Creative {
  platform_ad_id: string;
  ad_name: string | null;
  campaign_name: string | null;
  creative_type: string | null;
  thumbnail_url: string | null;
  total_spend: number;
  total_revenue: number;
  total_orders: number;
  roas: number;
}

interface FatigueAlert {
  platform_ad_id: string;
  ad_name: string | null;
  start_ctr: number;
  current_ctr: number;
  ctr_decline_pct: number;
  start_roas: number;
  current_roas: number;
  roas_decline_pct: number;
  is_fatigued: boolean;
}

interface Summary {
  totalCreatives: number;
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  overallROAS: number;
  fatiguedCreatives: number;
}

function CreativesContent() {
  const [loading, setLoading] = useState(true);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [fatigue, setFatigue] = useState<FatigueAlert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadCreatives = async () => {
      try {
        const shop = searchParams.get('shop');
        if (!shop) {
          setLoading(false);
          return;
        }

        // Get store ID from shop
        const lookupXhr = new XMLHttpRequest();
        lookupXhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        lookupXhr.send();

        if (lookupXhr.status === 200) {
          const data = JSON.parse(lookupXhr.responseText);
          if (data.store) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/api/creatives/list?store_id=${data.store.id}`, false);
            xhr.send();

            if (xhr.status === 200) {
              const creativesData = JSON.parse(xhr.responseText);
              setCreatives(creativesData.creatives || []);
              setFatigue(creativesData.fatigue || []);
              setSummary(creativesData.summary || null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading creatives:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreatives();
  }, [searchParams]);

  const getROASColor = (roas: number) => {
    if (roas >= 3) return 'text-green-400';
    if (roas >= 2) return 'text-green-300';
    if (roas >= 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCreativeTypeIcon = (type: string | null) => {
    switch (type) {
      case 'video': return '🎬';
      case 'carousel': return '🎠';
      case 'image': return '🖼️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading creatives...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="creatives" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Ad Creatives</h1>
            <p className="text-white/60 text-sm">Performance at the creative level</p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Creatives"
              value={summary?.totalCreatives || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Total Spend"
              value={summary?.totalSpend || 0}
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
              value={summary?.totalRevenue || 0}
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
              value={summary?.overallROAS || 0}
              format="multiplier"
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Creative Fatigue Alerts - only show creatives with actual decline */}
          {fatigue.filter(f => f.roas_decline_pct > 0 || f.ctr_decline_pct > 0).length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h2 className="text-lg font-bold text-white">Creative Fatigue Detected</h2>
                  <p className="text-white/60 text-sm">
                    {fatigue.filter(f => f.roas_decline_pct > 0 || f.ctr_decline_pct > 0).length} creative(s) showing declining performance
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {fatigue
                  .filter(f => f.roas_decline_pct > 0 || f.ctr_decline_pct > 0)
                  .slice(0, 5)
                  .map((f) => {
                    const roasDeclined = f.roas_decline_pct > 0;
                    const ctrDeclined = f.ctr_decline_pct > 0;
                    return (
                      <div
                        key={f.platform_ad_id}
                        className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{f.ad_name || f.platform_ad_id}</div>
                            <div className="text-white/50 text-sm">ID: {f.platform_ad_id}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm ${roasDeclined ? 'text-red-400' : 'text-green-400'}`}>
                              ROAS: {f.start_roas?.toFixed(2)}x → {f.current_roas?.toFixed(2)}x
                              <span className={`ml-2 ${roasDeclined ? 'text-red-300' : 'text-green-300'}`}>
                                ({Math.abs(f.roas_decline_pct || 0).toFixed(0)}% {roasDeclined ? 'decline' : 'improvement'})
                              </span>
                            </div>
                            <div className={`text-xs ${ctrDeclined ? 'text-yellow-400' : 'text-green-400'}`}>
                              CTR: {f.start_ctr?.toFixed(2)}% → {f.current_ctr?.toFixed(2)}%
                              {ctrDeclined && (
                                <span className="ml-1 text-yellow-300">
                                  ({Math.abs(f.ctr_decline_pct || 0).toFixed(0)}% decline)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Creatives Grid */}
          {creatives.length > 0 ? (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Top Performing Creatives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatives.map((creative, index) => (
                  <div
                    key={creative.platform_ad_id}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    {/* Rank Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl ${index < 3 ? 'text-yellow-400' : 'text-white/40'}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="text-xl">{getCreativeTypeIcon(creative.creative_type)}</span>
                      </div>
                      <span className={`text-lg font-bold ${getROASColor(creative.roas || 0)}`}>
                        {(creative.roas || 0).toFixed(2)}x
                      </span>
                    </div>

                    {/* Creative Info */}
                    <div className="mb-3">
                      <h3 className="text-white font-medium truncate">
                        {creative.ad_name || 'Unnamed Creative'}
                      </h3>
                      <p className="text-white/40 text-sm truncate">
                        {creative.campaign_name || creative.platform_ad_id}
                      </p>
                    </div>

                    {/* Thumbnail */}
                    {creative.thumbnail_url && (
                      <div className="mb-3 rounded-lg overflow-hidden bg-white/10 aspect-video">
                        <img
                          src={creative.thumbnail_url}
                          alt={creative.ad_name || 'Creative'}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-red-400 font-bold">${(creative.total_spend || 0).toFixed(0)}</div>
                        <div className="text-white/40 text-xs">Spend</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-green-400 font-bold">${(creative.total_revenue || 0).toFixed(0)}</div>
                        <div className="text-white/40 text-xs">Revenue</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-blue-400 font-bold">{creative.total_orders || 0}</div>
                        <div className="text-white/40 text-xs">Orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No Creative Data Yet</h3>
              <p className="text-white/60 mb-4">
                Creative-level data will appear once your ad platforms sync this information.
              </p>
              <p className="text-white/40 text-sm">
                Connect Facebook Ads, Google Ads, or TikTok Ads in Settings to get started.
              </p>
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="creatives" />
    </div>
  );
}

export default function CreativesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading creatives...</div>
        </div>
      </div>
    }>
      <CreativesContent />
    </Suspense>
  );
}
