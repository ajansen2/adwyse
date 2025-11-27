'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { navigateInApp } from '@/lib/shopify-app-bridge';
import Link from 'next/link';

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
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const shop = searchParams.get('shop');

        if (!shop) {
          setLoading(false);
          return;
        }

        // Get merchant ID from store lookup
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        xhr.send();

        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const storeData = data.store || data.merchant;

          if (storeData) {
            // Fetch campaigns
            const campaignsXhr = new XMLHttpRequest();
            campaignsXhr.open('GET', `/api/campaigns/list?merchant_id=${storeData.id}`, false);
            campaignsXhr.send();

            if (campaignsXhr.status === 200) {
              const campaignsData = JSON.parse(campaignsXhr.responseText);
              setCampaigns(campaignsData.campaigns || []);
              setFilteredCampaigns(campaignsData.campaigns || []);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [searchParams]);

  // Filter campaigns when filter or search changes
  useEffect(() => {
    let filtered = campaigns;

    // Filter by platform
    if (filterPlatform !== 'all') {
      filtered = filtered.filter(campaign => campaign.platform === filterPlatform);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(query)
      );
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, filterPlatform, searchQuery]);

  // Get unique platforms for filter dropdown
  const platforms = Array.from(new Set(campaigns.map(campaign => campaign.platform))).filter(Boolean);

  // Calculate totals
  const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_spend, 0);
  const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_revenue, 0);
  const totalOrders = filteredCampaigns.reduce((sum, campaign) => sum + campaign.total_orders, 0);
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900/90 backdrop-blur border-r border-white/10 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="AdWyse" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigateInApp('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/orders')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/campaigns')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">Campaigns</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Total Campaigns</h3>
              <div className="text-3xl font-bold text-white">{filteredCampaigns.length}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Total Spend</h3>
              <div className="text-3xl font-bold text-white">${totalSpend.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Total Revenue</h3>
              <div className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-white/60 text-sm font-medium mb-2">Overall ROAS</h3>
              <div className={`text-3xl font-bold ${overallROAS >= 2 ? 'text-green-400' : overallROAS >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {overallROAS.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-white/60 text-sm mb-2 block">Search Campaigns</label>
                <input
                  type="text"
                  placeholder="Search by campaign name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="w-full md:w-64">
                <label className="text-white/60 text-sm mb-2 block">Filter by Platform</label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Campaigns Grid */}
          {filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCampaigns.map((campaign) => {
                const roas = campaign.roas || 0;
                const roasColor = roas >= 2 ? 'text-green-400' : roas >= 1 ? 'text-yellow-400' : 'text-red-400';
                const roasBg = roas >= 2 ? 'bg-green-500/10 border-green-500/30' : roas >= 1 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

                return (
                  <div key={campaign.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                    {/* Campaign Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{campaign.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.platform === 'facebook'
                              ? 'bg-blue-500/20 text-blue-300'
                              : campaign.platform === 'google'
                              ? 'bg-red-500/20 text-red-300'
                              : campaign.platform === 'tiktok'
                              ? 'bg-pink-500/20 text-pink-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {campaign.platform}
                          </span>
                          <span className="text-white/40 text-sm">
                            {new Date(campaign.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${roasBg}`}>
                        <div className="text-xs text-white/60 mb-1">ROAS</div>
                        <div className={`text-2xl font-bold ${roasColor}`}>{roas.toFixed(2)}x</div>
                      </div>
                    </div>

                    {/* Campaign Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-white/40 text-sm mb-1">Spend</div>
                        <div className="text-white font-bold">${campaign.total_spend.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-sm mb-1">Revenue</div>
                        <div className="text-white font-bold">${campaign.total_revenue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-sm mb-1">Orders</div>
                        <div className="text-white font-bold">{campaign.total_orders}</div>
                      </div>
                    </div>

                    {/* Performance Indicator */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Performance:</span>
                        <span className={`font-semibold ${roasColor}`}>
                          {roas >= 2 ? 'Excellent' : roas >= 1 ? 'Profitable' : 'Needs Optimization'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No Campaigns Found</h3>
              <p className="text-white/60 mb-4">
                {searchQuery || filterPlatform !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Campaigns will be created automatically when orders with UTM parameters are tracked'}
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left max-w-lg mx-auto">
                <p className="text-white/70 text-sm mb-2">
                  <strong className="text-white">How it works:</strong>
                </p>
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
