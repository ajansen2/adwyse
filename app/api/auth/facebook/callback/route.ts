import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { checkAdAccountLimit } from '@/lib/subscription-tiers';

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

    // Check ad account limits before saving
    const limitCheck = await checkAdAccountLimit(storeId);

    // Save each ad account (respecting tier limits)
    if (adAccountsData.data && adAccountsData.data.length > 0) {
      let connectedCount = 0;
      let skippedDueToLimit = 0;

      for (const adAccount of adAccountsData.data) {
        // Re-check limit before each account (in case they're on free tier)
        const currentLimit = await checkAdAccountLimit(storeId);
        if (!currentLimit.allowed) {
          skippedDueToLimit++;
          continue;
        }

        const { error: upsertError } = await supabase.from('ad_accounts').upsert({
          store_id: storeId,
          platform: 'facebook',
          account_id: adAccount.account_id,
          account_name: adAccount.name,
          access_token: accessToken,
          is_connected: true,
        }, {
          onConflict: 'store_id,platform,account_id',
        });

        if (upsertError) {
          console.error('❌ Error saving ad account:', upsertError);
        } else {
          connectedCount++;
        }
      }

      if (skippedDueToLimit > 0) {
        console.log(`⚠️ Connected ${connectedCount} accounts, skipped ${skippedDueToLimit} due to plan limits`);
      } else {
        console.log(`✅ Connected ${connectedCount} Facebook ad accounts for store ${storeId}`);
      }
    } else {
      console.log('⚠️ No ad accounts found for this Facebook user');
    }

    // Clear cookies
    cookieStore.delete('facebook_oauth_state');
    cookieStore.delete('facebook_oauth_store_id');

    // Return HTML that closes the popup and notifies parent
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Connected!</title></head>
        <body>
          <h2>Facebook Connected Successfully!</h2>
          <p>This window will close automatically...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'facebook_connected', success: true }, '*');
              window.close();
            } else {
              window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=facebook_connected';
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h2>Connection Failed</h2>
          <p>This window will close automatically...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'facebook_connected', success: false, error: 'callback_failed' }, '*');
              window.close();
            } else {
              window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed';
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
