import { NextRequest, NextResponse } from 'next/server';
import { getTikTokAuthUrl } from '@/lib/tiktok-ads';

/**
 * Initiate TikTok Ads OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const authUrl = getTikTokAuthUrl(storeId);

    // Redirect to TikTok OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('TikTok OAuth init error:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}
