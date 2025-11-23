import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Generate AI insights for a store's campaigns using Claude
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

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
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get campaigns with performance data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('store_id', storeId)
      .order('ad_spend', { ascending: false })
      .limit(20);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        error: 'No campaign data available. Connect ad accounts and sync data first.'
      }, { status: 400 });
    }

    // Get recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate aggregate metrics
    const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.ad_spend) || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (parseFloat(c.revenue) || 0), 0);
    const totalOrders = campaigns.reduce((sum, c) => sum + (c.orders || 0), 0);
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Prepare data for Claude
    const campaignSummary = campaigns.map(c => ({
      name: c.campaign_name,
      source: c.source,
      spend: parseFloat(c.ad_spend) || 0,
      revenue: parseFloat(c.revenue) || 0,
      orders: c.orders || 0,
      roas: c.roas || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0,
      cpc: c.clicks > 0 ? (parseFloat(c.ad_spend) / c.clicks).toFixed(2) : 0,
      conversionRate: c.clicks > 0 ? ((c.orders / c.clicks) * 100).toFixed(2) : 0,
    }));

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Generate insights with Claude
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const insightsText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Save insights to database
    const { data: insight } = await supabase
      .from('insights')
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
