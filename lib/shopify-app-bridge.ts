// Shopify App Bridge utilities for embedded apps
// IMPORTANT: We use the CDN global (window.shopify) NOT npm imports
// This is required for Shopify's automated "Embedded app checks"

// TypeScript interfaces for Shopify App Bridge CDN global
interface AppBridgeApp {
  dispatch?: (action: {
    type: string;
    payload?: Record<string, unknown>;
  }) => void;
  idToken?: () => Promise<string>;
}

declare global {
  interface Window {
    shopify: {
      createApp(config: {
        apiKey: string;
        host: string;
        forceRedirect?: boolean;
      }): AppBridgeApp;
      sessionToken?: {
        getSessionToken(app: AppBridgeApp): Promise<string>;
      };
    };
    shopifyApp?: AppBridgeApp; // Global instance created by inline script
  }
}

let appBridge: AppBridgeApp | null = null;

export function initializeAppBridge() {
  // Check if we're in an iframe (embedded)
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    return null;
  }

  // Use global instance if it exists (created by inline script in layout.tsx)
  if (window.shopifyApp && !appBridge) {
    appBridge = window.shopifyApp;
    console.log('✅ Using existing App Bridge instance from inline script');
    return appBridge;
  }

  // Get host from URL params (Shopify passes this)
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const shop = urlParams.get('shop');

  if (!host || !shop) {
    console.warn('Missing host or shop parameter - not embedded in Shopify');
    return null;
  }

  if (!appBridge) {
    try {
      // Use CDN global instead of npm import
      if (!window.shopify?.createApp) {
        console.error('❌ Shopify App Bridge CDN not loaded');
        return null;
      }

      appBridge = window.shopify.createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'e84f4a7fecd1e8c9c05791a35c0336d4',
        host: host,
        forceRedirect: false,
      });

      console.log('✅ App Bridge initialized from CDN global');
    } catch (error) {
      console.error('❌ Failed to initialize App Bridge:', error);
      return null;
    }
  }

  return appBridge;
}

export async function getShopifySessionToken(): Promise<string | null> {
  if (!appBridge) {
    initializeAppBridge();
  }

  if (!appBridge) {
    return null;
  }

  try {
    // Use CDN global's session token method
    // App Bridge from CDN exposes idToken() method on the app instance
    if (typeof appBridge.idToken === 'function') {
      const token = await appBridge.idToken();
      return token;
    }

    // Fallback: try window.shopify.sessionToken if available
    if (window.shopify?.sessionToken?.getSessionToken) {
      const token = await window.shopify.sessionToken.getSessionToken(appBridge);
      return token;
    }

    console.error('❌ Session token method not available on App Bridge CDN');
    return null;
  } catch (error) {
    console.error('❌ Failed to get session token:', error);
    return null;
  }
}

export function isEmbeddedInShopify(): boolean {
  return window.self !== window.top;
}

// Navigate within the embedded app
export function navigateInApp(path: string) {
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    // Not embedded - use regular navigation
    window.location.href = path;
    return;
  }

  // For embedded apps, preserve query parameters (shop, host, etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');

  // Build path with query parameters
  let fullPath = path;
  if (shop || host) {
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);
    if (host) params.set('host', host);
    fullPath = `${path}?${params.toString()}`;
  }

  if (!appBridge) {
    initializeAppBridge();
  }

  if (!appBridge) {
    // Fallback to regular navigation if App Bridge not initialized
    window.location.href = fullPath;
    return;
  }

  try {
    // Use App Bridge CDN's redirect method
    // The app instance from CDN has redirect methods available
    if (appBridge.dispatch) {
      appBridge.dispatch({
        type: 'Redirect',
        payload: {
          path: fullPath,
          newContext: false,
        },
      });
      console.log('✅ App Bridge navigation to:', fullPath);
    } else {
      // Fallback if dispatch not available
      window.location.href = fullPath;
    }
  } catch (error) {
    console.error('❌ Failed to navigate with App Bridge:', error);
    // Fallback to regular navigation
    window.location.href = fullPath;
  }
}

// Redirect to external URL (like OAuth) - breaks out of iframe as required for OAuth
export function redirectToOAuth(url: string) {
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    // Not embedded - use regular navigation
    window.location.href = url;
    return;
  }

  if (!appBridge) {
    initializeAppBridge();
  }

  if (!appBridge) {
    // Fallback - try to break out of iframe
    if (window.top) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
    return;
  }

  try {
    // Use App Bridge to redirect to external URL (OAuth)
    // This properly breaks out of the iframe for OAuth flow
    if (appBridge.dispatch) {
      appBridge.dispatch({
        type: 'Redirect',
        payload: {
          url: url,
          newContext: true, // Open in new context (breaks out of iframe)
        },
      });
      console.log('✅ App Bridge OAuth redirect to:', url);
    } else {
      // Fallback - try to break out of iframe
      if (window.top) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    }
  } catch (error) {
    console.error('❌ Failed to redirect with App Bridge:', error);
    // Fallback - try to break out of iframe
    if (window.top) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  }
}
