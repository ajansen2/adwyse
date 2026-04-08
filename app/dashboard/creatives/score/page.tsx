'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/ui';
import { Trophy, TrendingDown, AlertTriangle, Sparkles, Info } from 'lucide-react';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface ScoredCreative {
  creative: {
    id: string;
    name: string;
    platform?: string;
    thumbnail_url?: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  score: number;
  rank: 'top' | 'good' | 'avg' | 'poor' | 'kill';
  ctr: number;
  cvr: number;
  roas: number;
  reason: string;
}

const RANK_STYLES = {
  top: { label: '🏆 Top', cls: 'bg-green-500/20 text-green-300 border-green-500/40' },
  good: { label: '✅ Good', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  avg: { label: '⚡ Average', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  poor: { label: '⚠️ Poor', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  kill: { label: '💀 Kill', cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
}

function CreativeScoreContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [scored, setScored] = useState<ScoredCreative[]>([]);
  const [filter, setFilter] = useState<'all' | 'top' | 'good' | 'avg' | 'poor' | 'kill'>(
    'all'
  );
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const shop = searchParams.get('shop');
        let storeId: string | null = null;
        if (shop) {
          const r = await fetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
          if (r.ok) {
            const d = await r.json();
            const s = d.store || d.merchant;
            if (s) storeId = s.id;
          }
        }
        if (!storeId) storeId = DEMO_STORE_ID;

        const res = await fetch(`/api/creatives/score?store_id=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setScored(data.scored || []);
          setIsDemo(!!data.isDemo);
        }
      } catch (err) {
        console.error('Failed to load creative scores:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="creatives" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  const filtered = filter === 'all' ? scored : scored.filter((s) => s.rank === filter);

  const counts = {
    top: scored.filter((s) => s.rank === 'top').length,
    good: scored.filter((s) => s.rank === 'good').length,
    avg: scored.filter((s) => s.rank === 'avg').length,
    poor: scored.filter((s) => s.rank === 'poor').length,
    kill: scored.filter((s) => s.rank === 'kill').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="creatives" />
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Creative Score
              </h1>
              <p className="text-white/40 text-sm mt-0.5">
                AI-ranked creative performance based on CTR, CVR, ROAS, and spend volume
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {isDemo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5" />
              <p className="text-white/80 text-sm">
                Showing demo data. Real creative scores will appear once you have ad spend
                data flowing in.
              </p>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                filter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All ({scored.length})
            </button>
            {(['top', 'good', 'avg', 'poor', 'kill'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-4 py-2 text-sm rounded-lg transition border ${
                  filter === r
                    ? RANK_STYLES[r].cls
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-transparent'
                }`}
              >
                {RANK_STYLES[r].label} ({counts[r]})
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-sm">Top Performers</span>
              </div>
              <div className="text-3xl font-bold text-green-400">{counts.top}</div>
              <div className="text-white/40 text-xs mt-1">scoring 80+</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-white/60 text-sm">Worth Scaling</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">{counts.top + counts.good}</div>
              <div className="text-white/40 text-xs mt-1">scoring 60+</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-white/60 text-sm">Need Attention</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">{counts.poor}</div>
              <div className="text-white/40 text-xs mt-1">scoring 20-39</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-white/60 text-sm">Kill List</span>
              </div>
              <div className="text-3xl font-bold text-red-400">{counts.kill}</div>
              <div className="text-white/40 text-xs mt-1">scoring under 20</div>
            </div>
          </div>

          {/* Scored grid */}
          {filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No creatives in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const style = RANK_STYLES[s.rank];
                return (
                  <div
                    key={s.creative.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition flex flex-col"
                  >
                    {/* Header strip */}
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${style.cls}`}>
                          {style.label}
                        </div>
                        <h3 className="text-white font-medium text-sm mt-2 truncate">
                          {s.creative.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${scoreColor(s.score)}`}>
                          {s.score}
                        </div>
                        <div className="text-xs text-white/40 -mt-1">/ 100</div>
                      </div>
                    </div>

                    {/* Metric bars */}
                    <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-white/40 mb-0.5">ROAS</div>
                        <div className="text-white font-medium">{s.roas.toFixed(2)}x</div>
                      </div>
                      <div>
                        <div className="text-white/40 mb-0.5">CTR</div>
                        <div className="text-white font-medium">
                          {(s.ctr * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 mb-0.5">CVR</div>
                        <div className="text-white font-medium">
                          {(s.cvr * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Spend / revenue */}
                    <div className="px-4 pb-3 flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-2">
                      <span>
                        Spend:{' '}
                        <span className="text-white/80 font-medium">
                          ${s.creative.spend.toFixed(0)}
                        </span>
                      </span>
                      <span>
                        Revenue:{' '}
                        <span className="text-green-400 font-medium">
                          ${s.creative.revenue.toFixed(0)}
                        </span>
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 mt-auto">
                      <p className="text-xs text-white/70 leading-relaxed">{s.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="creatives" />
    </div>
  );
}

export default function CreativeScorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-orange-500 border-r-transparent" />
        </div>
      }
    >
      <CreativeScoreContent />
    </Suspense>
  );
}
