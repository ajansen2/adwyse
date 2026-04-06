import { NextRequest, NextResponse } from 'next/server';
import { getProfitSummary } from '@/lib/profit-calculations';

/**
 * Profit Summary API
 * Returns profit metrics for a store
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const summary = await getProfitSummary(storeId, startDate, endDate);

    return NextResponse.json({
      success: true,
      summary,
      dateRange: {
        start: startDateStr || 'all time',
        end: endDateStr || 'now'
      }
    });

  } catch (error) {
    console.error('Profit summary error:', error);
    return NextResponse.json({
      error: 'Failed to get profit summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
