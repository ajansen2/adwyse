import { NextRequest, NextResponse } from 'next/server';
import { recordTouchpoint, determineTouchpointType } from '@/lib/attribution-engine';

/**
 * Touchpoint Recording API
 * Records customer touchpoints for multi-touch attribution
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      customerIdentifier,
      identifierType,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
      gclid,
      ttclid,
      landingPage,
      referrer,
      sessionId,
      deviceType
    } = body;

    if (!storeId || !customerIdentifier) {
      return NextResponse.json({
        error: 'storeId and customerIdentifier are required'
      }, { status: 400 });
    }

    // Determine touchpoint type automatically
    const touchpointType = determineTouchpointType({
      utmSource,
      utmMedium,
      fbclid,
      gclid,
      ttclid,
      referrer
    });

    const touchpoint = await recordTouchpoint(storeId, customerIdentifier, {
      identifierType: identifierType || 'cookie',
      touchpointType,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
      gclid,
      ttclid,
      landingPage,
      referrer,
      sessionId,
      deviceType
    });

    if (!touchpoint) {
      return NextResponse.json({
        error: 'Failed to record touchpoint'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      touchpoint: {
        id: touchpoint.id,
        type: touchpointType
      }
    });

  } catch (error) {
    console.error('Touchpoint recording error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
