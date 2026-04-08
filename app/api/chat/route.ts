import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildChatContext } from '@/lib/chat-context';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

/**
 * Demo context fallback so the chat works for the marketing/demo store
 * even when there's no real data behind it.
 */
function getDemoContext() {
  return {
    storeName: 'Demo Store',
    asOf: new Date().toISOString(),
    windowDays: 30,
    metrics: {
      totalRevenue: 28478.61,
      totalOrders: 73,
      totalSpend: 33406.32,
      blendedROAS: 0.85,
      avgOrderValue: 390.12,
      attributedRevenue: 23150.5,
      attributedOrders: 58,
    },
    topCampaigns: [
      { name: 'Summer Sale - Lookalike', platform: 'facebook', spend: 850, revenue: 3570, orders: 12, roas: 4.2 },
      { name: 'Brand Awareness', platform: 'google', spend: 420, revenue: 1302, orders: 8, roas: 3.1 },
      { name: 'Retargeting - Cart Abandoners', platform: 'facebook', spend: 320, revenue: 1664, orders: 9, roas: 5.2 },
      { name: 'Cold Traffic - Interest', platform: 'facebook', spend: 680, revenue: 544, orders: 4, roas: 0.8 },
      { name: 'Display - GDN', platform: 'google', spend: 230, revenue: 253, orders: 2, roas: 1.1 },
    ],
    recentOrders: [],
    byPlatform: {
      facebook: { spend: 1850, revenue: 5778, roas: 3.12 },
      google: { spend: 650, revenue: 1555, roas: 2.39 },
    },
    trend: { revenueChangePct: 13.8, spendChangePct: 0 },
  };
}

const SYSTEM_PROMPT = `You are AdWyse Assistant, an AI advisor built into an e-commerce ad attribution platform.

You help store owners understand their advertising performance and make smart decisions. You have access to a JSON snapshot of their last 30 days of data — use it to answer their questions accurately.

Rules:
- Be concise. 2-4 sentences for simple questions, bullet points for comparisons.
- Use real numbers from the context, formatted with commas and 2 decimals for currency ($1,234.56), 2 decimals for ROAS (3.45x), and percentages with 1 decimal (12.3%).
- Never invent data. If the context doesn't contain what they're asking, say so honestly and suggest what to check next.
- Be opinionated and direct. If a campaign is losing money, say "this is losing money, kill it or fix the creative."
- Focus on actionable insights, not just describing the numbers.
- Always reference specific campaign names, platforms, and figures when relevant.
- If asked something off-topic (weather, jokes, etc.), politely redirect to ad performance.

Format responses in plain text or markdown bullets. Don't use code blocks or JSON unless the user asks.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, storeId } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI assistant not configured' },
        { status: 503 }
      );
    }

    // Build data context — use demo for the demo store
    let context;
    if (!storeId || storeId === DEMO_STORE_ID) {
      context = getDemoContext();
    } else {
      context = await buildChatContext(storeId, 30);
      if (!context) context = getDemoContext();
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const contextMessage = `Here is the user's current data snapshot (last ${context.windowDays} days):

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

Use this data to answer their questions accurately.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: contextMessage },
        { role: 'assistant', content: 'Got it — I have your data ready. What would you like to know?' },
        ...messages,
      ],
    });

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      reply: text,
      usage: response.usage,
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
