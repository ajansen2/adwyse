import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Shopify App Store Installation Entry Point
 *
 * This is the OAuth start URL that Shopify App Store redirects to when a merchant clicks "Install"
 *
 * Flow:
 * 1. Merchant clicks "Install" on Shopify App Store
 * 2. Shopify redirects to this endpoint with ?shop=store.myshopify.com
 * 3. We redirect to Shopify OAuth with required scopes
 * 4. Shopify redirects back to /api/auth/shopify/callback with auth code
 * 5. Callback creates merchant account + registers webhooks automatically
 */
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

    // Validate shop format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return NextResponse.json(
        { error: 'Invalid shop format' },
        { status: 400 }
      );
    }

    // Generate state parameter for OAuth security
    const state = crypto.randomBytes(32).toString('hex');

    // Scopes we need for cart recovery
    const scopes = [
      'read_checkouts',          // Read abandoned checkouts
      'read_customers',          // Read customer info (email, name)
      'read_orders',             // Track recovered orders
    ].join(',');

    // Get app URL from environment or construct from request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const redirectUri = `${appUrl}/api/auth/shopify/callback`;

    // Use PRODUCTION credentials (for App Store submission), fallback to hardcoded
    const clientId = process.env.SHOPIFY_CLIENT_ID_PRODUCTION || process.env.SHOPIFY_CLIENT_ID_DEV || '08fa8bc27e0e3ac857912c7e7ee289d0';

    console.log('🚀 Starting OAuth for shop:', shop);
    console.log('📍 App URL:', appUrl);
    console.log('📍 Redirect URI:', redirectUri);
    console.log('🔑 Client ID:', clientId ? 'Found' : 'MISSING!');

    // Safety check
    if (!clientId) {
      return NextResponse.json(
        { error: 'Shopify app not configured properly. Missing client ID.' },
        { status: 500 }
      );
    }

    // Build Shopify OAuth URL
    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    const authUrlString = authUrl.toString();

    // For embedded apps, auto-redirect to OAuth (installation is user-initiated action)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="0;url=${authUrlString}">
          <title>Redirecting to Shopify Authorization...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              padding: 3rem 2rem;
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
              max-width: 500px;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 {
              color: #333;
              margin-bottom: 0.5rem;
              font-size: 1.5rem;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Redirecting to Shopify...</h1>
            <p>Please wait while we redirect you to authorize the app.</p>
          </div>
          <script>
            // Immediate redirect (break out of iframe)
            (function() {
              if (window.top) {
                window.top.location.href = "${authUrlString}";
              } else {
                window.location.href = "${authUrlString}";
              }
            })();
          </script>
        </body>
      </html>
    `;

    // Create response with HTML and set cookies for callback verification
    const response = new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });

    response.cookies.set('shopify_oauth_shop', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('❌ Shopify install error:', error);
    return NextResponse.json(
      { error: 'Installation failed' },
      { status: 500 }
    );
  }
}
