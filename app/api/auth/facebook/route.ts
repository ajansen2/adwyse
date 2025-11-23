import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Facebook OAuth - Initiate authorization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    // Store state and store_id in cookies for callback
    const cookieStore = await cookies();
    cookieStore.set('facebook_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes
      sameSite: 'lax',
    });
    cookieStore.set('facebook_oauth_store_id', storeId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      sameSite: 'lax',
    });

    // Facebook OAuth URL
    const facebookAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    facebookAuthUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
    facebookAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`);
    facebookAuthUrl.searchParams.set('state', state);
    facebookAuthUrl.searchParams.set('scope', 'ads_read,ads_management'); // Facebook Ads permissions

    return NextResponse.redirect(facebookAuthUrl.toString());
  } catch (error) {
    console.error('❌ Facebook OAuth init error:', error);
    return NextResponse.json({ error: 'Failed to initiate Facebook OAuth' }, { status: 500 });
  }
}
