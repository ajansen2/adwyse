import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsAuthUrl } from '@/lib/google-ads';

/**
 * Initiate Google Ads OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const authUrl = getGoogleAdsAuthUrl(storeId);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth init error:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}
