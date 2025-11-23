import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Facebook OAuth - Handle callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Facebook OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=facebook_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_parameters`);
    }

    // Verify state (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('facebook_oauth_state')?.value;
    const storeId = cookieStore.get('facebook_oauth_store_id')?.value;

    if (!storedState || storedState !== state) {
      console.error('❌ State mismatch');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_state`);
    }

    if (!storeId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_store`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token exchange failed:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Facebook user info and ad accounts
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`);
    const userData = await meResponse.json();

    // Get ad accounts
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userData.id}/adaccounts?fields=id,name,account_id,account_status&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsResponse.json();

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Save each ad account
    if (adAccountsData.data && adAccountsData.data.length > 0) {
      for (const adAccount of adAccountsData.data) {
        await supabase.from('ad_accounts').upsert({
          store_id: storeId,
          platform: 'facebook',
          account_id: adAccount.account_id,
          account_name: adAccount.name,
          access_token: accessToken, // TODO: Encrypt this
          status: adAccount.account_status === 1 ? 'active' : 'inactive',
        }, {
          onConflict: 'store_id,platform,account_id',
        });
      }

      console.log(`✅ Connected ${adAccountsData.data.length} Facebook ad accounts`);
    }

    // Clear cookies
    cookieStore.delete('facebook_oauth_state');
    cookieStore.delete('facebook_oauth_store_id');

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=facebook_connected`);
  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed`);
  }
}
