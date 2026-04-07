'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, RefreshCw, ChevronRight, Target, DollarSign } from 'lucide-react';

interface BudgetRecommendation {
  campaign_id: string;
  campaign_name: string;
  platform: string;
  current_spend: number;
  recommended_spend: number;
  change_amount: number;
  change_percent: number;
  reason: string;
  expected_roas: number;
  confidence: 'high' | 'medium' | 'low';
}

interface BudgetOptimizationResult {
  recommendations: BudgetRecommendation[];
  summary: {
    current_total_spend: number;
    optimized_total_spend: number;
    current_roas: number;
    projected_roas: number;
    projected_revenue_increase: number;
    reallocation_percentage: number;
  };
  insights: string[];
  generated_at: string;
}

interface BudgetOptimizerProps {
  storeId: string;
}

const platformColors: Record<string, { bg: string; text: string }> = {
  facebook: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  google: { bg: 'bg-red-500/20', text: 'text-red-400' },
  tiktok: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  pinterest: { bg: 'bg-red-600/20', text: 'text-red-400' },
  snapchat: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  unknown: { bg: 'bg-white/10', text: 'text-white/60' },
};

export function BudgetOptimizer({ storeId }: BudgetOptimizerProps) {
  const [data, setData] = useState<BudgetOptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const fetchOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/budget-optimizer?store_id=${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch optimization');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchOptimization();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Budget Optimizer</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Budget Optimizer</h3>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={fetchOptimization}
            className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Budget Optimizer</h3>
        </div>
        <div className="text-center py-6">
          <Target className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <p className="text-sm text-white/60 mb-1">
            No optimization recommendations yet
          </p>
          <p className="text-xs text-white/40">
            {data?.insights[0] || 'Connect ad platforms and run campaigns to get AI-powered budget recommendations.'}
          </p>
        </div>
      </div>
    );
  }

  const displayedRecommendations = showAllRecommendations
    ? data.recommendations
    : data.recommendations.slice(0, 3);

  const increases = data.recommendations.filter(r => r.change_amount > 0);
  const decreases = data.recommendations.filter(r => r.change_amount < 0);

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Budget Optimizer</h3>
          </div>
          <button
            onClick={fetchOptimization}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-xs text-green-400 font-medium">Projected ROAS</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-green-400">
              {data.summary.projected_roas.toFixed(2)}x
            </span>
            {data.summary.projected_roas > data.summary.current_roas && (
              <span className="text-xs text-green-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{((data.summary.projected_roas - data.summary.current_roas) / data.summary.current_roas * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="text-xs text-green-400/60 mt-0.5">
            Current: {data.summary.current_roas.toFixed(2)}x
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="text-xs text-purple-400 font-medium">Budget Reallocation</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-purple-400">
              {data.summary.reallocation_percentage.toFixed(0)}%
            </span>
          </div>
          <div className="text-xs text-purple-400/60 mt-0.5">
            ${decreases.reduce((sum, r) => sum + Math.abs(r.change_amount), 0).toFixed(2)} to reallocate
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs border-y border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-white/60">
            {increases.length} to scale
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white/60">
            {decreases.length} to reduce
          </span>
        </div>
        {data.summary.projected_revenue_increase > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <DollarSign className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-medium">
              +${data.summary.projected_revenue_increase.toFixed(0)} projected
            </span>
          </div>
        )}
      </div>

      {/* Recommendations List */}
      <div className="divide-y divide-white/5">
        {displayedRecommendations.map((rec) => {
          const platform = platformColors[rec.platform] || platformColors.unknown;
          return (
            <div
              key={rec.campaign_id}
              className="p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${platform.bg} ${platform.text}`}
                    >
                      {rec.platform}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        rec.confidence === 'high'
                          ? 'bg-green-500/20 text-green-400'
                          : rec.confidence === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {rec.confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {rec.campaign_name}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                    {rec.reason}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      rec.change_amount > 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {rec.change_amount > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {rec.change_amount > 0 ? '+' : ''}
                    {rec.change_percent.toFixed(0)}%
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    ${rec.current_spend.toFixed(0)} → ${rec.recommended_spend.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Button */}
      {data.recommendations.length > 3 && (
        <button
          onClick={() => setShowAllRecommendations(!showAllRecommendations)}
          className="w-full py-3 text-sm text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1 border-t border-white/5"
        >
          {showAllRecommendations ? 'Show less' : `Show ${data.recommendations.length - 3} more`}
          <ChevronRight className={`w-4 h-4 transition-transform ${showAllRecommendations ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-t border-white/5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5">
              {data.insights.slice(0, 2).map((insight, idx) => (
                <p key={idx} className="text-xs text-white/70">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
