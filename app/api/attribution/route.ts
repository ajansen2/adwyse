import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelAttribution,
  compareAttributionModels,
  recalculateAttribution,
  type AttributionModel
} from '@/lib/attribution-engine';

/**
 * Attribution API
 * Get attribution data and manage attribution calculations
 */

// GET - Get channel attribution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const model = searchParams.get('model') as AttributionModel || 'last_click';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const compare = searchParams.get('compare') === 'true';

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    if (compare) {
      // Compare all attribution models
      const comparison = await compareAttributionModels(storeId, startDate, endDate);
      return NextResponse.json({
        success: true,
        comparison,
        dateRange: { start: startDateStr, end: endDateStr }
      });
    }

    // Get single model attribution
    const channels = await getChannelAttribution(storeId, model, startDate, endDate);

    return NextResponse.json({
      success: true,
      model,
      channels,
      dateRange: { start: startDateStr, end: endDateStr }
    });

  } catch (error) {
    console.error('Attribution GET error:', error);
    return NextResponse.json({
      error: 'Failed to get attribution data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Recalculate attribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, model, startDate, endDate } = body;

    if (!storeId || !model) {
      return NextResponse.json({
        error: 'storeId and model are required'
      }, { status: 400 });
    }

    const validModels: AttributionModel[] = [
      'last_click', 'first_click', 'linear', 'time_decay', 'position_based'
    ];

    if (!validModels.includes(model)) {
      return NextResponse.json({
        error: `Invalid model. Must be one of: ${validModels.join(', ')}`
      }, { status: 400 });
    }

    const result = await recalculateAttribution(
      storeId,
      model,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors
    });

  } catch (error) {
    console.error('Attribution POST error:', error);
    return NextResponse.json({
      error: 'Failed to recalculate attribution',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
