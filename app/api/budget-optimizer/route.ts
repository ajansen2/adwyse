import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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
  insights: string[];
  generated_at: string;
}

/**
 * Generate demo budget optimization data for Adam's store
 */
function generateDemoBudgetOptimization(): BudgetOptimizationResult {
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
        reason: 'Excellent ROAS of 4.2x. Strong candidate for scaling with increased budget.',
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
        reason: 'Strong ROAS of 3.1x and proven conversions. Increase budget to capture more revenue.',
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
        reason: 'Above-average performance with room for growth. Gradually increase budget while monitoring.',
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
        reason: 'ROAS of 0.8x is below breakeven. Reduce budget and test new creatives.',
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
        reason: 'Underperforming compared to other campaigns. Reallocate budget to better performers.',
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
    insights: [
      'Reallocate $273 from 2 underperforming campaigns to 3 high-performing campaigns.',
      'Facebook is outperforming Google by 38%. Consider shifting more budget to Facebook.',
      '"Summer Sale - Lookalike" is your top performer with 4.2x ROAS. This campaign should be prioritized for budget increases.',
      '2 campaigns show strong early performance. Test scaling these with incremental budget increases.'
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

    // Generate insights
    const insights = generateBudgetInsights(campaignPerformance, recommendations, {
      avgRoas,
      totalSpend,
      totalRevenue,
    });

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
  metrics: { avgRoas: number; totalSpend: number; totalRevenue: number }
): string[] {
  const insights: string[] = [];

  const increases = recommendations.filter(r => r.change_amount > 0);
  const decreases = recommendations.filter(r => r.change_amount < 0);
  const totalReallocation = decreases.reduce((sum, r) => sum + Math.abs(r.change_amount), 0);

  if (increases.length > 0 && decreases.length > 0) {
    insights.push(
      `Reallocate $${totalReallocation.toFixed(2)} from ${decreases.length} underperforming campaign${decreases.length > 1 ? 's' : ''} to ${increases.length} high-performing campaign${increases.length > 1 ? 's' : ''}.`
    );
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
    insights.push(
      `${platformRoas[0].platform} is outperforming ${platformRoas[platformRoas.length - 1].platform} by ${((platformRoas[0].roas / platformRoas[platformRoas.length - 1].roas) * 100 - 100).toFixed(0)}%. Consider shifting more budget to ${platformRoas[0].platform}.`
    );
  }

  // Top performer highlight
  const topCampaign = campaigns[0];
  if (topCampaign && topCampaign.roas > 2.5) {
    insights.push(
      `"${topCampaign.campaign_name}" is your top performer with ${topCampaign.roas.toFixed(2)}x ROAS. This campaign should be prioritized for budget increases.`
    );
  }

  // Warning for low overall ROAS
  if (metrics.avgRoas < 1.5 && metrics.totalSpend > 200) {
    insights.push(
      `Your overall ROAS of ${metrics.avgRoas.toFixed(2)}x may not be profitable after COGS. Focus on improving conversion rate or reducing spend on underperformers.`
    );
  }

  // Quick win identification
  const quickWins = campaigns.filter(c => c.roas > 2 && c.spend < 100);
  if (quickWins.length > 0) {
    insights.push(
      `${quickWins.length} campaign${quickWins.length > 1 ? 's' : ''} show${quickWins.length === 1 ? 's' : ''} strong early performance. Test scaling these with incremental budget increases.`
    );
  }

  return insights;
}
