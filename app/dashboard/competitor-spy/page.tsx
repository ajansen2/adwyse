'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';

interface CompetitorAd {
  id: string;
  advertiserName: string;
  adCreativeBody: string;
  adCreativeTitle?: string;
  thumbnailUrl?: string;
  platform: 'facebook' | 'instagram' | 'both';
  adType: 'image' | 'video' | 'carousel';
  isActive: boolean;
  startedRunning: string;
  impressionRange?: string;
  spendRange?: string;
}

const industries = [
  { value: 'default', label: 'All Industries' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'tech', label: 'Tech & Gadgets' },
];

function CompetitorSpyContent() {
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('default');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [isDemo, setIsDemo] = useState(true);
  const searchParams = useSearchParams();

  const loadAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      if (selectedPlatform) params.append('platform', selectedPlatform);

      const response = await fetch('/api/competitor-ads?' + params.toString());
      const data = await response.json();

      setAds(data.ads || []);
      setIsDemo(data.isDemo || false);
    } catch (error) {
      console.error('Error loading competitor ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [selectedIndustry, selectedPlatform]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAds();
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </span>
        );
      case 'instagram':
        return (
          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </span>
        );
      case 'both':
        return (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            Meta (FB + IG)
          </span>
        );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="competitor-spy" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Competitor Ad Spy</h1>
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                Premium
              </span>
            </div>
            <p className="text-white/60 text-sm">See what ads your competitors are running</p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {isDemo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-white font-medium">Demo Mode</h3>
                  <p className="text-white/60 text-sm mt-1">
                    Showing sample competitor ads. Connect your Meta Ad Library API access in Settings to see real competitor data.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by brand name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value} className="bg-slate-800">
                    {industry.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="" className="bg-slate-800">All Platforms</option>
                <option value="facebook" className="bg-slate-800">Facebook</option>
                <option value="instagram" className="bg-slate-800">Instagram</option>
              </select>

              <button
                type="submit"
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
                <div className="text-white/60">Searching competitor ads...</div>
              </div>
            </div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{ad.advertiserName}</h3>
                      <p className="text-white/40 text-sm">Running since {new Date(ad.startedRunning).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getPlatformBadge(ad.platform)}
                      {getAdTypeBadge(ad.adType)}
                    </div>
                  </div>

                  {ad.adCreativeTitle && (
                    <h4 className="text-orange-400 font-medium mb-2">{ad.adCreativeTitle}</h4>
                  )}
                  <p className="text-white/80 text-sm mb-4 line-clamp-3">{ad.adCreativeBody}</p>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    {ad.impressionRange && (
                      <div>
                        <div className="text-white/40 text-xs">Impressions</div>
                        <div className="text-white font-medium text-sm">{ad.impressionRange}</div>
                      </div>
                    )}
                    {ad.spendRange && (
                      <div>
                        <div className="text-white/40 text-xs">Est. Spend</div>
                        <div className="text-green-400 font-medium text-sm">{ad.spendRange}</div>
                      </div>
                    )}
                    <div className="ml-auto">
                      {ad.isActive ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No Ads Found</h3>
              <p className="text-white/60">
                Try adjusting your search or filters to find competitor ads.
              </p>
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="competitor-spy" />
    </div>
  );
}

export default function CompetitorSpyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading Competitor Spy...</div>
        </div>
      </div>
    }>
      <CompetitorSpyContent />
    </Suspense>
  );
}
