/**
 * Predictive Budget Allocation Engine
 * Uses historical data to forecast performance and optimize budgets
 */

export interface DailyPerformance {
  date: string;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export interface CampaignTrend {
  campaign_id: string;
  campaign_name: string;
  platform: string;
  trend_direction: 'improving' | 'declining' | 'stable';
  trend_strength: number; // -1 to 1
  roas_7d: number;
  roas_14d: number;
  roas_30d: number;
  ctr_trend: number;
  conversion_rate_trend: number;
  predicted_roas_next_7d: number;
  confidence: number; // 0-100
  day_of_week_patterns: DayOfWeekPattern[];
}

export interface DayOfWeekPattern {
  day: number; // 0=Sunday, 6=Saturday
  avg_roas: number;
  avg_spend: number;
  performance_index: number; // Relative to average (1.0 = average)
}

export interface BudgetForecast {
  daily_predictions: DailyPrediction[];
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
    projected_monthly_spend: number;
    budget_utilization: number;
  };
  recommendations: PredictiveRecommendation[];
}

export interface DailyPrediction {
  date: string;
  predicted_spend: number;
  predicted_revenue: number;
  predicted_roas: number;
  confidence: number;
  day_of_week: number;
}

export interface PredictiveRecommendation {
  campaign_id: string;
  campaign_name: string;
  platform: string;
  recommendation_type: 'scale' | 'reduce' | 'pause' | 'monitor' | 'day_part';
  urgency: 'high' | 'medium' | 'low';
  current_spend: number;
  recommended_spend: number;
  predicted_impact: {
    revenue_change: number;
    roas_change: number;
  };
  reasoning: string;
  best_days: number[]; // Days of week with best performance
  confidence: number;
}

/**
 * Calculate linear regression for trend analysis
 */
function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = data[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
    ssTot += yDiff * yDiff;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R²
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (data[i] - predicted) ** 2;
  }
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

/**
 * Calculate exponential moving average
 */
function ema(data: number[], periods: number): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];

  const multiplier = 2 / (periods + 1);
  let emaValue = data[0];

  for (let i = 1; i < data.length; i++) {
    emaValue = (data[i] - emaValue) * multiplier + emaValue;
  }

  return emaValue;
}

/**
 * Analyze campaign trends from daily performance data
 */
export function analyzeCampaignTrends(
  campaignId: string,
  campaignName: string,
  platform: string,
  dailyData: DailyPerformance[]
): CampaignTrend {
  // Sort by date
  const sorted = [...dailyData].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate ROAS for different periods
  const calculatePeriodRoas = (days: number) => {
    const periodData = sorted.slice(-days);
    const spend = periodData.reduce((s, d) => s + d.spend, 0);
    const revenue = periodData.reduce((s, d) => s + d.revenue, 0);
    return spend > 0 ? revenue / spend : 0;
  };

  const roas7d = calculatePeriodRoas(7);
  const roas14d = calculatePeriodRoas(14);
  const roas30d = calculatePeriodRoas(30);

  // Calculate ROAS trend using linear regression on daily ROAS
  const dailyRoas = sorted
    .filter(d => d.spend > 0)
    .map(d => d.revenue / d.spend);

  const roasTrend = linearRegression(dailyRoas);

  // Determine trend direction
  let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
  let trendStrength = 0;

  if (Math.abs(roasTrend.slope) > 0.01 && roasTrend.r2 > 0.3) {
    trendDirection = roasTrend.slope > 0 ? 'improving' : 'declining';
    trendStrength = Math.min(1, Math.abs(roasTrend.slope) * 10) * (roasTrend.slope > 0 ? 1 : -1);
  }

  // CTR trend
  const dailyCtr = sorted
    .filter(d => d.impressions > 0)
    .map(d => (d.clicks / d.impressions) * 100);
  const ctrTrend = linearRegression(dailyCtr);

  // Conversion rate trend
  const dailyCvr = sorted
    .filter(d => d.clicks > 0)
    .map(d => (d.conversions / d.clicks) * 100);
  const cvrTrend = linearRegression(dailyCvr);

  // Day of week patterns
  const dayOfWeekData: Map<number, { spend: number; revenue: number; count: number }> = new Map();

  for (const day of sorted) {
    const dow = new Date(day.date).getDay();
    const existing = dayOfWeekData.get(dow) || { spend: 0, revenue: 0, count: 0 };
    existing.spend += day.spend;
    existing.revenue += day.revenue;
    existing.count++;
    dayOfWeekData.set(dow, existing);
  }

  const avgRoasOverall = sorted.reduce((s, d) => s + d.revenue, 0) /
                         Math.max(1, sorted.reduce((s, d) => s + d.spend, 0));

  const dayOfWeekPatterns: DayOfWeekPattern[] = [];
  for (let dow = 0; dow <= 6; dow++) {
    const data = dayOfWeekData.get(dow);
    if (data && data.spend > 0 && data.count > 0) {
      const avgRoas = data.revenue / data.spend;
      dayOfWeekPatterns.push({
        day: dow,
        avg_roas: avgRoas,
        avg_spend: data.spend / data.count,
        performance_index: avgRoasOverall > 0 ? avgRoas / avgRoasOverall : 1,
      });
    } else {
      dayOfWeekPatterns.push({
        day: dow,
        avg_roas: 0,
        avg_spend: 0,
        performance_index: 1,
      });
    }
  }

  // Predict ROAS for next 7 days using EMA and trend
  const recentRoas = dailyRoas.slice(-7);
  const emaRoas = ema(recentRoas, 7);
  const trendAdjustment = roasTrend.slope * 7; // 7 days of trend
  const predictedRoas = Math.max(0, emaRoas + trendAdjustment * 0.5); // Dampen trend

  // Calculate confidence based on data quality
  let confidence = 50;
  confidence += Math.min(25, sorted.length * 2); // More data = more confidence
  confidence += Math.min(15, roasTrend.r2 * 30); // Better fit = more confidence
  if (sorted.reduce((s, d) => s + d.conversions, 0) > 10) confidence += 10;
  confidence = Math.min(95, Math.max(20, confidence));

  return {
    campaign_id: campaignId,
    campaign_name: campaignName,
    platform,
    trend_direction: trendDirection,
    trend_strength: trendStrength,
    roas_7d: roas7d,
    roas_14d: roas14d,
    roas_30d: roas30d,
    ctr_trend: ctrTrend.slope,
    conversion_rate_trend: cvrTrend.slope,
    predicted_roas_next_7d: predictedRoas,
    confidence,
    day_of_week_patterns: dayOfWeekPatterns,
  };
}

/**
 * Generate budget forecast
 */
export function generateBudgetForecast(
  trends: CampaignTrend[],
  monthlyBudget: number,
  daysInMonth: number,
  daysElapsed: number
): BudgetForecast {
  const daysRemaining = daysInMonth - daysElapsed;

  // Calculate current metrics
  const totalCurrentSpend = trends.reduce((s, t) => {
    const avgDailySpend = t.day_of_week_patterns.reduce((sum, p) => sum + p.avg_spend, 0) / 7;
    return s + avgDailySpend;
  }, 0);

  // Recommended daily spend to hit budget
  const spentSoFar = totalCurrentSpend * daysElapsed;
  const remainingBudget = monthlyBudget - spentSoFar;
  const recommendedDailySpend = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  // Generate daily predictions for next 7 days
  const dailyPredictions: DailyPrediction[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const predDate = new Date(today);
    predDate.setDate(predDate.getDate() + i);
    const dow = predDate.getDay();

    let predictedSpend = 0;
    let predictedRevenue = 0;
    let totalConfidence = 0;

    for (const trend of trends) {
      const dowPattern = trend.day_of_week_patterns.find(p => p.day === dow);
      const avgDailySpend = trend.day_of_week_patterns.reduce((sum, p) => sum + p.avg_spend, 0) / 7;

      // Adjust spend based on day-of-week pattern
      const daySpend = avgDailySpend * (dowPattern?.performance_index || 1);
      const dayRevenue = daySpend * trend.predicted_roas_next_7d;

      predictedSpend += daySpend;
      predictedRevenue += dayRevenue;
      totalConfidence += trend.confidence;
    }

    dailyPredictions.push({
      date: predDate.toISOString().split('T')[0],
      predicted_spend: predictedSpend,
      predicted_revenue: predictedRevenue,
      predicted_roas: predictedSpend > 0 ? predictedRevenue / predictedSpend : 0,
      confidence: trends.length > 0 ? totalConfidence / trends.length : 50,
      day_of_week: dow,
    });
  }

  // Weekly forecast
  const weeklySpend = dailyPredictions.reduce((s, p) => s + p.predicted_spend, 0);
  const weeklyRevenue = dailyPredictions.reduce((s, p) => s + p.predicted_revenue, 0);
  const avgConfidence = dailyPredictions.reduce((s, p) => s + p.confidence, 0) / 7;

  // Confidence interval (±20% at 50% confidence, ±5% at 95% confidence)
  const intervalWidth = 0.25 - (avgConfidence / 100) * 0.2;
  const predictedWeeklyRoas = weeklySpend > 0 ? weeklyRevenue / weeklySpend : 0;

  // Generate recommendations
  const recommendations = generatePredictiveRecommendations(trends);

  return {
    daily_predictions: dailyPredictions,
    weekly_forecast: {
      predicted_spend: weeklySpend,
      predicted_revenue: weeklyRevenue,
      predicted_roas: predictedWeeklyRoas,
      confidence_interval: {
        low: predictedWeeklyRoas * (1 - intervalWidth),
        high: predictedWeeklyRoas * (1 + intervalWidth),
      },
    },
    pacing: {
      current_daily_spend: totalCurrentSpend,
      recommended_daily_spend: recommendedDailySpend,
      on_pace: Math.abs(totalCurrentSpend - recommendedDailySpend) / recommendedDailySpend < 0.1,
      days_remaining: daysRemaining,
      projected_monthly_spend: spentSoFar + totalCurrentSpend * daysRemaining,
      budget_utilization: monthlyBudget > 0 ? (spentSoFar / monthlyBudget) * 100 : 0,
    },
    recommendations,
  };
}

/**
 * Generate predictive recommendations
 */
function generatePredictiveRecommendations(trends: CampaignTrend[]): PredictiveRecommendation[] {
  const recommendations: PredictiveRecommendation[] = [];

  for (const trend of trends) {
    const avgDailySpend = trend.day_of_week_patterns.reduce((sum, p) => sum + p.avg_spend, 0) / 7;

    // Find best performing days
    const bestDays = trend.day_of_week_patterns
      .filter(p => p.performance_index > 1.1)
      .sort((a, b) => b.performance_index - a.performance_index)
      .map(p => p.day);

    // Determine recommendation type
    let recommendationType: PredictiveRecommendation['recommendation_type'] = 'monitor';
    let urgency: PredictiveRecommendation['urgency'] = 'low';
    let recommendedSpend = avgDailySpend;
    let reasoning = '';

    if (trend.trend_direction === 'improving' && trend.predicted_roas_next_7d > 2.0) {
      recommendationType = 'scale';
      urgency = trend.trend_strength > 0.5 ? 'high' : 'medium';
      recommendedSpend = avgDailySpend * 1.25; // 25% increase
      reasoning = `ROAS trending upward (${trend.roas_7d.toFixed(2)}x → ${trend.predicted_roas_next_7d.toFixed(2)}x predicted). Strong candidate for scaling.`;
    } else if (trend.trend_direction === 'declining' && trend.roas_7d < 1.5) {
      recommendationType = trend.roas_7d < 0.8 ? 'pause' : 'reduce';
      urgency = trend.roas_7d < 0.8 ? 'high' : 'medium';
      recommendedSpend = trend.roas_7d < 0.8 ? 0 : avgDailySpend * 0.5;
      reasoning = `ROAS declining and below profitability threshold. ${recommendationType === 'pause' ? 'Pause to prevent losses.' : 'Reduce spend while testing new creatives.'}`;
    } else if (bestDays.length >= 2) {
      recommendationType = 'day_part';
      urgency = 'medium';
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      reasoning = `Strong performance on ${bestDays.map(d => dayNames[d]).join(', ')}. Consider increasing budget on these days.`;
    } else if (trend.trend_direction === 'stable' && trend.roas_7d > 2.0) {
      recommendationType = 'scale';
      urgency = 'low';
      recommendedSpend = avgDailySpend * 1.1;
      reasoning = `Stable performance with good ROAS. Test incremental budget increases.`;
    }

    // Calculate predicted impact
    const revenueChange = (recommendedSpend - avgDailySpend) * trend.predicted_roas_next_7d * 7;
    const roasChange = 0; // ROAS expected to stay similar with recommended changes

    recommendations.push({
      campaign_id: trend.campaign_id,
      campaign_name: trend.campaign_name,
      platform: trend.platform,
      recommendation_type: recommendationType,
      urgency,
      current_spend: avgDailySpend,
      recommended_spend: recommendedSpend,
      predicted_impact: {
        revenue_change: revenueChange,
        roas_change: roasChange,
      },
      reasoning,
      best_days: bestDays,
      confidence: trend.confidence,
    });
  }

  // Sort by urgency and impact
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return Math.abs(b.predicted_impact.revenue_change) - Math.abs(a.predicted_impact.revenue_change);
  });

  return recommendations;
}

/**
 * Calculate optimal budget distribution across campaigns
 */
export function calculateOptimalDistribution(
  trends: CampaignTrend[],
  totalBudget: number
): Map<string, number> {
  const distribution = new Map<string, number>();

  // Score each campaign
  const scores = trends.map(trend => {
    let score = 50;

    // Predicted ROAS weight (40%)
    score += Math.min(30, trend.predicted_roas_next_7d * 10);

    // Trend direction weight (20%)
    if (trend.trend_direction === 'improving') score += 15;
    else if (trend.trend_direction === 'declining') score -= 15;

    // Confidence weight (10%)
    score += (trend.confidence / 100) * 10;

    // Recent performance weight (30%)
    if (trend.roas_7d > 3) score += 20;
    else if (trend.roas_7d > 2) score += 10;
    else if (trend.roas_7d < 1) score -= 20;

    return { campaign_id: trend.campaign_id, score: Math.max(0, score) };
  });

  const totalScore = scores.reduce((s, c) => s + c.score, 0);

  for (const { campaign_id, score } of scores) {
    const allocation = totalScore > 0 ? (score / totalScore) * totalBudget : totalBudget / scores.length;
    distribution.set(campaign_id, allocation);
  }

  return distribution;
}
