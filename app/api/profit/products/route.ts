import { NextRequest, NextResponse } from 'next/server';
import { getProductProfitability } from '@/lib/profit-calculations';
import { getAuthenticatedShop } from '@/lib/verify-session';

/**
 * Product Profitability API
 * Returns profit metrics per product
 */
export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const products = await getProductProfitability(storeId, startDate, endDate, limit);

    return NextResponse.json({
      success: true,
      products,
      dateRange: {
        start: startDateStr || 'all time',
        end: endDateStr || 'now'
      }
    });

  } catch (error) {
    console.error('Product profitability error:', error);
    return NextResponse.json({
      error: 'Failed to get product profitability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
