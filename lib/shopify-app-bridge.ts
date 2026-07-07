// Shopify App Bridge utilities for embedded apps
// IMPORTANT: We use the CDN global (window.shopify) NOT npm imports
// This is required for Shopify's automated "Embedded app checks"
// App Bridge 4.x: uses window.shopify directly from the CDN script

declare global {
  interface Window {
    shopify: {
      idToken(): Promise<string>;
      navigate(path: string): void;
      toast: {
        show(message: string, options?: { duration?: number; isError?: boolean }): void;
      };
    };
  }
}

export function initializeAppBridge() {
  // App Bridge 4.x auto-initializes from the CDN script + meta tag.
  // No explicit createApp() call needed.
  const isEmbedded = window.self !== window.top;
  if (!isEmbedded) return null;

  if (!window.shopify) {
    console.warn('App Bridge CDN not loaded yet');
    return null;
  }

  console.log('App Bridge 4.x ready (CDN global)');
  return window.shopify;
}

export async function getShopifySessionToken(): Promise<string | null> {
  try {
    if (!window.shopify?.idToken) return null;
    return await window.shopify.idToken();
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

export function isEmbeddedInShopify(): boolean {
  return window.self !== window.top;
}

// Navigate within the embedded app
export function navigateInApp(path: string) {
  const isEmbedded = window.self !== window.top;

  // Preserve essential query parameters across navigation
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');
  const forceTier = urlParams.get('force_tier');

  // Build path with preserved query parameters
  let fullPath = path;
  const params = new URLSearchParams();
  if (shop) params.set('shop', shop);
  if (host) params.set('host', host);
  if (forceTier) params.set('force_tier', forceTier);
  if (params.toString()) {
    fullPath = `${path}?${params.toString()}`;
  }

  if (!isEmbedded) {
    window.location.href = fullPath;
    return;
  }

  // App Bridge 4.x navigate
  if (window.shopify?.navigate) {
    try {
      window.shopify.navigate(fullPath);
      console.log('App Bridge navigation to:', fullPath);
      return;
    } catch (error) {
      console.error('App Bridge navigate failed:', error);
    }
  }

  // Fallback
  window.location.href = fullPath;
}

// Redirect to Shopify admin if app is opened standalone (not embedded)
export function redirectToShopifyAdmin(shop: string): boolean {
  const isEmbedded = window.self !== window.top;
  if (isEmbedded) return false;

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';
  const storeName = shop.replace('.myshopify.com', '');
  const adminUrl = `https://admin.shopify.com/store/${storeName}/apps/${apiKey}`;

  console.log('Redirecting to Shopify admin:', adminUrl);
  window.location.href = adminUrl;
  return true;
}

// Redirect to external URL (like OAuth or billing) - breaks out of iframe as required
export function redirectToOAuth(url: string) {
  const isEmbedded = window.self !== window.top;
  console.log('redirectToOAuth called:', url, 'isEmbedded:', isEmbedded);

  if (!isEmbedded) {
    window.location.href = url;
    return;
  }

  // For embedded apps, break out of the iframe
  // Method 1: window.open with _top target (most reliable)
  try {
    const opened = window.open(url, '_top');
    if (opened !== null) return;
  } catch (e) {
    // cross-origin blocked
  }

  // Method 2: parent.location
  try {
    if (window.parent && window.parent !== window) {
      window.parent.location.href = url;
      return;
    }
  } catch (e) {
    // cross-origin blocked
  }

  // Method 3: top.location
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch (e) {
    // cross-origin blocked
  }

  // Final fallback
  window.location.href = url;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getShopifySessionToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
