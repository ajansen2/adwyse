import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Get access token from query parameter
    const accessToken = request.nextUrl.searchParams.get('access_token');

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login?redirect=/api/auth/shopify', request.url));
    }

    // Create Supabase client and verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.redirect(new URL('/login?redirect=/api/auth/shopify', request.url));
    }

    // Use service role key to bypass RLS for merchant lookup
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get merchant profile
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant lookup error:', merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get shop parameter (for now, we'll prompt user for their shop URL in a future version)
    // For now, redirect to a page where they can enter their shop URL
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      // Redirect to a page where merchant can enter their Shopify store URL
      return NextResponse.redirect(new URL('/dashboard/connect-store', request.url));
    }

    // Generate state parameter for OAuth security
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Store state in session or database (for now, we'll use a cookie)
    // In production, store this in database for better security
    const response = NextResponse.redirect(
      `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback&state=${state}&grant_options[]='per-user'`
    );

    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    response.cookies.set('shopify_oauth_merchant_id', merchant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('Shopify OAuth initiation error:', error);
    return NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 });
  }
}
