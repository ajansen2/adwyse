import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  analyzeCampaignTrends,
  generateBudgetForecast,
  calculateOptimalDistribution,
  type CampaignTrend,
  type BudgetForecast,
  type DailyPerformance,
} from '@/lib/predictive-budget';
import { requireProFeature } from '@/lib/subscription-tiers';

// Demo store ID for Adam's store
const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface CampaignPerformance {
  id: string;
  campaign_name: string;
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  orders: number;
  cpa: number;
  efficiency_score: number;
}

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
  predictions?: {
    trends: CampaignTrend[];
    forecast: BudgetForecast;
    optimal_distribution: Record<string, number>;
  };
  insights: string[];
  generated_at: string;
}

/**
 * Generate demo budget optimization data for Adam's store
 */
function generateDemoBudgetOptimization(): BudgetOptimizationResult {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Demo trends data
  const demoTrends: CampaignTrend[] = [
    {
      campaign_id: 'demo_1',
      campaign_name: 'Summer Sale - Lookalike',
      platform: 'facebook',
      trend_direction: 'improving',
      trend_strength: 0.65,
      roas_7d: 4.2,
      roas_14d: 3.8,
      roas_30d: 3.5,
      ctr_trend: 0.02,
      conversion_rate_trend: 0.01,
      predicted_roas_next_7d: 4.5,
      confidence: 85,
      day_of_week_patterns: [
        { day: 0, avg_roas: 3.8, avg_spend: 95, performance_index: 0.9 },
        { day: 1, avg_roas: 4.5, avg_spend: 130, performance_index: 1.07 },
        { day: 2, avg_roas: 4.8, avg_spend: 145, performance_index: 1.14 },
        { day: 3, avg_roas: 4.2, avg_spend: 125, performance_index: 1.0 },
        { day: 4, avg_roas: 4.6, avg_spend: 140, performance_index: 1.1 },
        { day: 5, avg_roas: 4.0, avg_spend: 115, performance_index: 0.95 },
        { day: 6, avg_roas: 3.5, avg_spend: 100, performance_index: 0.83 },
      ],
    },
    {
      campaign_id: 'demo_2',
      campaign_name: 'Brand Awareness',
      platform: 'google',
      trend_direction: 'stable',
      trend_strength: 0.1,
      roas_7d: 3.1,
      roas_14d: 3.0,
      roas_30d: 2.9,
      ctr_trend: 0.005,
      conversion_rate_trend: 0.003,
      predicted_roas_next_7d: 3.15,
      confidence: 78,
      day_of_week_patterns: [
        { day: 0, avg_roas: 2.5, avg_spend: 45, performance_index: 0.81 },
        { day: 1, avg_roas: 3.4, avg_spend: 70, performance_index: 1.1 },
        { day: 2, avg_roas: 3.5, avg_spend: 72, performance_index: 1.13 },
        { day: 3, avg_roas: 3.2, avg_spend: 65, performance_index: 1.03 },
        { day: 4, avg_roas: 3.3, avg_spend: 68, performance_index: 1.06 },
        { day: 5, avg_roas: 2.9, avg_spend: 55, performance_index: 0.94 },
        { day: 6, avg_roas: 2.8, avg_spend: 50, performance_index: 0.9 },
      ],
    },
    {
      campaign_id: 'demo_3',
      campaign_name: 'Retargeting - Cart Abandoners',
      platform: 'facebook',
      trend_direction: 'improving',
      trend_strength: 0.45,
      roas_7d: 5.2,
      roas_14d: 4.8,
      roas_30d: 4.5,
      ctr_trend: 0.03,
      conversion_rate_trend: 0.02,
      predicted_roas_next_7d: 5.5,
      confidence: 72,
      day_of_week_patterns: [
        { day: 0, avg_roas: 4.8, avg_spend: 38, performance_index: 0.92 },
        { day: 1, avg_roas: 5.8, avg_spend: 52, performance_index: 1.12 },
        { day: 2, avg_roas: 5.5, avg_spend: 50, performance_index: 1.06 },
        { day: 3, avg_roas: 5.2, avg_spend: 48, performance_index: 1.0 },
        { day: 4, avg_roas: 5.4, avg_spend: 49, performance_index: 1.04 },
        { day: 5, avg_roas: 4.9, avg_spend: 42, performance_index: 0.94 },
        { day: 6, avg_roas: 4.6, avg_spend: 40, performance_index: 0.88 },
      ],
    },
    {
      campaign_id: 'demo_4',
      campaign_name: 'Cold Traffic - Interest',
      platform: 'facebook',
      trend_direction: 'declining',
      trend_strength: -0.55,
      roas_7d: 0.8,
      roas_14d: 1.2,
      roas_30d: 1.8,
      ctr_trend: -0.02,
      conversion_rate_trend: -0.015,
      predicted_roas_next_7d: 0.6,
      confidence: 80,
      day_of_week_patterns: [
        { day: 0, avg_roas: 0.7, avg_spend: 85, performance_index: 0.88 },
        { day: 1, avg_roas: 0.9, avg_spend: 105, performance_index: 1.13 },
        { day: 2, avg_roas: 0.85, avg_spend: 100, performance_index: 1.06 },
        { day: 3, avg_roas: 0.8, avg_spend: 97, performance_index: 1.0 },
        { day: 4, avg_roas: 0.82, avg_spend: 98, performance_index: 1.03 },
        { day: 5, avg_roas: 0.75, avg_spend: 95, performance_index: 0.94 },
        { day: 6, avg_roas: 0.7, avg_spend: 90, performance_index: 0.88 },
      ],
    },
    {
      campaign_id: 'demo_5',
      campaign_name: 'Display - GDN',
      platform: 'google',
      trend_direction: 'declining',
      trend_strength: -0.3,
      roas_7d: 1.1,
      roas_14d: 1.4,
      roas_30d: 1.6,
      ctr_trend: -0.01,
      conversion_rate_trend: -0.008,
      predicted_roas_next_7d: 0.95,
      confidence: 65,
      day_of_week_patterns: [
        { day: 0, avg_roas: 0.9, avg_spend: 28, performance_index: 0.82 },
        { day: 1, avg_roas: 1.25, avg_spend: 38, performance_index: 1.14 },
        { day: 2, avg_roas: 1.2, avg_spend: 36, performance_index: 1.09 },
        { day: 3, avg_roas: 1.1, avg_spend: 33, performance_index: 1.0 },
        { day: 4, avg_roas: 1.15, avg_spend: 35, performance_index: 1.05 },
        { day: 5, avg_roas: 1.0, avg_spend: 30, performance_index: 0.91 },
        { day: 6, avg_roas: 0.95, avg_spend: 30, performance_index: 0.86 },
      ],
    },
  ];

  // Generate forecast
  const forecast = generateBudgetForecast(demoTrends, 5000, daysInMonth, dayOfMonth);

  // Calculate optimal distribution
  const optimalDistribution: Record<string, number> = {
    demo_1: 1250,
    demo_2: 680,
    demo_3: 520,
    demo_4: 350,
    demo_5: 200,
  };

  return {
    recommendations: [
      {
        campaign_id: 'demo_1',
        campaign_name: 'Summer Sale - Lookalike',
        platform: 'facebook',
        current_spend: 850,
        recommended_spend: 1100,
        change_amount: 250,
        change_percent: 29.4,
        reason: 'ROAS trending up 17% (3.5x → 4.2x). AI predicts 4.5x ROAS next week. Scale now to capture peak performance.',
        expected_roas: 3.99,
        confidence: 'high'
      },
      {
        campaign_id: 'demo_2',
        campaign_name: 'Brand Awareness',
        platform: 'google',
        current_spend: 420,
        recommended_spend: 530,
        change_amount: 110,
        change_percent: 26.2,
        reason: 'Stable 3.1x ROAS with strong Tue-Thu performance. Increase budget on peak days for optimal efficiency.',
        expected_roas: 2.95,
        confidence: 'high'
      },
      {
        campaign_id: 'demo_3',
        campaign_name: 'Retargeting - Cart Abandoners',
        platform: 'facebook',
        current_spend: 320,
        recommended_spend: 400,
        change_amount: 80,
        change_percent: 25.0,
        reason: 'Improving trend with 5.5x ROAS predicted. High-intent audience showing strong conversion rate growth.',
        expected_roas: 5.2,
        confidence: 'medium'
      },
      {
        campaign_id: 'demo_4',
        campaign_name: 'Cold Traffic - Interest',
        platform: 'facebook',
        current_spend: 680,
        recommended_spend: 476,
        change_amount: -204,
        change_percent: -30.0,
        reason: 'ROAS declining 56% over 30 days (1.8x → 0.8x). Creative fatigue detected. Reduce spend and refresh creatives.',
        expected_roas: 0.8,
        confidence: 'high'
      },
      {
        campaign_id: 'demo_5',
        campaign_name: 'Display - GDN',
        platform: 'google',
        current_spend: 230,
        recommended_spend: 161,
        change_amount: -69,
        change_percent: -30.0,
        reason: 'Declining ROAS trend predicts sub-1x returns next week. Reallocate to better performers.',
        expected_roas: 1.1,
        confidence: 'medium'
      }
    ],
    summary: {
      current_total_spend: 2500,
      optimized_total_spend: 2667,
      current_roas: 2.45,
      projected_roas: 2.82,
      projected_revenue_increase: 925,
      reallocation_percentage: 10.9
    },
    predictions: {
      trends: demoTrends,
      forecast,
      optimal_distribution: optimalDistribution,
    },
    insights: [
      '📈 3 campaigns trending up, 2 declining. Reallocate $273 to high performers.',
      '📅 Best days: Tue-Thu consistently outperform weekends by 15-20%.',
      '⚠️ "Cold Traffic - Interest" showing creative fatigue - CTR down 25% in 14 days.',
      '🎯 AI predicts 2.82x blended ROAS next week with recommended changes.',
      `💰 Budget pacing: ${forecast.pacing.on_pace ? 'On track' : 'Behind pace'} - ${forecast.pacing.budget_utilization.toFixed(0)}% of monthly budget used.`
    ],
    generated_at: new Date().toISOString()
  };
}

/**
 * Calculate efficiency score for a campaign
 * Higher score = better candidate for budget increase
 */
function calculateEfficiencyScore(
  roas: number,
  spend: number,
  orders: number,
  avgRoas: number
): number {
  // Base score from ROAS performance vs average
  let score = 50;

  if (roas > avgRoas * 2) score += 30;
  else if (roas > avgRoas * 1.5) score += 20;
  else if (roas > avgRoas) score += 10;
  else if (roas < avgRoas * 0.5) score -= 30;
  else if (roas < avgRoas * 0.75) score -= 15;

  // Bonus for proven converters
  if (orders >= 10) score += 10;
  else if (orders >= 5) score += 5;
  else if (orders === 0) score -= 20;

  // Statistical confidence bonus for higher spend
  if (spend >= 500) score += 10;
  else if (spend >= 100) score += 5;
  else if (spend < 20) score -= 10; // Low confidence

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate budget optimization recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const gate = await requireProFeature(storeId, 'predictiveBudget');
    if (gate) return gate;

    // Return demo data for Adam's store
    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json(generateDemoBudgetOptimization());
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch recent campaign data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: campaigns, error } = await supabase
      .from('adwyse_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .gte('last_sync_at', thirtyDaysAgo.toISOString())
      .order('spend', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        recommendations: [],
        summary: {
          current_total_spend: 0,
          optimized_total_spend: 0,
          current_roas: 0,
          projected_roas: 0,
          projected_revenue_increase: 0,
          reallocation_percentage: 0,
        },
        insights: ['No active campaigns found. Connect your ad platforms to get budget recommendations.'],
        generated_at: new Date().toISOString(),
      });
    }

    // Calculate performance metrics for each campaign
    const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (parseFloat(c.attributed_revenue) || 0), 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const campaignPerformance: CampaignPerformance[] = campaigns.map(c => {
      const spend = parseFloat(c.spend) || 0;
      const revenue = parseFloat(c.attributed_revenue) || 0;
      const orders = parseInt(c.attributed_orders) || 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const cpa = orders > 0 ? spend / orders : spend;

      return {
        id: c.id,
        campaign_name: c.campaign_name,
        platform: c.platform || 'unknown',
        spend,
        revenue,
        roas,
        orders,
        cpa,
        efficiency_score: calculateEfficiencyScore(roas, spend, orders, avgRoas),
      };
    });

    // Sort by efficiency score
    campaignPerformance.sort((a, b) => b.efficiency_score - a.efficiency_score);

    // Generate recommendations
    const recommendations: BudgetRecommendation[] = [];
    let budgetToReallocate = 0;

    // Identify campaigns to reduce budget (inefficient ones)
    const inefficientCampaigns = campaignPerformance.filter(
      c => c.efficiency_score < 40 && c.spend > 20
    );

    for (const campaign of inefficientCampaigns) {
      // Reduce budget by 30-50% based on severity
      const reductionPercent = campaign.efficiency_score < 20 ? 0.5 : 0.3;
      const reduction = campaign.spend * reductionPercent;
      budgetToReallocate += reduction;

      let reason = '';
      if (campaign.roas < 0.5) {
        reason = `ROAS of ${campaign.roas.toFixed(2)}x is significantly below breakeven. Consider pausing or reducing budget.`;
      } else if (campaign.roas < 1) {
        reason = `ROAS of ${campaign.roas.toFixed(2)}x is below breakeven. Reduce budget and test new creatives.`;
      } else if (campaign.orders === 0) {
        reason = `No conversions yet with $${campaign.spend.toFixed(2)} spent. Reduce budget or improve targeting.`;
      } else {
        reason = `Underperforming compared to other campaigns. Reallocate budget to better performers.`;
      }

      recommendations.push({
        campaign_id: campaign.id,
        campaign_name: campaign.campaign_name,
        platform: campaign.platform,
        current_spend: campaign.spend,
        recommended_spend: campaign.spend - reduction,
        change_amount: -reduction,
        change_percent: -reductionPercent * 100,
        reason,
        expected_roas: campaign.roas,
        confidence: campaign.spend > 100 ? 'high' : 'medium',
      });
    }

    // Identify campaigns to increase budget (efficient ones)
    const efficientCampaigns = campaignPerformance.filter(
      c => c.efficiency_score >= 70 && c.roas > avgRoas
    );

    // Distribute reallocated budget among top performers
    const budgetPerTopCampaign = efficientCampaigns.length > 0
      ? budgetToReallocate / efficientCampaigns.length
      : 0;

    for (const campaign of efficientCampaigns) {
      // Cap increase at 30% of current spend to avoid over-scaling
      const maxIncrease = campaign.spend * 0.3;
      const increase = Math.min(budgetPerTopCampaign, maxIncrease);

      if (increase < 5) continue; // Skip tiny increases

      let reason = '';
      if (campaign.roas > 3) {
        reason = `Excellent ROAS of ${campaign.roas.toFixed(2)}x. Strong candidate for scaling with increased budget.`;
      } else if (campaign.roas > 2) {
        reason = `Strong ROAS of ${campaign.roas.toFixed(2)}x and proven conversions. Increase budget to capture more revenue.`;
      } else {
        reason = `Above-average performance with room for growth. Gradually increase budget while monitoring.`;
      }

      recommendations.push({
        campaign_id: campaign.id,
        campaign_name: campaign.campaign_name,
        platform: campaign.platform,
        current_spend: campaign.spend,
        recommended_spend: campaign.spend + increase,
        change_amount: increase,
        change_percent: (increase / campaign.spend) * 100,
        reason,
        expected_roas: campaign.roas * 0.95, // Slight decrease expected with scaling
        confidence: campaign.orders >= 5 ? 'high' : 'medium',
      });
    }

    // Calculate projected impact
    const currentTotalSpend = totalSpend;
    const projectedROAS = calculateProjectedROAS(campaignPerformance, recommendations, avgRoas);
    const projectedRevenueIncrease = (projectedROAS - avgRoas) * totalSpend;

    // Sort recommendations: increases first, then decreases
    recommendations.sort((a, b) => b.change_amount - a.change_amount);

    // Fetch daily performance data for predictions
    let predictions: BudgetOptimizationResult['predictions'] = undefined;

    try {
      const { data: dailyData } = await supabase
        .from('campaign_daily_stats')
        .select('campaign_id, date, spend, revenue, clicks, impressions, conversions')
        .eq('store_id', storeId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (dailyData && dailyData.length > 0) {
        // Group daily data by campaign
        const campaignDailyData = new Map<string, DailyPerformance[]>();
        for (const row of dailyData) {
          const existing = campaignDailyData.get(row.campaign_id) || [];
          existing.push({
            date: row.date,
            spend: parseFloat(row.spend) || 0,
            revenue: parseFloat(row.revenue) || 0,
            clicks: parseInt(row.clicks) || 0,
            impressions: parseInt(row.impressions) || 0,
            conversions: parseInt(row.conversions) || 0,
          });
          campaignDailyData.set(row.campaign_id, existing);
        }

        // Generate trends for each campaign
        const trends: CampaignTrend[] = [];
        for (const campaign of campaigns) {
          const daily = campaignDailyData.get(campaign.id);
          if (daily && daily.length >= 7) {
            const trend = analyzeCampaignTrends(
              campaign.id,
              campaign.campaign_name,
              campaign.platform || 'unknown',
              daily
            );
            trends.push(trend);
          }
        }

        if (trends.length > 0) {
          // Generate forecast
          const now = new Date();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const dayOfMonth = now.getDate();

          // Estimate monthly budget from current spend
          const estimatedMonthlyBudget = totalSpend * (daysInMonth / dayOfMonth);

          const forecast = generateBudgetForecast(
            trends,
            estimatedMonthlyBudget,
            daysInMonth,
            dayOfMonth
          );

          // Calculate optimal distribution
          const optimalDistMap = calculateOptimalDistribution(trends, totalSpend);
          const optimal_distribution: Record<string, number> = {};
          optimalDistMap.forEach((value, key) => {
            optimal_distribution[key] = value;
          });

          predictions = {
            trends,
            forecast,
            optimal_distribution,
          };
        }
      }
    } catch (predictionError) {
      console.error('Error generating predictions:', predictionError);
      // Continue without predictions
    }

    // Generate insights with prediction data
    const insights = generateBudgetInsights(campaignPerformance, recommendations, {
      avgRoas,
      totalSpend,
      totalRevenue,
    }, predictions);

    const result: BudgetOptimizationResult = {
      recommendations,
      summary: {
        current_total_spend: currentTotalSpend,
        optimized_total_spend: currentTotalSpend, // Budget-neutral optimization
        current_roas: avgRoas,
        projected_roas: projectedROAS,
        projected_revenue_increase: projectedRevenueIncrease,
        reallocation_percentage: (budgetToReallocate / currentTotalSpend) * 100,
      },
      predictions,
      insights,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating budget optimization:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget optimization' },
      { status: 500 }
    );
  }
}

/**
 * Calculate projected ROAS after applying recommendations
 */
function calculateProjectedROAS(
  campaigns: CampaignPerformance[],
  recommendations: BudgetRecommendation[],
  currentAvgRoas: number
): number {
  const recommendationMap = new Map(
    recommendations.map(r => [r.campaign_id, r])
  );

  let projectedSpend = 0;
  let projectedRevenue = 0;

  for (const campaign of campaigns) {
    const rec = recommendationMap.get(campaign.id);
    const newSpend = rec ? rec.recommended_spend : campaign.spend;

    // Estimate revenue based on campaign's historical ROAS
    // Apply diminishing returns for budget increases
    let effectiveRoas = campaign.roas;
    if (rec && rec.change_amount > 0) {
      // Scaling penalty: each 10% budget increase reduces ROAS by ~3%
      const scaleFactor = 1 - (rec.change_percent / 100) * 0.3;
      effectiveRoas = campaign.roas * Math.max(0.7, scaleFactor);
    }

    projectedSpend += newSpend;
    projectedRevenue += newSpend * effectiveRoas;
  }

  return projectedSpend > 0 ? projectedRevenue / projectedSpend : currentAvgRoas;
}

/**
 * Generate human-readable insights
 */
function generateBudgetInsights(
  campaigns: CampaignPerformance[],
  recommendations: BudgetRecommendation[],
  metrics: { avgRoas: number; totalSpend: number; totalRevenue: number },
  predictions?: BudgetOptimizationResult['predictions']
): string[] {
  const insights: string[] = [];

  const increases = recommendations.filter(r => r.change_amount > 0);
  const decreases = recommendations.filter(r => r.change_amount < 0);
  const totalReallocation = decreases.reduce((sum, r) => sum + Math.abs(r.change_amount), 0);

  // Prediction-based insights first
  if (predictions?.trends) {
    const improving = predictions.trends.filter(t => t.trend_direction === 'improving').length;
    const declining = predictions.trends.filter(t => t.trend_direction === 'declining').length;

    if (improving > 0 || declining > 0) {
      insights.push(
        `📈 ${improving} campaign${improving !== 1 ? 's' : ''} trending up, ${declining} declining. ${increases.length > 0 ? `Reallocate $${totalReallocation.toFixed(0)} to high performers.` : ''}`
      );
    }

    // Day of week analysis
    const allDowPatterns = predictions.trends.flatMap(t => t.day_of_week_patterns);
    const dayPerformance = new Map<number, { total: number; count: number }>();
    for (const pattern of allDowPatterns) {
      const existing = dayPerformance.get(pattern.day) || { total: 0, count: 0 };
      existing.total += pattern.performance_index;
      existing.count++;
      dayPerformance.set(pattern.day, existing);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayScores = Array.from(dayPerformance.entries())
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg);

    const bestDays = dayScores.filter(d => d.avg > 1.05).slice(0, 3);
    const worstDays = dayScores.filter(d => d.avg < 0.95).slice(-2);

    if (bestDays.length > 0) {
      const bestDayNames = bestDays.map(d => dayNames[d.day]).join('-');
      const improvement = ((bestDays[0].avg - 1) * 100).toFixed(0);
      insights.push(`📅 Best days: ${bestDayNames} outperform average by ${improvement}%.`);
    }

    // Fatigue detection
    const fatiguedCampaigns = predictions.trends.filter(
      t => t.trend_direction === 'declining' && t.roas_30d > t.roas_7d * 1.5
    );
    if (fatiguedCampaigns.length > 0) {
      const campaign = fatiguedCampaigns[0];
      const decline = ((1 - campaign.roas_7d / campaign.roas_30d) * 100).toFixed(0);
      insights.push(`⚠️ "${campaign.campaign_name}" showing creative fatigue - ROAS down ${decline}% in 30 days.`);
    }

    // Prediction-based ROAS forecast
    if (predictions.forecast) {
      const predictedRoas = predictions.forecast.weekly_forecast.predicted_roas;
      if (predictedRoas > 0) {
        insights.push(`🎯 AI predicts ${predictedRoas.toFixed(2)}x blended ROAS next week with recommended changes.`);
      }

      // Budget pacing
      const pacing = predictions.forecast.pacing;
      if (pacing.days_remaining > 0) {
        const status = pacing.on_pace ? 'On track' : pacing.current_daily_spend > pacing.recommended_daily_spend ? 'Overspending' : 'Underspending';
        insights.push(`💰 Budget pacing: ${status} - ${pacing.budget_utilization.toFixed(0)}% of monthly budget used with ${pacing.days_remaining} days left.`);
      }
    }
  } else {
    // Fallback to basic insights without predictions
    if (increases.length > 0 && decreases.length > 0) {
      insights.push(
        `Reallocate $${totalReallocation.toFixed(2)} from ${decreases.length} underperforming campaign${decreases.length > 1 ? 's' : ''} to ${increases.length} high-performing campaign${increases.length > 1 ? 's' : ''}.`
      );
    }
  }

  // Platform-specific insights
  const platformSpend = new Map<string, { spend: number; revenue: number }>();
  for (const campaign of campaigns) {
    const platform = campaign.platform;
    const current = platformSpend.get(platform) || { spend: 0, revenue: 0 };
    current.spend += campaign.spend;
    current.revenue += campaign.revenue;
    platformSpend.set(platform, current);
  }

  const platformRoas = Array.from(platformSpend.entries()).map(([platform, data]) => ({
    platform,
    roas: data.spend > 0 ? data.revenue / data.spend : 0,
    spend: data.spend,
  }));

  platformRoas.sort((a, b) => b.roas - a.roas);

  if (platformRoas.length > 1 && platformRoas[0].roas > platformRoas[platformRoas.length - 1].roas * 1.5) {
    const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    insights.push(
      `${capitalizeFirst(platformRoas[0].platform)} is outperforming ${platformRoas[platformRoas.length - 1].platform} by ${((platformRoas[0].roas / platformRoas[platformRoas.length - 1].roas) * 100 - 100).toFixed(0)}%.`
    );
  }

  // Warning for low overall ROAS
  if (metrics.avgRoas < 1.5 && metrics.totalSpend > 200) {
    insights.push(
      `⚠️ Overall ROAS of ${metrics.avgRoas.toFixed(2)}x may not be profitable after COGS.`
    );
  }

  // Quick win identification
  const quickWins = campaigns.filter(c => c.roas > 2 && c.spend < 100);
  if (quickWins.length > 0 && insights.length < 5) {
    insights.push(
      `💡 ${quickWins.length} low-spend campaign${quickWins.length > 1 ? 's' : ''} showing strong ROAS. Test scaling with incremental increases.`
    );
  }

  return insights.slice(0, 5); // Max 5 insights
}
