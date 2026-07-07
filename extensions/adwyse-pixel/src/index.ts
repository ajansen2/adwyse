import { register } from '@shopify/web-pixels-extension';

/**
 * AdWyse Web Pixel Extension
 *
 * Runs in Shopify's strict sandbox — NO access to document, window.location, or DOM APIs.
 * Receives event data through analytics.subscribe() and context through init.context.
 * Sends events to our existing /api/pixel/event endpoint.
 */

register(async ({ analytics, browser, settings, init }) => {
  const storeId = settings.storeId;
  const endpoint = settings.endpoint;

  if (!storeId || !endpoint) {
    return; // Can't operate without configuration
  }

  // --- Visitor ID management (first-party cookie via sandbox browser API) ---

  const COOKIE_NAME = '_adw_vid';
  const SESSION_KEY = '_adw_sid';
  const ATTR_KEY = '_adw_attr';

  async function getOrCreateVisitorId(): Promise<string> {
    try {
      const existing = await browser.cookie.get(COOKIE_NAME);
      if (existing) return existing;
    } catch {
      // Cookie not found — generate a new one
    }

    const vid = 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    // Set cookie with 1-year expiry
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    await browser.cookie.set(
      `${COOKIE_NAME}=${vid};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    );
    return vid;
  }

  async function getOrCreateSessionId(): Promise<string> {
    try {
      const existing = await browser.sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
    } catch {
      // Not found
    }

    const sid = 's_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    await browser.sessionStorage.setItem(SESSION_KEY, sid);
    return sid;
  }

  // --- UTM / Click ID extraction ---

  function parseUrlParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    try {
      const u = new URL(url);
      u.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // Invalid URL — skip
    }
    return params;
  }

  async function captureAttribution(pageUrl: string): Promise<Record<string, string>> {
    const params = parseUrlParams(pageUrl);

    // If we have new attribution params, store them for the session
    if (params.utm_source || params.fbclid || params.gclid || params.ttclid) {
      const attr: Record<string, string> = {
        utm_source: params.utm_source || '',
        utm_medium: params.utm_medium || '',
        utm_campaign: params.utm_campaign || '',
        utm_content: params.utm_content || '',
        utm_term: params.utm_term || '',
        fbclid: params.fbclid || '',
        gclid: params.gclid || '',
        ttclid: params.ttclid || '',
      };
      await browser.sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
      return attr;
    }

    // Return existing attribution from session
    try {
      const stored = await browser.sessionStorage.getItem(ATTR_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // No stored attribution
    }
    return {};
  }

  // --- Device type detection ---

  function getDeviceType(userAgent: string): string {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  // --- Send event to AdWyse backend ---

  async function sendEvent(
    eventType: string,
    eventData: Record<string, unknown>,
    context: any
  ) {
    const pageUrl = context?.document?.location?.href || '';
    const pageTitle = context?.document?.title || '';
    const referrer = context?.document?.referrer || '';
    const userAgent = context?.navigator?.userAgent || '';

    const [visitorId, sessionId, attr] = await Promise.all([
      getOrCreateVisitorId(),
      getOrCreateSessionId(),
      captureAttribution(pageUrl),
    ]);

    const payload = {
      storeId,
      eventType,
      eventData,
      visitorId,
      sessionId,
      utmSource: attr.utm_source || undefined,
      utmMedium: attr.utm_medium || undefined,
      utmCampaign: attr.utm_campaign || undefined,
      utmContent: attr.utm_content || undefined,
      utmTerm: attr.utm_term || undefined,
      fbclid: attr.fbclid || undefined,
      gclid: attr.gclid || undefined,
      ttclid: attr.ttclid || undefined,
      pageUrl,
      pageTitle,
      referrer,
      userAgent,
      deviceType: getDeviceType(userAgent),
      clientTimestamp: new Date().toISOString(),
    };

    try {
      await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Silently fail — pixel should never break the storefront
    }
  }

  // --- Subscribe to Shopify standard events ---

  // Page views
  analytics.subscribe('page_viewed', async (event) => {
    await sendEvent('page_view', {}, event.context);
  });

  // Product views
  analytics.subscribe('product_viewed', async (event) => {
    const product = event.data?.productVariant;
    await sendEvent(
      'page_view',
      {
        product_id: product?.product?.id,
        product_title: product?.product?.title,
        variant_id: product?.id,
        variant_title: product?.title,
        price: product?.price?.amount,
        currency: product?.price?.currencyCode,
      },
      event.context
    );
  });

  // Product added to cart
  analytics.subscribe('product_added_to_cart', async (event) => {
    const line = event.data?.cartLine;
    await sendEvent(
      'add_to_cart',
      {
        product_id: line?.merchandise?.product?.id,
        product_title: line?.merchandise?.product?.title,
        variant_id: line?.merchandise?.id,
        quantity: line?.quantity,
        price: line?.merchandise?.price?.amount,
        currency: line?.merchandise?.price?.currencyCode,
      },
      event.context
    );
  });

  // Checkout started
  analytics.subscribe('checkout_started', async (event) => {
    const checkout = event.data?.checkout;
    await sendEvent(
      'checkout_started',
      {
        checkout_id: checkout?.token,
        value: checkout?.totalPrice?.amount,
        currency: checkout?.currencyCode,
        item_count: checkout?.lineItems?.length,
      },
      event.context
    );
  });

  // Purchase completed
  analytics.subscribe('checkout_completed', async (event) => {
    const checkout = event.data?.checkout;
    await sendEvent(
      'purchase',
      {
        orderId: checkout?.order?.id,
        order_id: checkout?.order?.id,
        checkout_id: checkout?.token,
        value: checkout?.totalPrice?.amount,
        total: checkout?.totalPrice?.amount,
        currency: checkout?.currencyCode,
        customerEmail: checkout?.email,
        item_count: checkout?.lineItems?.length,
        // Shipping address fields for CAPI
        phone: checkout?.phone,
        firstName: checkout?.shippingAddress?.firstName,
        lastName: checkout?.shippingAddress?.lastName,
        city: checkout?.shippingAddress?.city,
        state: checkout?.shippingAddress?.province,
        zip: checkout?.shippingAddress?.zip,
        country: checkout?.shippingAddress?.countryCode,
      },
      event.context
    );
  });
});
