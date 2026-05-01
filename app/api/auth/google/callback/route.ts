import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exchangeGoogleCode, getGoogleAdsCustomers } from '@/lib/google-ads';
import { checkAdAccountLimit } from '@/lib/subscription-tiers';

/**
 * Handle Google Ads OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state'); // Contains store_id
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return returnHtmlResponse(false, 'Google authorization was denied');
    }

    if (!code || !state) {
      return returnHtmlResponse(false, 'Missing required parameters');
    }

    const storeId = state;

    // Exchange code for tokens
    console.log('🔑 Exchanging Google authorization code...');
    console.log('🔑 Code length:', code.length);
    const tokens = await exchangeGoogleCode(code);
    console.log('✅ Token exchange successful, access token length:', tokens.accessToken.length);

    // Fetch all accessible Google Ads customer accounts
    console.log('📊 Fetching accessible Google Ads accounts...');
    let customers;
    try {
      customers = await getGoogleAdsCustomers(tokens.accessToken);
      console.log(`📊 Found ${customers.length} accessible account(s)`);
    } catch (error: any) {
      console.error('❌ Failed to list accounts, falling back to manager account:', error.message);
      // Fallback: use manager account ID if listAccessibleCustomers fails
      const managerAccountId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
      customers = [{
        customerId: managerAccountId,
        descriptiveName: 'Google Ads Account',
      }];
    }

    if (customers.length === 0) {
      return returnHtmlResponse(false, 'No Google Ads accounts found. Make sure your Google account has access to at least one Google Ads account.');
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

    // Save each customer account (respecting tier limits)
    let connectedCount = 0;
    let skippedDueToLimit = 0;

    for (const customer of customers) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('store_id', storeId)
        .eq('platform', 'google')
        .eq('account_id', customer.customerId)
        .maybeSingle();

      if (existing) {
        // Update existing (doesn't count against limit)
        await supabase
          .from('ad_accounts')
          .update({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
            is_connected: true,
            account_name: customer.descriptiveName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        console.log(`✅ Updated Google Ads account: ${customer.descriptiveName}`);
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
            platform: 'google',
            account_id: customer.customerId,
            account_name: customer.descriptiveName,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
            is_connected: true,
          });

        console.log(`➕ Added Google Ads account: ${customer.descriptiveName}`);
        connectedCount++;
      }
    }

    const message = skippedDueToLimit > 0
      ? `Connected ${connectedCount} account(s). ${skippedDueToLimit} skipped — upgrade to Pro for more.`
      : `Connected ${connectedCount} Google Ads account(s)`;

    return returnHtmlResponse(true, message);

  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    const errorMessage = error?.message || 'Failed to connect Google Ads account';
    return returnHtmlResponse(false, errorMessage);
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
          <h2>${success ? 'Google Ads Connected!' : 'Connection Failed'}</h2>
          <p>${message}</p>
          <p style="margin-top: 16px; font-size: 14px;">This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'google_connected', success: ${success} }, '*');
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => {
              window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?${success ? 'success=google_connected' : 'error=google_failed'}';
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
