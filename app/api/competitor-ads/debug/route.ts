import { NextRequest, NextResponse } from 'next/server';
import { runApifyScraperRaw } from '@/lib/apify-ads';

/**
 * Debug endpoint: returns the raw first record from Apify so we can
 * see the actual field shape and fix the normalizer.
 *
 * Usage: GET /api/competitor-ads/debug?query=gymshark
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query') || 'gymshark';
    const raw = await runApifyScraperRaw(query, 1);

    if (raw === null) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not set' }, { status: 500 });
    }

    return NextResponse.json({
      query,
      count: Array.isArray(raw) ? raw.length : 0,
      firstRecord: Array.isArray(raw) && raw.length > 0 ? raw[0] : null,
      topLevelKeys:
        Array.isArray(raw) && raw[0] && typeof raw[0] === 'object'
          ? Object.keys(raw[0])
          : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
