import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { requireActiveSubscription } from '@/lib/check-subscription';

/**
 * Generate AI insights for a store's campaigns using Claude
 */
export async function POST(request: NextRequest) {
  console.log('🤖 [AI Insights] Starting generation...');

  try {
    const body = await request.json();
    const { storeId } = body;
    console.log('🤖 [AI Insights] Store ID:', storeId);

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Check subscription status
    const subscriptionCheck = await requireActiveSubscription(storeId);
    if ('error' in subscriptionCheck) {
      return subscriptionCheck.error;
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ [AI Insights] ANTHROPIC_API_KEY not configured');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }
    console.log('🤖 [AI Insights] Anthropic API key present:', !!process.env.ANTHROPIC_API_KEY);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get store info
    console.log('🤖 [AI Insights] Fetching store...');
    const { data: store } = await supabase
      .from('adwyse_stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (!store) {
      console.error('❌ [AI Insights] Store not found');
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    console.log('🤖 [AI Insights] Store found:', store.store_name);

    // Get campaigns with performance data (use correct table)
    console.log('🤖 [AI Insights] Fetching campaigns...');
    const { data: campaigns } = await supabase
      .from('adwyse_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .order('spend', { ascending: false })
      .limit(20);

    console.log('🤖 [AI Insights] Campaigns found:', campaigns?.length || 0);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        error: 'No campaign data available. Connect ad accounts and sync data first.'
      }, { status: 400 });
    }

    // Get recent orders
    console.log('🤖 [AI Insights] Fetching orders...');
    const { data: orders } = await supabase
      .from('adwyse_orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100);
    console.log('🤖 [AI Insights] Orders found:', orders?.length || 0);

    // Calculate aggregate metrics (use correct column names)
    const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (parseFloat(c.attributed_revenue) || 0), 0);
    const totalOrders = campaigns.reduce((sum, c) => sum + (c.attributed_orders || 0), 0);
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    console.log('🤖 [AI Insights] Metrics - Spend:', totalSpend, 'Revenue:', totalRevenue, 'ROAS:', overallROAS);

    // Prepare data for Claude
    const campaignSummary = campaigns.map(c => ({
      name: c.campaign_name,
      status: c.status,
      spend: parseFloat(c.spend) || 0,
      revenue: parseFloat(c.attributed_revenue) || 0,
      orders: c.attributed_orders || 0,
      roas: c.roas || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0,
      cpc: c.clicks > 0 ? (parseFloat(c.spend) / c.clicks).toFixed(2) : 0,
      conversionRate: c.clicks > 0 ? ((c.attributed_orders / c.clicks) * 100).toFixed(2) : 0,
    }));

    // Initialize Anthropic client
    console.log('🤖 [AI Insights] Initializing Anthropic client...');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Generate insights with Claude
    console.log('🤖 [AI Insights] Building prompt for Claude...');
    const prompt = `You are an expert e-commerce marketing analyst. Analyze the following campaign performance data for ${store.store_name} and provide actionable insights.

**Overall Performance:**
- Total Ad Spend: $${totalSpend.toFixed(2)}
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Orders: ${totalOrders}
- Overall ROAS: ${overallROAS.toFixed(2)}x
- Average Order Value: $${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0}

**Campaign Performance:**
${JSON.stringify(campaignSummary, null, 2)}

**Recent Order Data:**
- Total Recent Orders: ${orders?.length || 0}
- Attribution Sources: ${orders ? [...new Set(orders.map(o => o.utm_source))].filter(Boolean).join(', ') : 'None'}

Please provide:

1. **Key Findings** (2-3 bullet points)
   - What's working well?
   - What needs improvement?

2. **Top Recommendations** (3-4 actionable items)
   - Specific campaigns to scale or pause
   - Budget reallocation suggestions
   - Optimization opportunities

3. **Budget Optimization**
   - How should they redistribute their ad spend?
   - Which campaigns deserve more budget?

4. **Risk Alerts** (if any)
   - Campaigns with poor ROAS
   - High spend with low conversion

Keep the analysis concise, actionable, and focused on ROI improvement. Use bullet points and be specific with numbers.`;

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000', 10);
    console.log('🤖 [AI Insights] Calling Claude API with model:', model, 'max_tokens:', maxTokens);

    const message = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    console.log('🤖 [AI Insights] Claude response received');

    const insightsText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('🤖 [AI Insights] Insights text length:', insightsText.length);

    // Save insights to database
    console.log('🤖 [AI Insights] Saving to database...');
    const { data: insight, error: insertError } = await supabase
      .from('adwyse_insights')
      .insert({
        store_id: storeId,
        insight_type: 'campaign_performance',
        title: 'Campaign Performance Analysis',
        content: insightsText,
        data: {
          totalSpend,
          totalRevenue,
          totalOrders,
          overallROAS,
          campaignCount: campaigns.length,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [AI Insights] Error saving insight:', insertError);
      // Still return the insight even if save fails
    } else {
      console.log('🤖 [AI Insights] Saved to database, id:', insight?.id);
    }

    return NextResponse.json({
      success: true,
      insight: {
        id: insight?.id,
        content: insightsText,
        metrics: {
          totalSpend,
          totalRevenue,
          totalOrders,
          overallROAS,
        },
      },
    });
  } catch (error) {
    console.error('❌ AI insights generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
