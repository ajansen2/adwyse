'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { Sidebar, MobileNav, UpgradeGate } from '@/components/dashboard';
import { useTier } from '@/lib/use-tier';
import { authenticatedFetch } from '@/lib/shopify-app-bridge';
import {
  Eye,
  Plus,
  ExternalLink,
  Search,
  Trash2,
  Globe,
  Clock,
  X,
  Loader2,
  Users,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface Competitor {
  id: string;
  competitor_name: string;
  facebook_page_url: string | null;
  website_url: string | null;
  industry: string | null;
  notes: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

interface CompetitorAd {
  id: string;
  advertiserName: string;
  adCreativeBody: string;
  adCreativeTitle?: string;
  thumbnailUrl?: string;
  snapshotUrl?: string;
  platform: 'facebook' | 'instagram' | 'both';
  adType: 'image' | 'video' | 'carousel';
  isActive: boolean;
  startedRunning: string;
  impressionRange?: string;
  spendRange?: string;
}

interface Store {
  id: string;
  store_name: string;
}

const industries = [
  { value: 'default', label: 'All Industries' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'tech', label: 'Tech & Gadgets' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'food', label: 'Food & Beverage' },
];

function CompetitorSpyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPro, loading: tierLoading } = useTier();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('default');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracked' | 'discover'>('tracked');

  // Form state
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    facebookUrl: '',
    websiteUrl: '',
    industry: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Live ads viewer state
  const [viewingCompetitor, setViewingCompetitor] = useState<string | null>(null);
  const [liveAds, setLiveAds] = useState<CompetitorAd[]>([]);
  const [liveAdsLoading, setLiveAdsLoading] = useState(false);
  const [liveAdsError, setLiveAdsError] = useState<string | null>(null);
  const [liveAdsSource, setLiveAdsSource] = useState<'apify' | 'demo' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const shop = searchParams.get('shop');
        let storeId: string | null = null;
        let storeName = '';

        // Try shop param first (embedded Shopify app flow)
        if (shop) {
          const lookupRes = await authenticatedFetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            const storeData = lookupData.store || lookupData.merchant;
            if (storeData) {
              storeId = storeData.id;
              storeName = storeData.store_name || storeData.shop_domain || '';
            }
          }
        }

        // Fallback to Supabase auth (non-embedded flow)
        if (!storeId) {
          const supabase = getSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: storesData } = await supabase
              .from('adwyse_stores')
              .select('id, store_name')
              .eq('user_id', user.id);
            const typedStores = (storesData || []) as Store[];
            if (typedStores.length > 0) {
              storeId = typedStores[0].id;
              storeName = typedStores[0].store_name;
            }
          }
        }

        // Final fallback: use demo store so the page is never blank
        if (!storeId) {
          storeId = DEMO_STORE_ID;
          storeName = 'Demo Store';
        }

        setStores([{ id: storeId, store_name: storeName }]);

        // Fetch competitors
        const response = await authenticatedFetch(`/api/competitors?store_id=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setCompetitors(data.competitors || []);
        }

        // Fetch demo ads
        const adsResponse = await authenticatedFetch('/api/competitor-ads');
        if (adsResponse.ok) {
          const adsData = await adsResponse.json();
          setAds(adsData.ads || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, searchParams]);

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name.trim() || !stores[0]) return;

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: stores[0].id,
          competitor_name: newCompetitor.name,
          facebook_page_url: newCompetitor.facebookUrl || null,
          website_url: newCompetitor.websiteUrl || null,
          industry: newCompetitor.industry || null,
          notes: newCompetitor.notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitors([data, ...competitors]);
        setShowAddModal(false);
        setNewCompetitor({ name: '', facebookUrl: '', websiteUrl: '', industry: '', notes: '' });
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!stores[0]) return;

    try {
      const response = await authenticatedFetch(`/api/competitors?id=${id}&store_id=${stores[0].id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCompetitors(competitors.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting competitor:', error);
    }
  };

  const openAdLibrary = (competitorName: string) => {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&q=${encodeURIComponent(competitorName)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fetchLiveAds = async (competitorName: string) => {
    setViewingCompetitor(competitorName);
    setLiveAdsLoading(true);
    setLiveAdsError(null);
    setLiveAds([]);
    setLiveAdsSource(null);

    try {
      const sid = stores[0]?.id || '';
      const res = await authenticatedFetch(
        `/api/competitor-ads?query=${encodeURIComponent(competitorName)}&limit=20&store_id=${sid}`
      );
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setLiveAdsError(data.message || 'Competitor Spy requires AdWyse Pro');
        setLiveAdsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveAds(data.ads || []);
      setLiveAdsSource(data.source || null);
    } catch (err: any) {
      console.error('Failed to fetch live ads:', err);
      setLiveAdsError(err?.message || 'Failed to load ads');
    } finally {
      setLiveAdsLoading(false);
    }
  };

  const closeLiveAds = () => {
    setViewingCompetitor(null);
    setLiveAds([]);
    setLiveAdsError(null);
    setLiveAdsSource(null);
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Facebook</span>;
      case 'instagram':
        return <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">Instagram</span>;
      case 'both':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">Meta (FB + IG)</span>;
      default:
        return null;
    }
  };

  const getAdTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Video</span>;
      case 'carousel':
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">Carousel</span>;
      case 'image':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Image</span>;
      default:
        return null;
    }
  };

  if (loading || tierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Sidebar activePage="competitor-spy" />
        <main className="lg:ml-64 min-h-screen">
          <UpgradeGate
            feature="Competitor Spy"
            description="See exactly what ads your competitors are running on Facebook & Instagram — live, in real time."
            bullets={[
              'Live data from Meta Ad Library — updated 24h cache',
              'See thumbnails, copy, ad type (video/carousel), and platforms',
              'Track multiple competitors and quickly compare their creatives',
              'Direct links to each ad in Meta\'s public Ad Library',
            ]}
          />
        </main>
        <MobileNav activePage="competitor-spy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar activePage="competitor-spy" />
      <MobileNav activePage="competitor-spy" />

      <div className="lg:pl-64">
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">Competitor Spy</h1>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                    Premium
                  </span>
                </div>
                <p className="text-white/60 text-sm">Track competitors and spy on their ads</p>
              </div>
            </div>
          </div>

          {/* Quick Search - Opens Meta Ad Library */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h2 className="font-semibold text-white">Quick Search - Meta Ad Library</h2>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search any brand, competitor, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    openAdLibrary(searchQuery);
                  }
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50"
              />
              <button
                onClick={() => searchQuery.trim() && openAdLibrary(searchQuery)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                Open Ad Library
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Opens Meta Ad Library in a new tab - view all active Facebook & Instagram ads
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('tracked')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === 'tracked'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Tracked Competitors ({competitors.length})
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === 'discover'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Discover Ads
            </button>
          </div>

          {activeTab === 'tracked' ? (
            /* Tracked Competitors */
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Your Tracked Competitors</h2>
                  <p className="text-sm text-white/50">Quick access to spy on competitor ads</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {competitors.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No competitors tracked yet</h3>
                  <p className="text-white/50 mb-4 max-w-md mx-auto">
                    Add competitors to quickly view their Facebook & Instagram ads
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
                  >
                    Add your first competitor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {competitors.map((competitor) => (
                    <div
                      key={competitor.id}
                      className="p-4 hover:bg-white/[0.02] transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{competitor.competitor_name}</h3>
                            {competitor.industry && (
                              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                                {competitor.industry}
                              </span>
                            )}
                          </div>
                          {competitor.notes && (
                            <p className="text-sm text-white/50 line-clamp-1 mb-2">{competitor.notes}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Checked {formatTimeAgo(competitor.last_checked_at)}
                            </span>
                            {competitor.website_url && (
                              <a
                                href={competitor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-white/60"
                              >
                                <Globe className="w-3 h-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchLiveAds(competitor.competitor_name)}
                            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-lg transition flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Ads
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetitor(competitor.id)}
                            className="p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Discover Ads — live search */
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white text-lg">Discover Live Ads</h3>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                    Live
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Search any brand to see their active Facebook & Instagram ads — pulled live
                  from Meta Ad Library. Results cached 24h.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) fetchLiveAds(searchQuery.trim());
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Gymshark, Nike, Apple..."
                    className="flex-1 px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/40 text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Spy
                  </button>
                </form>

                {/* Quick brand suggestions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-white/40 text-xs">Try:</span>
                  {['Gymshark', 'Nike', 'Lululemon', 'Alo Yoga', 'Glossier', 'Allbirds'].map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setSearchQuery(b);
                        fetchLiveAds(b);
                      }}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs rounded-full transition"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <Eye className="w-8 h-8 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 text-sm">
                  Search a brand above or click "View Ads" on a tracked competitor to see their
                  live creatives.
                </p>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Competitor Analysis Tips
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white text-sm mb-2">Look for Patterns</h4>
                <p className="text-xs text-white/60">
                  Notice which ad formats they use most - carousel, video, or static images?
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white text-sm mb-2">Track Offer Strategies</h4>
                <p className="text-xs text-white/60">
                  Monitor their discounts, bundles, and seasonal offers to stay competitive.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white text-sm mb-2">Study Ad Copy</h4>
                <p className="text-xs text-white/60">
                  Analyze their headlines, CTAs, and emotional triggers they use.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Add Competitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-white/40 hover:text-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Competitor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Nike, Adidas, Gymshark"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/brandname"
                  value={newCompetitor.facebookUrl}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, facebookUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://competitor.com"
                  value={newCompetitor.websiteUrl}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, websiteUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Industry</label>
                <select
                  value={newCompetitor.industry}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="" className="bg-slate-800">Select industry</option>
                  {industries.slice(1).map((ind) => (
                    <option key={ind.value} value={ind.label} className="bg-slate-800">
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Notes</label>
                <textarea
                  placeholder="What to watch for, their strategy, etc."
                  value={newCompetitor.notes}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!newCompetitor.name.trim() || saving}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Ads Viewer Modal */}
      {viewingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white text-lg">{viewingCompetitor}</h3>
                  {liveAdsSource === 'apify' && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                      Live
                    </span>
                  )}
                  {liveAdsSource === 'demo' && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                      Sample
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-0.5">
                  {liveAdsLoading
                    ? 'Fetching latest ads from Meta Ad Library…'
                    : liveAds.length > 0
                    ? `${liveAds.length} active ${liveAds.length === 1 ? 'ad' : 'ads'} found`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAdLibrary(viewingCompetitor)}
                  className="px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Ad Library
                </button>
                <button
                  onClick={closeLiveAds}
                  className="p-1 text-white/40 hover:text-white/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {liveAdsLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-10 h-10 text-orange-400 animate-spin mb-4" />
                  <p className="text-white font-medium">Scraping Meta Ad Library…</p>
                  <p className="text-white/50 text-sm mt-1">
                    This usually takes 10–20 seconds for fresh competitors.
                  </p>
                </div>
              )}

              {liveAdsError && !liveAdsLoading && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                  <p className="text-red-400 font-medium">Couldn't load ads</p>
                  <p className="text-white/60 text-sm mt-1">{liveAdsError}</p>
                  <button
                    onClick={() => fetchLiveAds(viewingCompetitor)}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!liveAdsLoading && !liveAdsError && liveAds.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-white font-medium">No active ads found</p>
                  <p className="text-white/50 text-sm mt-1">
                    {viewingCompetitor} doesn't seem to have any ads running right now.
                  </p>
                </div>
              )}

              {!liveAdsLoading && !liveAdsError && liveAds.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.07] transition flex flex-col"
                    >
                      {/* Thumbnail */}
                      {(ad as any).thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(ad as any).thumbnailUrl}
                          alt=""
                          className="w-full h-48 object-cover bg-slate-800"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-white/20">
                          <Eye className="w-10 h-10" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-white/80 text-sm font-medium">
                            {ad.advertiserName}
                          </span>
                          {getPlatformBadge(ad.platform)}
                          {ad.adType === 'video' && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              Video
                            </span>
                          )}
                          {ad.adType === 'carousel' && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Carousel
                            </span>
                          )}
                        </div>

                        {ad.adCreativeTitle && (
                          <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                            {ad.adCreativeTitle}
                          </h4>
                        )}
                        {ad.adCreativeBody && (
                          <p className="text-white/60 text-xs line-clamp-3 mb-3">
                            {ad.adCreativeBody}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ad.startedRunning?.split(' ')[0] || ''}
                          </span>
                          {(ad as any).snapshotUrl && (
                            <a
                              href={(ad as any).snapshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
              <span>
                {liveAdsSource === 'apify'
                  ? 'Live data from Meta Ad Library (cached 24h)'
                  : liveAdsSource === 'demo'
                  ? 'Sample data — connect a real source to see live ads'
                  : 'Loading…'}
              </span>
              <button
                onClick={closeLiveAds}
                className="text-white/60 hover:text-white/80 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetitorSpyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      }
    >
      <CompetitorSpyContent />
    </Suspense>
  );
}
