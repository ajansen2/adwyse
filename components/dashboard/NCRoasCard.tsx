'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Repeat, Lightbulb, Loader2 } from 'lucide-react';

interface NCRoasData {
  isDemo: boolean;
  newCustomers: { orders: number; revenue: number; avgOrderValue: number };
  repeatCustomers: { orders: number; revenue: number; avgOrderValue: number };
  totalSpend: number;
  ncRoas: number;
  repeatRoas: number;
  blendedRoas: number;
  insight: string;
}

interface NCRoasCardProps {
  storeId: string;
}

export function NCRoasCard({ storeId }: NCRoasCardProps) {
  const [data, setData] = useState<NCRoasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/metrics/nc-roas?store_id=${storeId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const totalNewPlusRepeatRevenue =
    data.newCustomers.revenue + data.repeatCustomers.revenue;
  const newPct =
    totalNewPlusRepeatRevenue > 0
      ? (data.newCustomers.revenue / totalNewPlusRepeatRevenue) * 100
      : 0;
  const repeatPct = 100 - newPct;

  const ncColor =
    data.ncRoas >= 1.5
      ? 'text-green-400'
      : data.ncRoas >= 0.8
      ? 'text-yellow-400'
      : 'text-red-400';
  const repeatColor =
    data.repeatRoas >= 1.0
      ? 'text-green-400'
      : data.repeatRoas >= 0.5
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">New vs Repeat ROAS</h3>
          <p className="text-white/40 text-xs mt-0.5">Last 30 days</p>
        </div>
        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">
          Pro
        </span>
      </div>

      {/* Two big metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/[0.03] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-white/60">NC-ROAS</span>
          </div>
          <div className={`text-2xl font-bold ${ncColor}`}>
            {data.ncRoas.toFixed(2)}x
          </div>
          <div className="text-xs text-white/40 mt-1">
            ${data.newCustomers.revenue.toFixed(0)} from {data.newCustomers.orders} new
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Repeat className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-white/60">Repeat ROAS</span>
          </div>
          <div className={`text-2xl font-bold ${repeatColor}`}>
            {data.repeatRoas.toFixed(2)}x
          </div>
          <div className="text-xs text-white/40 mt-1">
            ${data.repeatCustomers.revenue.toFixed(0)} from{' '}
            {data.repeatCustomers.orders} repeat
          </div>
        </div>
      </div>

      {/* Revenue split bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-white/60">Revenue split</span>
          <span className="text-white/40">
            {newPct.toFixed(0)}% new / {repeatPct.toFixed(0)}% repeat
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-500 h-full"
            style={{ width: `${newPct}%` }}
          />
          <div
            className="bg-green-500 h-full"
            style={{ width: `${repeatPct}%` }}
          />
        </div>
      </div>

      {/* AVO comparison */}
      <div className="flex items-center justify-between text-xs text-white/50 mb-3 pb-3 border-b border-white/5">
        <span>
          New AOV:{' '}
          <span className="text-white font-medium">
            ${data.newCustomers.avgOrderValue.toFixed(0)}
          </span>
        </span>
        <span>
          Repeat AOV:{' '}
          <span className="text-white font-medium">
            ${data.repeatCustomers.avgOrderValue.toFixed(0)}
          </span>
        </span>
      </div>

      {/* Insight */}
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/70 leading-relaxed">{data.insight}</p>
      </div>
    </div>
  );
}
