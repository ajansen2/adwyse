'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, RefreshCw, ChevronRight, Target, DollarSign, Calendar, Activity, Zap } from 'lucide-react';

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

interface CampaignTrend {
  campaign_id: string;
  campaign_name: string;
  platform: string;
  trend_direction: 'improving' | 'declining' | 'stable';
  trend_strength: number;
  roas_7d: number;
  roas_14d: number;
  roas_30d: number;
  predicted_roas_next_7d: number;
  confidence: number;
  day_of_week_patterns: { day: number; performance_index: number }[];
}

interface BudgetForecast {
  weekly_forecast: {
    predicted_spend: number;
    predicted_revenue: number;
    predicted_roas: number;
    confidence_interval: { low: number; high: number };
  };
  pacing: {
    current_daily_spend: number;
    recommended_daily_spend: number;
    on_pace: boolean;
    days_remaining: number;
    budget_utilization: number;
  };
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
  predictions?: {
    trends: CampaignTrend[];
    forecast: BudgetForecast;
    optimal_distribution: Record<string, number>;
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

      {/* Predictions Section */}
      {data.predictions && (
        <div className="px-4 pb-3">
          {/* Day of Week Performance */}
          <div className="bg-white/[0.03] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-white/80">Best Days to Advertise</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                // Aggregate performance across all campaigns
                const trends = data.predictions?.trends || [];
                const avgPerf = trends.length > 0
                  ? trends.reduce((sum, t) => {
                      const pattern = t.day_of_week_patterns.find(p => p.day === idx);
                      return sum + (pattern?.performance_index || 1);
                    }, 0) / trends.length
                  : 1;
                const height = Math.max(20, Math.min(100, avgPerf * 100 - 70));
                const isGood = avgPerf > 1.05;
                const isBad = avgPerf < 0.95;

                return (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isGood ? 'bg-green-500/60' : isBad ? 'bg-red-500/40' : 'bg-white/20'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[10px] mt-1 ${isGood ? 'text-green-400' : isBad ? 'text-red-400/70' : 'text-white/40'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Pacing */}
          {data.predictions.forecast?.pacing && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white/60">Budget Pacing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      data.predictions.forecast.pacing.on_pace
                        ? 'bg-green-500'
                        : data.predictions.forecast.pacing.budget_utilization > 100
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, data.predictions.forecast.pacing.budget_utilization)}%` }}
                  />
                </div>
                <span className={`font-medium ${
                  data.predictions.forecast.pacing.on_pace ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {data.predictions.forecast.pacing.budget_utilization.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
          const trend = data.predictions?.trends.find(t => t.campaign_id === rec.campaign_id);

          return (
            <div
              key={rec.campaign_id}
              className="p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${platform.bg} ${platform.text}`}
                    >
                      {rec.platform}
                    </span>
                    {trend && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          trend.trend_direction === 'improving'
                            ? 'bg-green-500/20 text-green-400'
                            : trend.trend_direction === 'declining'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {trend.trend_direction === 'improving' ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : trend.trend_direction === 'declining' ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : (
                          <Activity className="w-2.5 h-2.5" />
                        )}
                        {trend.trend_direction}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        rec.confidence === 'high'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : rec.confidence === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {trend ? `${trend.confidence}%` : rec.confidence} conf
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {rec.campaign_name}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                    {rec.reason}
                  </p>
                  {trend && (
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40">
                      <span>7d: {trend.roas_7d.toFixed(1)}x</span>
                      <span>30d: {trend.roas_30d.toFixed(1)}x</span>
                      <span className="text-cyan-400">
                        <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                        Pred: {trend.predicted_roas_next_7d.toFixed(1)}x
                      </span>
                    </div>
                  )}
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
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">AI Insights</span>
          </div>
          <div className="space-y-2">
            {data.insights.slice(0, showAllRecommendations ? 5 : 3).map((insight, idx) => (
              <p key={idx} className="text-xs text-white/70 leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Forecast Summary */}
      {data.predictions?.forecast?.weekly_forecast && (
        <div className="px-4 py-3 bg-cyan-500/5 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white/60">7-Day Forecast</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/50">
                Spend: ${data.predictions.forecast.weekly_forecast.predicted_spend.toFixed(0)}
              </span>
              <span className="text-cyan-400 font-medium">
                ROAS: {data.predictions.forecast.weekly_forecast.predicted_roas.toFixed(2)}x
              </span>
              <span className="text-white/40">
                ({data.predictions.forecast.weekly_forecast.confidence_interval.low.toFixed(1)}-
                {data.predictions.forecast.weekly_forecast.confidence_interval.high.toFixed(1)}x)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
