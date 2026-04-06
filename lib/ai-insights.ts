/**
 * Enhanced AI Insights Engine
 * Generates structured, actionable insights using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Structured insight types
export type InsightCategory = 'opportunity' | 'warning' | 'recommendation';
export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightType =
  | 'creative_fatigue'
  | 'budget_pacing'
  | 'underperforming_campaign'
  | 'scaling_opportunity'
  | 'day_parting'
  | 'audience_opportunity'
  | 'cost_optimization'
  | 'roas_alert'
  | 'general';

export interface AIInsight {
  id?: string;
  category: InsightCategory;
  priority: InsightPriority;
  type: InsightType;
  title: string;
  description: string;
  action: {
    type: string;
    details: string;
    targetId?: string; // Campaign/ad ID if applicable
  };
  estimatedImpact: string;
  metrics?: Record<string, number>;
  createdAt?: string;
}

export interface InsightGenerationResult {
  insights: AIInsight[];
  summary: string;
  metrics: {
    totalSpend: number;
    totalRevenue: number;
    overallROAS: number;
    campaignCount: number;
  };
}

/**
 * Create Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Generate comprehensive AI insights for a store
 */
export async function generateInsights(
  storeId: string
): Promise<InsightGenerationResult> {
  const supabase = getSupabaseClient();

  // Gather data for analysis
  const [campaigns, orders, creatives, alerts] = await Promise.all([
    fetchCampaignData(supabase, storeId),
    fetchOrderData(supabase, storeId),
    fetchCreativeData(supabase, storeId),
    fetchExistingAlerts(supabase, storeId)
  ]);

  // Calculate aggregate metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (parseFloat(c.attributed_revenue) || 0), 0);
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Generate rule-based insights first
  const ruleBasedInsights = generateRuleBasedInsights(campaigns, creatives, {
    totalSpend,
    totalRevenue,
    overallROAS
  });

  // Generate AI insights using Claude
  const aiInsights = await generateClaudeInsights(campaigns, orders, creatives, {
    totalSpend,
    totalRevenue,
    overallROAS
  });

  // Combine and deduplicate insights
  const allInsights = deduplicateInsights([...ruleBasedInsights, ...aiInsights]);

  // Sort by priority
  allInsights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Save insights to database
  await saveInsights(supabase, storeId, allInsights);

  return {
    insights: allInsights,
    summary: generateSummary(allInsights, { totalSpend, totalRevenue, overallROAS }),
    metrics: {
      totalSpend,
      totalRevenue,
      overallROAS,
      campaignCount: campaigns.length
    }
  };
}

/**
 * Rule-based insight generation (fast, no API calls)
 */
function generateRuleBasedInsights(
  campaigns: any[],
  creatives: any[],
  metrics: { totalSpend: number; totalRevenue: number; overallROAS: number }
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Check for underperforming campaigns (ROAS < 1)
  for (const campaign of campaigns) {
    const spend = parseFloat(campaign.spend) || 0;
    const revenue = parseFloat(campaign.attributed_revenue) || 0;
    const roas = spend > 0 ? revenue / spend : 0;

    if (spend > 50 && roas < 1) {
      insights.push({
        category: 'warning',
        priority: roas < 0.5 ? 'high' : 'medium',
        type: 'underperforming_campaign',
        title: `Campaign "${campaign.campaign_name}" underperforming`,
        description: `This campaign has a ROAS of ${roas.toFixed(2)}x with $${spend.toFixed(2)} spent. Consider pausing or optimizing.`,
        action: {
          type: 'pause_or_optimize',
          details: `Review targeting and creatives for "${campaign.campaign_name}"`,
          targetId: campaign.id
        },
        estimatedImpact: `Save $${(spend * 0.5).toFixed(2)}/month by pausing`,
        metrics: { roas, spend, revenue }
      });
    }

    // Check for scaling opportunities (ROAS > 2.5)
    if (spend > 20 && roas > 2.5) {
      insights.push({
        category: 'opportunity',
        priority: 'high',
        type: 'scaling_opportunity',
        title: `Scale campaign "${campaign.campaign_name}"`,
        description: `This campaign has a strong ROAS of ${roas.toFixed(2)}x. Consider increasing budget to capture more conversions.`,
        action: {
          type: 'increase_budget',
          details: `Increase budget by 20-30% for "${campaign.campaign_name}"`,
          targetId: campaign.id
        },
        estimatedImpact: `Potential +$${(revenue * 0.25).toFixed(2)} additional revenue`,
        metrics: { roas, spend, revenue }
      });
    }
  }

  // Check for creative fatigue
  for (const creative of creatives) {
    if (creative.is_fatigued) {
      insights.push({
        category: 'warning',
        priority: 'medium',
        type: 'creative_fatigue',
        title: `Creative "${creative.ad_name}" showing fatigue`,
        description: `CTR has declined ${creative.ctr_decline_pct.toFixed(1)}% from initial performance. Consider refreshing or replacing this creative.`,
        action: {
          type: 'refresh_creative',
          details: `Create new variations of "${creative.ad_name}"`,
          targetId: creative.platform_ad_id
        },
        estimatedImpact: 'Restore CTR to previous levels',
        metrics: {
          startCtr: creative.start_ctr,
          currentCtr: creative.current_ctr,
          decline: creative.ctr_decline_pct
        }
      });
    }
  }

  // Budget pacing check
  const dailyBudgetEstimate = metrics.totalSpend / 30;
  if (dailyBudgetEstimate > 100) {
    // High spender - check pacing
    const spendVariance = calculateSpendVariance(campaigns);
    if (spendVariance > 30) {
      insights.push({
        category: 'recommendation',
        priority: 'low',
        type: 'budget_pacing',
        title: 'Uneven budget pacing detected',
        description: `Your daily spend varies by ${spendVariance.toFixed(0)}%. Consider using campaign budget optimization for more consistent pacing.`,
        action: {
          type: 'enable_cbo',
          details: 'Enable Campaign Budget Optimization'
        },
        estimatedImpact: 'More consistent daily performance'
      });
    }
  }

  // Low ROAS alert
  if (metrics.overallROAS < 1.5 && metrics.totalSpend > 100) {
    insights.push({
      category: 'warning',
      priority: 'high',
      type: 'roas_alert',
      title: 'Overall ROAS below target',
      description: `Your overall ROAS is ${metrics.overallROAS.toFixed(2)}x, which may not be profitable after accounting for COGS. Review your campaign mix.`,
      action: {
        type: 'review_campaigns',
        details: 'Pause worst performers and reallocate budget to winners'
      },
      estimatedImpact: `Improve ROAS to 2.0x = +$${((metrics.totalSpend * 0.5)).toFixed(2)} profit`
    });
  }

  return insights;
}

/**
 * AI-powered insight generation using Claude
 */
async function generateClaudeInsights(
  campaigns: any[],
  orders: any[],
  creatives: any[],
  metrics: { totalSpend: number; totalRevenue: number; overallROAS: number }
): Promise<AIInsight[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Anthropic API key not configured, skipping AI insights');
    return [];
  }

  if (campaigns.length === 0) {
    return [];
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = buildInsightPrompt(campaigns, orders, creatives, metrics);

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse structured insights from response
    return parseClaudeResponse(responseText);
  } catch (error) {
    console.error('Error generating Claude insights:', error);
    return [];
  }
}

/**
 * Build prompt for Claude
 */
function buildInsightPrompt(
  campaigns: any[],
  orders: any[],
  creatives: any[],
  metrics: { totalSpend: number; totalRevenue: number; overallROAS: number }
): string {
  const campaignSummary = campaigns.slice(0, 15).map(c => ({
    name: c.campaign_name,
    platform: c.platform || 'unknown',
    spend: parseFloat(c.spend) || 0,
    revenue: parseFloat(c.attributed_revenue) || 0,
    roas: (parseFloat(c.attributed_revenue) || 0) / (parseFloat(c.spend) || 1),
    orders: c.attributed_orders || 0
  }));

  return `You are an expert e-commerce marketing analyst. Analyze this campaign data and provide 3-5 actionable insights.

## Overall Metrics
- Total Spend: $${metrics.totalSpend.toFixed(2)}
- Total Revenue: $${metrics.totalRevenue.toFixed(2)}
- Overall ROAS: ${metrics.overallROAS.toFixed(2)}x

## Campaign Data
${JSON.stringify(campaignSummary, null, 2)}

## Recent Orders: ${orders.length}
## Active Creatives: ${creatives.length}

Provide insights in this EXACT JSON format (return ONLY the JSON array, no other text):
[
  {
    "category": "opportunity|warning|recommendation",
    "priority": "high|medium|low",
    "type": "scaling_opportunity|cost_optimization|audience_opportunity|day_parting|general",
    "title": "Short actionable title",
    "description": "2-3 sentence explanation with specific numbers",
    "action": {
      "type": "action_type",
      "details": "Specific action to take"
    },
    "estimatedImpact": "Quantified impact estimate"
  }
]

Focus on:
1. Budget reallocation opportunities
2. Underperforming campaigns to pause
3. Scaling opportunities for winners
4. Cross-platform insights
5. Specific, data-driven recommendations`;
}

/**
 * Parse Claude's response into structured insights
 */
function parseClaudeResponse(responseText: string): AIInsight[] {
  try {
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(item => ({
      category: item.category || 'recommendation',
      priority: item.priority || 'medium',
      type: item.type || 'general',
      title: item.title || 'Insight',
      description: item.description || '',
      action: {
        type: item.action?.type || 'review',
        details: item.action?.details || ''
      },
      estimatedImpact: item.estimatedImpact || 'Unknown impact'
    }));
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return [];
  }
}

/**
 * Fetch campaign data
 */
async function fetchCampaignData(supabase: SupabaseClient, storeId: string) {
  const { data } = await supabase
    .from('adwyse_campaigns')
    .select('*')
    .eq('store_id', storeId)
    .order('spend', { ascending: false })
    .limit(50);
  return data || [];
}

/**
 * Fetch order data
 */
async function fetchOrderData(supabase: SupabaseClient, storeId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from('adwyse_orders')
    .select('*')
    .eq('store_id', storeId)
    .gte('order_created_at', thirtyDaysAgo.toISOString())
    .limit(500);
  return data || [];
}

/**
 * Fetch creative data with fatigue indicators
 */
async function fetchCreativeData(supabase: SupabaseClient, storeId: string) {
  // Call the detect_creative_fatigue function
  const { data } = await supabase.rpc('detect_creative_fatigue', {
    p_store_id: storeId,
    p_lookback_days: 14
  });
  return data || [];
}

/**
 * Fetch existing alerts
 */
async function fetchExistingAlerts(supabase: SupabaseClient, storeId: string) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('store_id', storeId)
    .gte('created_at', oneDayAgo.toISOString());
  return data || [];
}

/**
 * Calculate spend variance across campaigns
 */
function calculateSpendVariance(campaigns: any[]): number {
  if (campaigns.length < 2) return 0;

  const spends = campaigns.map(c => parseFloat(c.spend) || 0).filter(s => s > 0);
  if (spends.length < 2) return 0;

  const mean = spends.reduce((a, b) => a + b, 0) / spends.length;
  const variance = spends.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spends.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}

/**
 * Deduplicate insights
 */
function deduplicateInsights(insights: AIInsight[]): AIInsight[] {
  const seen = new Set<string>();
  return insights.filter(insight => {
    const key = `${insight.type}-${insight.action.targetId || insight.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate summary text
 */
function generateSummary(
  insights: AIInsight[],
  metrics: { totalSpend: number; totalRevenue: number; overallROAS: number }
): string {
  const highPriority = insights.filter(i => i.priority === 'high').length;
  const opportunities = insights.filter(i => i.category === 'opportunity').length;
  const warnings = insights.filter(i => i.category === 'warning').length;

  let summary = `Your campaigns generated $${metrics.totalRevenue.toFixed(2)} revenue from $${metrics.totalSpend.toFixed(2)} ad spend (${metrics.overallROAS.toFixed(2)}x ROAS). `;

  if (highPriority > 0) {
    summary += `${highPriority} high-priority ${highPriority === 1 ? 'issue needs' : 'issues need'} your attention. `;
  }

  if (opportunities > 0) {
    summary += `We found ${opportunities} growth ${opportunities === 1 ? 'opportunity' : 'opportunities'}. `;
  }

  if (warnings > 0) {
    summary += `${warnings} ${warnings === 1 ? 'campaign is' : 'campaigns are'} underperforming.`;
  }

  return summary.trim();
}

/**
 * Save insights to database
 */
async function saveInsights(
  supabase: SupabaseClient,
  storeId: string,
  insights: AIInsight[]
): Promise<void> {
  if (insights.length === 0) return;

  const records = insights.map(insight => ({
    store_id: storeId,
    insight_type: insight.type,
    title: insight.title,
    description: insight.description,
    content: JSON.stringify(insight),
    data: {
      category: insight.category,
      priority: insight.priority,
      action: insight.action,
      estimatedImpact: insight.estimatedImpact,
      metrics: insight.metrics
    },
    status: 'active',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  }));

  await supabase.from('adwyse_insights').insert(records);
}

/**
 * Get recent insights for a store
 */
export async function getRecentInsights(
  storeId: string,
  limit: number = 10
): Promise<AIInsight[]> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('adwyse_insights')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map(row => {
    const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return {
      id: row.id,
      ...content,
      createdAt: row.created_at
    };
  });
}

/**
 * Dismiss an insight
 */
export async function dismissInsight(insightId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('adwyse_insights')
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString()
    })
    .eq('id', insightId);
}

/**
 * Mark an insight as actioned
 */
export async function markInsightActioned(insightId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('adwyse_insights')
    .update({
      status: 'actioned',
      actioned_at: new Date().toISOString()
    })
    .eq('id', insightId);
}
