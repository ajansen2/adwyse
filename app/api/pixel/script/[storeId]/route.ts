import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Pixel Script Generator
 * Generates a lightweight tracking script for each store
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;

  if (!storeId) {
    return new NextResponse('// Invalid store ID', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  // Verify store exists and pixel is enabled
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: store } = await supabase
    .from('adwyse_stores')
    .select('id, shop_domain')
    .eq('id', storeId)
    .single();

  if (!store) {
    return new NextResponse('// Store not found', {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  // Get pixel config
  const { data: config } = await supabase
    .from('pixel_config')
    .select('*')
    .eq('store_id', storeId)
    .single();

  const pixelConfig = config || {
    track_page_views: true,
    track_add_to_cart: true,
    track_checkout: true,
    track_purchase: true
  };

  // Generate the tracking script
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.adwyse.io';

  const script = `
(function() {
  'use strict';

  // AdWyse First-Party Pixel v1.0
  var STORE_ID = '${storeId}';
  var ENDPOINT = '${baseUrl}/api/pixel/event';
  var CONFIG = {
    trackPageViews: ${pixelConfig.track_page_views},
    trackAddToCart: ${pixelConfig.track_add_to_cart},
    trackCheckout: ${pixelConfig.track_checkout},
    trackPurchase: ${pixelConfig.track_purchase}
  };

  // Generate or retrieve visitor ID (first-party cookie)
  function getVisitorId() {
    var cookieName = '_adw_vid';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName + '=') === 0) {
        return cookie.substring(cookieName.length + 1);
      }
    }
    // Generate new visitor ID
    var vid = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    var expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = cookieName + '=' + vid + ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
    return vid;
  }

  // Generate session ID
  function getSessionId() {
    var sessionKey = '_adw_sid';
    var sid = sessionStorage.getItem(sessionKey);
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(sessionKey, sid);
    }
    return sid;
  }

  // Parse URL parameters
  function getUrlParams() {
    var params = {};
    var search = window.location.search.substring(1);
    if (search) {
      var pairs = search.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
    }
    return params;
  }

  // Store UTM parameters on landing
  function captureAttribution() {
    var params = getUrlParams();
    var attrKey = '_adw_attr';

    // Check if we have new attribution params
    if (params.utm_source || params.fbclid || params.gclid || params.ttclid) {
      var attr = {
        utm_source: params.utm_source || '',
        utm_medium: params.utm_medium || '',
        utm_campaign: params.utm_campaign || '',
        utm_content: params.utm_content || '',
        utm_term: params.utm_term || '',
        fbclid: params.fbclid || '',
        gclid: params.gclid || '',
        ttclid: params.ttclid || '',
        referrer: document.referrer || '',
        landing_page: window.location.href,
        captured_at: Date.now()
      };
      sessionStorage.setItem(attrKey, JSON.stringify(attr));
      return attr;
    }

    // Return existing attribution from session
    try {
      var stored = sessionStorage.getItem(attrKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  // Detect device type
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Send event to server
  function trackEvent(eventType, eventData) {
    var vid = getVisitorId();
    var sid = getSessionId();
    var attr = captureAttribution();

    var payload = {
      storeId: STORE_ID,
      eventType: eventType,
      eventData: eventData || {},
      visitorId: vid,
      sessionId: sid,
      utmSource: attr.utm_source,
      utmMedium: attr.utm_medium,
      utmCampaign: attr.utm_campaign,
      utmContent: attr.utm_content,
      utmTerm: attr.utm_term,
      fbclid: attr.fbclid,
      gclid: attr.gclid,
      ttclid: attr.ttclid,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      clientTimestamp: new Date().toISOString()
    };

    // Use sendBeacon if available for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // Auto-track page views
  if (CONFIG.trackPageViews) {
    trackEvent('page_view');
  }

  // Listen for Shopify events
  if (typeof Shopify !== 'undefined' && Shopify.analytics) {
    // Add to cart
    if (CONFIG.trackAddToCart) {
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target !== document) {
          if (target.matches && (
            target.matches('[name="add"]') ||
            target.matches('.add-to-cart') ||
            target.matches('[data-add-to-cart]') ||
            target.matches('button[type="submit"][name="add"]')
          )) {
            var form = target.closest('form');
            if (form) {
              var productId = form.querySelector('[name="id"]');
              var quantity = form.querySelector('[name="quantity"]');
              trackEvent('add_to_cart', {
                product_id: productId ? productId.value : null,
                quantity: quantity ? parseInt(quantity.value) : 1
              });
            }
            break;
          }
          target = target.parentNode;
        }
      });
    }
  }

  // Expose global tracking function
  window.adwyse = {
    track: trackEvent,
    identify: function(email) {
      if (email) {
        sessionStorage.setItem('_adw_email', email);
        trackEvent('identify', { email: email });
      }
    },
    trackPurchase: function(orderData) {
      if (CONFIG.trackPurchase) {
        trackEvent('purchase', orderData);
      }
    },
    trackCheckout: function(checkoutData) {
      if (CONFIG.trackCheckout) {
        trackEvent('checkout_started', checkoutData);
      }
    }
  };

  // Auto-detect checkout page
  if (CONFIG.trackCheckout && window.location.pathname.includes('/checkout')) {
    trackEvent('checkout_started');
  }

  console.log('AdWyse pixel loaded');
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*'
    }
  });
}
