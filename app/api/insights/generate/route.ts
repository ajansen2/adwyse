import { NextRequest, NextResponse } from 'next/server';
import { requireProTier } from '@/lib/check-subscription';
import { generateInsights, getRecentInsights, dismissInsight, markInsightActioned } from '@/lib/ai-insights';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Generate AI insights for a store's campaigns using Claude
 * PRO FEATURE - requires active Pro subscription
 */
export async function POST(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  console.log('🤖 [AI Insights] Starting generation...');

  try {
    const body = await request.json();
    const { storeId, action, insightId } = body;
    console.log('🤖 [AI Insights] Store ID:', storeId, 'Action:', action);

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Handle insight actions (dismiss, mark as actioned)
    if (action === 'dismiss' && insightId) {
      await dismissInsight(insightId);
      return NextResponse.json({ success: true });
    }

    if (action === 'actioned' && insightId) {
      await markInsightActioned(insightId);
      return NextResponse.json({ success: true });
    }

    // Check subscription - AI Insights is a Pro feature
    const subscriptionCheck = await requireProTier(storeId, 'ai_insights');
    if ('error' in subscriptionCheck) {
      return subscriptionCheck.error;
    }

    // Use enhanced insights generator
    const result = await generateInsights(storeId);

    return NextResponse.json({
      success: true,
      insights: result.insights,
      summary: result.summary,
      metrics: result.metrics
    });
  } catch (error) {
    console.error('❌ AI insights generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Fetch recent insights for a store
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const insights = await getRecentInsights(storeId, limit);

    return NextResponse.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({
      error: 'Failed to fetch insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
