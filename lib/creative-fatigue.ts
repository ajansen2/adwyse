/**
 * Creative Fatigue Detection
 * Analyzes ad creative performance over time to detect declining performance
 */

interface CreativePerformance {
  creativeId: string;
  creativeName: string;
  platform: string;
  periods: {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
}

interface FatigueAnalysis {
  creativeId: string;
  creativeName: string;
  platform: string;
  isFatigued: boolean;
  fatigueScore: number;  // 0-100, higher = more fatigued
  indicators: {
    ctrDecline: number;  // Percentage decline
    cpaIncrease: number;
    roasDecline: number;
    frequencyIncrease: number;
  };
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  daysActive: number;
  peakRoas: number;
  currentRoas: number;
}

/**
 * Analyze a creative for fatigue indicators
 */
export function analyzeCreativeFatigue(creative: CreativePerformance): FatigueAnalysis {
  const periods = creative.periods.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (periods.length < 3) {
    return {
      creativeId: creative.creativeId,
      creativeName: creative.creativeName,
      platform: creative.platform,
      isFatigued: false,
      fatigueScore: 0,
      indicators: { ctrDecline: 0, cpaIncrease: 0, roasDecline: 0, frequencyIncrease: 0 },
      recommendation: 'Not enough data to analyze fatigue (need at least 3 periods)',
      severity: 'low',
      daysActive: periods.length,
      peakRoas: 0,
      currentRoas: 0
    };
  }

  // Split into first half and second half
  const midpoint = Math.floor(periods.length / 2);
  const firstHalf = periods.slice(0, midpoint);
  const secondHalf = periods.slice(midpoint);

  // Calculate metrics for each half
  const firstMetrics = calculatePeriodMetrics(firstHalf);
  const secondMetrics = calculatePeriodMetrics(secondHalf);

  // Calculate decline indicators
  const ctrDecline = firstMetrics.ctr > 0
    ? ((firstMetrics.ctr - secondMetrics.ctr) / firstMetrics.ctr) * 100
    : 0;

  const cpaIncrease = firstMetrics.cpa > 0
    ? ((secondMetrics.cpa - firstMetrics.cpa) / firstMetrics.cpa) * 100
    : 0;

  const roasDecline = firstMetrics.roas > 0
    ? ((firstMetrics.roas - secondMetrics.roas) / firstMetrics.roas) * 100
    : 0;

  // Calculate fatigue score (weighted average of indicators)
  const fatigueScore = Math.min(100, Math.max(0,
    (Math.max(0, ctrDecline) * 0.25) +
    (Math.max(0, cpaIncrease) * 0.30) +
    (Math.max(0, roasDecline) * 0.45)
  ));

  // Determine if fatigued (score > 25 and ROAS declining more than 20%)
  const isFatigued = fatigueScore > 25 && roasDecline > 20;

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (fatigueScore >= 70) severity = 'critical';
  else if (fatigueScore >= 50) severity = 'high';
  else if (fatigueScore >= 30) severity = 'medium';

  // Generate recommendation
  let recommendation = '';
  if (!isFatigued) {
    recommendation = 'Creative is performing well. Continue monitoring.';
  } else if (severity === 'critical') {
    recommendation = 'URGENT: Replace this creative immediately. Performance has dropped significantly.';
  } else if (severity === 'high') {
    recommendation = 'Consider pausing this creative and testing new variations.';
  } else if (severity === 'medium') {
    recommendation = 'Performance declining. Start preparing replacement creatives.';
  } else {
    recommendation = 'Minor fatigue detected. Monitor closely over the next few days.';
  }

  // Find peak ROAS
  const roasValues = periods.map(p => p.spend > 0 ? p.revenue / p.spend : 0);
  const peakRoas = Math.max(...roasValues);
  const currentRoas = secondMetrics.roas;

  return {
    creativeId: creative.creativeId,
    creativeName: creative.creativeName,
    platform: creative.platform,
    isFatigued,
    fatigueScore: Math.round(fatigueScore),
    indicators: {
      ctrDecline: Math.round(ctrDecline),
      cpaIncrease: Math.round(cpaIncrease),
      roasDecline: Math.round(roasDecline),
      frequencyIncrease: 0  // Would need frequency data
    },
    recommendation,
    severity,
    daysActive: periods.length,
    peakRoas: Math.round(peakRoas * 100) / 100,
    currentRoas: Math.round(currentRoas * 100) / 100
  };
}

function calculatePeriodMetrics(periods: CreativePerformance['periods']) {
  const totals = periods.reduce((acc, p) => ({
    spend: acc.spend + p.spend,
    impressions: acc.impressions + p.impressions,
    clicks: acc.clicks + p.clicks,
    conversions: acc.conversions + p.conversions,
    revenue: acc.revenue + p.revenue
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

  return {
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
  };
}

/**
 * Batch analyze multiple creatives
 */
export function analyzeAllCreatives(creatives: CreativePerformance[]): FatigueAnalysis[] {
  return creatives
    .map(analyzeCreativeFatigue)
    .sort((a, b) => b.fatigueScore - a.fatigueScore);  // Most fatigued first
}

/**
 * Get fatigued creatives that need attention
 */
export function getFatiguedCreatives(creatives: CreativePerformance[]): FatigueAnalysis[] {
  return analyzeAllCreatives(creatives).filter(c => c.isFatigued);
}

/**
 * Generate alert message for a fatigued creative
 */
export function generateFatigueAlertMessage(analysis: FatigueAnalysis): string {
  const platformEmoji = {
    facebook: '📘',
    google: '🔴',
    tiktok: '🎵'
  }[analysis.platform.toLowerCase()] || '📊';

  return `${platformEmoji} Creative Fatigue Alert: "${analysis.creativeName}"

Fatigue Score: ${analysis.fatigueScore}/100 (${analysis.severity.toUpperCase()})
ROAS: ${analysis.currentRoas}x (down from peak ${analysis.peakRoas}x)
Days Active: ${analysis.daysActive}

Key Indicators:
• CTR declined ${analysis.indicators.ctrDecline}%
• CPA increased ${analysis.indicators.cpaIncrease}%
• ROAS declined ${analysis.indicators.roasDecline}%

Recommendation: ${analysis.recommendation}`;
}

export type { CreativePerformance, FatigueAnalysis };
