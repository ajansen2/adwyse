'use client';

import { useMemo } from 'react';

interface ProfitSummaryProps {
  revenue: number;
  adSpend: number;
  cogs?: number;
  className?: string;
}

export function ProfitSummary({ revenue, adSpend, cogs = 0, className = '' }: ProfitSummaryProps) {
  const metrics = useMemo(() => {
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - adSpend;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const roasMultiplier = adSpend > 0 ? revenue / adSpend : 0;

    return {
      grossProfit,
      netProfit,
      profitMargin,
      roasMultiplier,
      isProfitable: netProfit > 0
    };
  }, [revenue, adSpend, cogs]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Calculate percentages for the waterfall
  const total = revenue;
  const cogsPercent = total > 0 ? (cogs / total) * 100 : 0;
  const adSpendPercent = total > 0 ? (adSpend / total) * 100 : 0;
  const profitPercent = total > 0 ? (metrics.netProfit / total) * 100 : 0;

  return (
    <div className={`bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Profit Summary</h2>
          <p className="text-white/60 text-sm">Revenue breakdown</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          metrics.isProfitable
            ? 'bg-green-500/20 text-green-300'
            : 'bg-red-500/20 text-red-300'
        }`}>
          {metrics.isProfitable ? 'Profitable' : 'Unprofitable'}
        </div>
      </div>

      {/* Waterfall Visualization */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {cogs > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-black"
              style={{ width: `${cogsPercent}%` }}
              title={`COGS: ${formatCurrency(cogs)}`}
            >
              {cogsPercent > 10 && 'COGS'}
            </div>
          )}
          {adSpend > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${adSpendPercent}%` }}
              title={`Ad Spend: ${formatCurrency(adSpend)}`}
            >
              {adSpendPercent > 10 && 'Ads'}
            </div>
          )}
          <div
            className={`flex items-center justify-center text-xs font-medium text-white ${
              metrics.netProfit >= 0 ? 'bg-green-500' : 'bg-gray-500'
            }`}
            style={{ width: `${Math.max(0, profitPercent)}%` }}
            title={`Net Profit: ${formatCurrency(metrics.netProfit)}`}
          >
            {profitPercent > 10 && 'Profit'}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/40">
          <span>$0</span>
          <span>{formatCurrency(revenue)}</span>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-white/70">Revenue</span>
          <span className="text-white font-bold">{formatCurrency(revenue)}</span>
        </div>
        {cogs > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <span className="text-white/70">Cost of Goods (COGS)</span>
            <span className="text-yellow-400 font-medium">-{formatCurrency(cogs)}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-white/70">Ad Spend</span>
          <span className="text-red-400 font-medium">-{formatCurrency(adSpend)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-white font-medium">Net Profit</span>
          <span className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.netProfit >= 0 ? '' : '-'}{formatCurrency(Math.abs(metrics.netProfit))}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className={`text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.profitMargin.toFixed(1)}%
          </div>
          <div className="text-white/50 text-xs">Profit Margin</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${metrics.roasMultiplier >= 1 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.roasMultiplier.toFixed(2)}x
          </div>
          <div className="text-white/50 text-xs">ROAS</div>
        </div>
      </div>
    </div>
  );
}

export default ProfitSummary;
