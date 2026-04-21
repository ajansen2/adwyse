'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav, UpgradeGate } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/ui';
import { Users, TrendingUp, DollarSign, Info } from 'lucide-react';
import { useTier } from '@/lib/use-tier';
import { authenticatedFetch } from '@/lib/shopify-app-bridge';

interface Cohort {
  cohortMonth: string;
  cohortSize: number;
  retention: number[];
  revenue: number[];
}

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

function getHeatColor(pct: number): string {
  if (pct >= 60) return 'bg-green-500/80 text-white';
  if (pct >= 40) return 'bg-green-500/60 text-white';
  if (pct >= 25) return 'bg-yellow-500/60 text-white';
  if (pct >= 15) return 'bg-orange-500/50 text-white';
  if (pct >= 5) return 'bg-red-500/40 text-white';
  if (pct > 0) return 'bg-red-500/20 text-white/70';
  return 'bg-white/[0.02] text-white/30';
}

function CohortsContent() {
  const searchParams = useSearchParams();
  const { isPro, loading: tierLoading } = useTier();
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [view, setView] = useState<'retention' | 'revenue'>('retention');

  useEffect(() => {
    const load = async () => {
      try {
        const shop = searchParams.get('shop');
        let storeId: string | null = null;

        if (shop) {
          const lookup = await authenticatedFetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
          if (lookup.ok) {
            const data = await lookup.json();
            const s = data.store || data.merchant;
            if (s) storeId = s.id;
          }
        }

        if (!storeId) storeId = DEMO_STORE_ID;

        const res = await authenticatedFetch(`/api/metrics/cohorts?store_id=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setCohorts(data.cohorts || []);
          setIsDemo(!!data.isDemo);
        }
      } catch (err) {
        console.error('Failed to load cohorts:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  if (loading || tierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="cohorts" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="cohorts" />
        <main className="lg:ml-64 min-h-screen">
          <UpgradeGate
            feature="Cohort Retention"
            description="See exactly how each month's customers come back over time."
            bullets={[
              'Retention heatmap by acquisition month',
              'Track repurchase rates from M0 through M5+',
              'Switch between retention % and revenue $ views',
              'Identify churn problems before they kill your LTV',
            ]}
          />
        </main>
        <MobileNav activePage="cohorts" />
      </div>
    );
  }

  // Find max month offset across all cohorts (so all rows have same width)
  const maxOffset = Math.max(
    0,
    ...cohorts.map((c) => Math.max(c.retention.length, c.revenue.length))
  );

  // Aggregate stats
  const totalCustomers = cohorts.reduce((s, c) => s + c.cohortSize, 0);
  const avgM1Retention =
    cohorts.length > 0
      ? cohorts
          .filter((c) => c.retention.length > 1)
          .reduce((s, c) => s + (c.retention[1] || 0), 0) /
        Math.max(1, cohorts.filter((c) => c.retention.length > 1).length)
      : 0;
  const totalRevenue = cohorts.reduce(
    (s, c) => s + c.revenue.reduce((a, b) => a + b, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="cohorts" />
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Cohort Retention</h1>
              <p className="text-white/40 text-sm mt-0.5">
                Track how each month's customers come back over time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('retention')}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  view === 'retention'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Retention %
              </button>
              <button
                onClick={() => setView('revenue')}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  view === 'revenue'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Revenue $
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {isDemo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/80 text-sm">
                Showing demo data. Real cohort retention will appear once you have orders
                spanning multiple months.
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-white/60 text-sm">Total Customers</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {totalCustomers.toLocaleString()}
              </div>
              <div className="text-white/40 text-xs mt-1">across {cohorts.length} cohorts</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-sm">Avg Month 1 Retention</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {avgM1Retention.toFixed(0)}%
              </div>
              <div className="text-white/40 text-xs mt-1">customers who came back</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <span className="text-white/60 text-sm">Cohort Revenue</span>
              </div>
              <div className="text-3xl font-bold text-white">
                ${totalRevenue.toLocaleString()}
              </div>
              <div className="text-white/40 text-xs mt-1">total from these cohorts</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 overflow-x-auto">
            <h2 className="font-semibold text-white mb-4">Cohort Heatmap</h2>
            {cohorts.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                No cohort data yet. Once you have orders spanning multiple months, this
                will populate automatically.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 text-xs">
                    <th className="text-left py-2 pr-4 sticky left-0 bg-slate-900/80">
                      Cohort
                    </th>
                    <th className="text-right py-2 pr-4">Size</th>
                    {Array.from({ length: maxOffset }).map((_, i) => (
                      <th key={i} className="px-2 py-2 text-center min-w-[60px]">
                        M{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.cohortMonth} className="border-t border-white/5">
                      <td className="py-2 pr-4 text-white/80 font-medium sticky left-0 bg-slate-900/80">
                        {c.cohortMonth}
                      </td>
                      <td className="py-2 pr-4 text-right text-white/60">
                        {c.cohortSize}
                      </td>
                      {Array.from({ length: maxOffset }).map((_, i) => {
                        const pct = c.retention[i];
                        const rev = c.revenue[i];
                        if (pct === undefined) {
                          return (
                            <td
                              key={i}
                              className="px-1 py-1 text-center text-white/20 text-xs"
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={i} className="px-1 py-1">
                            <div
                              className={`rounded text-center text-xs font-medium py-1.5 ${getHeatColor(pct)}`}
                              title={`${pct}% retained — $${rev.toLocaleString()}`}
                            >
                              {view === 'retention'
                                ? `${pct}%`
                                : `$${(rev / 1000).toFixed(1)}k`}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 text-xs text-white/40">
              <span>Retention:</span>
              {[5, 15, 25, 40, 60].map((threshold) => (
                <div key={threshold} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded ${getHeatColor(threshold)}`} />
                  <span>{threshold}%+</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to read */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              How to read this
            </h3>
            <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
              <li>
                Each row is a group of customers who made their first purchase in that month
              </li>
              <li>
                <strong>M0</strong> is always 100% (the month they joined)
              </li>
              <li>
                <strong>M1, M2, M3...</strong> show what % came back to buy again in each
                following month
              </li>
              <li>Greener cells = stronger retention. Red cells = customers churning</li>
              <li>If your M1 is below 15%, you have a retention problem worth solving</li>
            </ul>
          </div>
        </div>
      </main>
      <MobileNav activePage="cohorts" />
    </div>
  );
}

export default function CohortsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-orange-500 border-r-transparent" />
        </div>
      }
    >
      <CohortsContent />
    </Suspense>
  );
}
