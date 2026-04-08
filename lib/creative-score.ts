/**
 * Score ad creatives 0-100 based on percentile rank across multiple metrics.
 *
 * Score = weighted average of percentile ranks for:
 *   - ROAS (40%)
 *   - CTR (25%)
 *   - CVR (25%)
 *   - Spend volume (10%) — small bonus for proven creatives that have spent enough
 *
 * A score of 90+ = top 10% performer, 50 = median, sub-30 = bottom third.
 */

export interface CreativeMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ScoredCreative<T extends CreativeMetrics> {
  creative: T;
  score: number;
  rank: 'top' | 'good' | 'avg' | 'poor' | 'kill';
  ctr: number;
  cvr: number;
  roas: number;
  reason: string;
}

function percentileRank(values: number[], v: number): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  let count = 0;
  for (const x of sorted) {
    if (x < v) count++;
    else if (x === v) count += 0.5;
  }
  return Math.round((count / sorted.length) * 100);
}

function rankFromScore(score: number): 'top' | 'good' | 'avg' | 'poor' | 'kill' {
  if (score >= 80) return 'top';
  if (score >= 60) return 'good';
  if (score >= 40) return 'avg';
  if (score >= 20) return 'poor';
  return 'kill';
}

function reasonFromScore(
  score: number,
  ctr: number,
  cvr: number,
  roas: number,
  spend: number
): string {
  if (score >= 80) {
    return `Top performer — ${roas.toFixed(2)}x ROAS, ${(ctr * 100).toFixed(2)}% CTR. Scale this.`;
  }
  if (score >= 60) {
    return `Solid creative pulling ${roas.toFixed(2)}x. Increase budget.`;
  }
  if (score >= 40) {
    return `Average performer. Test variations to improve.`;
  }
  if (score >= 20) {
    if (ctr < 0.005) return `Low CTR (${(ctr * 100).toFixed(2)}%) — hook isn't grabbing attention.`;
    if (cvr < 0.005) return `Low CVR — landing page or offer isn't converting.`;
    return `Underperforming. Consider refreshing the creative.`;
  }
  if (spend < 50) return `Not enough data yet (only $${spend.toFixed(0)} spent).`;
  return `Killing performance — pause this creative immediately.`;
}

export function scoreCreatives<T extends CreativeMetrics>(
  creatives: T[]
): ScoredCreative<T>[] {
  if (creatives.length === 0) return [];

  // Compute derived metrics
  const enriched = creatives.map((c) => {
    const ctr = c.impressions > 0 ? c.clicks / c.impressions : 0;
    const cvr = c.clicks > 0 ? c.conversions / c.clicks : 0;
    const roas = c.spend > 0 ? c.revenue / c.spend : 0;
    return { creative: c, ctr, cvr, roas, spend: c.spend };
  });

  // Build percentile distributions
  const ctrs = enriched.map((e) => e.ctr);
  const cvrs = enriched.map((e) => e.cvr);
  const roases = enriched.map((e) => e.roas);
  const spends = enriched.map((e) => e.spend);

  return enriched
    .map((e) => {
      const ctrPct = percentileRank(ctrs, e.ctr);
      const cvrPct = percentileRank(cvrs, e.cvr);
      const roasPct = percentileRank(roases, e.roas);
      const spendPct = percentileRank(spends, e.spend);

      // Weighted score
      const score = Math.round(
        roasPct * 0.4 + ctrPct * 0.25 + cvrPct * 0.25 + spendPct * 0.1
      );

      const rank = rankFromScore(score);
      const reason = reasonFromScore(score, e.ctr, e.cvr, e.roas, e.spend);

      return {
        creative: e.creative,
        score,
        rank,
        ctr: e.ctr,
        cvr: e.cvr,
        roas: e.roas,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}
