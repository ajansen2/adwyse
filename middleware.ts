import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Fix for old broken billing redirects that have URL stacking
  // Pattern: /https:/argora.ai/dashboard or /https:/argora.ai/billing-success
  if (pathname.includes('/https:/argora.ai/')) {
    console.log('🔧 Detected broken URL pattern:', pathname);

    // Extract the actual path and query params
    const brokenPart = pathname.split('/https:/argora.ai')[1]; // Gets "/dashboard" or "/billing-success"
    const actualPath = brokenPart.split('?')[0]; // Gets clean path

    // Get query params from original URL
    const shop = url.searchParams.get('shop');
    const chargeId = url.searchParams.get('charge_id');
    const storeId = url.searchParams.get('store_id');

    console.log('🔧 Extracted:', { actualPath, shop, chargeId, storeId });

    // Build correct internal URL for rewrite (not redirect)
    // Rewrite keeps the URL in the browser but serves different content
    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = actualPath; // Just use /dashboard

    // Preserve query params
    if (shop) rewriteUrl.searchParams.set('shop', shop);
    if (chargeId) {
      rewriteUrl.searchParams.set('charge_id', chargeId);
      rewriteUrl.searchParams.set('billing', 'success');
    }
    if (storeId) rewriteUrl.searchParams.set('store_id', storeId);

    console.log('🔄 Rewriting to:', rewriteUrl.pathname + rewriteUrl.search);

    // Use rewrite instead of redirect to avoid X-Frame-Options issues
    return NextResponse.rewrite(rewriteUrl);
  }

  // The first check above already handles /https:/argora.ai/billing-success
  // No need for separate handling

  return NextResponse.next();
}

// Configure which routes should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
