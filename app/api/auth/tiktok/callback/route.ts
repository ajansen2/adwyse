import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exchangeTikTokCode, getTikTokAdvertiserInfo } from '@/lib/tiktok-ads';
import { checkAdAccountLimit } from '@/lib/subscription-tiers';

/**
 * Handle TikTok Ads OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const authCode = request.nextUrl.searchParams.get('auth_code');
    const state = request.nextUrl.searchParams.get('state'); // Contains store_id

    if (!authCode || !state) {
      return returnHtmlResponse(false, 'Missing required parameters');
    }

    const storeId = state;

    // Exchange code for tokens
    console.log('🔑 Exchanging TikTok authorization code...');
    const { accessToken, advertisers } = await exchangeTikTokCode(authCode);

    if (advertisers.length === 0) {
      return returnHtmlResponse(false, 'No TikTok Ads accounts found. Make sure you have access to at least one ad account.');
    }

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

    // Get detailed info for each advertiser and save (respecting tier limits)
    let connectedCount = 0;
    let skippedDueToLimit = 0;

    for (const advertiser of advertisers) {
      // Try to get detailed advertiser info
      const detailedInfo = await getTikTokAdvertiserInfo(accessToken, advertiser.advertiserId);
      const advertiserName = detailedInfo?.advertiserName || advertiser.advertiserName;

      // Check if already exists
      const { data: existing } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('store_id', storeId)
        .eq('platform', 'tiktok')
        .eq('account_id', advertiser.advertiserId)
        .maybeSingle();

      if (existing) {
        // Update existing (doesn't count against limit)
        await supabase
          .from('ad_accounts')
          .update({
            access_token: accessToken,
            is_connected: true,
            account_name: advertiserName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        console.log(`✅ Updated TikTok account: ${advertiserName}`);
        connectedCount++;
      } else {
        // Check ad account limit before inserting new
        const limitCheck = await checkAdAccountLimit(storeId);
        if (!limitCheck.allowed) {
          skippedDueToLimit++;
          continue;
        }

        // Insert new
        await supabase
          .from('ad_accounts')
          .insert({
            store_id: storeId,
            platform: 'tiktok',
            account_id: advertiser.advertiserId,
            account_name: advertiserName,
            access_token: accessToken,
            is_connected: true,
          });

        console.log(`➕ Added TikTok account: ${advertiserName}`);
        connectedCount++;
      }
    }

    const message = skippedDueToLimit > 0
      ? `Connected ${connectedCount} account(s). ${skippedDueToLimit} skipped — upgrade to Pro for more.`
      : `Connected ${connectedCount} TikTok Ads account(s)`;

    return returnHtmlResponse(true, message);

  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    return returnHtmlResponse(false, 'Failed to connect TikTok Ads account');
  }
}

function returnHtmlResponse(success: boolean, message: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${success ? 'Connected!' : 'Error'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h2 {
            margin: 0 0 8px 0;
          }
          p {
            margin: 0;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${success ? '✅' : '❌'}</div>
          <h2>${success ? 'TikTok Ads Connected!' : 'Connection Failed'}</h2>
          <p>${message}</p>
          <p style="margin-top: 16px; font-size: 14px;">This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'tiktok_connected', success: ${success} }, '*');
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => {
              window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?${success ? 'success=tiktok_connected' : 'error=tiktok_failed'}';
            }, 2000);
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
