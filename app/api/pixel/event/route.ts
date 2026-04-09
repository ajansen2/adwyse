import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordTouchpoint, determineTouchpointType } from '@/lib/attribution-engine';
import { sendCapiPurchase } from '@/lib/meta-capi';

/**
 * Pixel Event Receiver
 * Receives and stores events from the tracking pixel
 */

interface PixelEventPayload {
  storeId: string;
  eventType: string;
  eventData?: Record<string, any>;
  visitorId: string;
  sessionId?: string;
  customerEmail?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
  clientTimestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse body - handle both JSON and beacon (text) requests
    let payload: PixelEventPayload;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const text = await request.text();
      payload = JSON.parse(text);
    }

    const { storeId, eventType, visitorId } = payload;

    if (!storeId || !eventType || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check for duplicate events (deduplication)
    const dedupWindow = 5; // minutes
    const dedupTime = new Date();
    dedupTime.setMinutes(dedupTime.getMinutes() - dedupWindow);

    const { data: existingEvent } = await supabase
      .from('pixel_events')
      .select('id')
      .eq('store_id', storeId)
      .eq('visitor_id', visitorId)
      .eq('event_type', eventType)
      .gte('created_at', dedupTime.toISOString())
      .maybeSingle();

    if (existingEvent && eventType === 'page_view') {
      // Skip duplicate page views
      return NextResponse.json(
        { success: true, deduplicated: true },
        { headers: corsHeaders() }
      );
    }

    // Parse user agent for browser/OS info
    const browserInfo = parseUserAgent(payload.userAgent || '');

    // Store event
    const { error: eventError } = await supabase
      .from('pixel_events')
      .insert({
        store_id: storeId,
        event_type: eventType,
        event_data: payload.eventData || {},
        visitor_id: visitorId,
        session_id: payload.sessionId,
        customer_email: payload.customerEmail,
        utm_source: payload.utmSource,
        utm_medium: payload.utmMedium,
        utm_campaign: payload.utmCampaign,
        utm_content: payload.utmContent,
        utm_term: payload.utmTerm,
        fbclid: payload.fbclid,
        gclid: payload.gclid,
        ttclid: payload.ttclid,
        page_url: payload.pageUrl,
        page_title: payload.pageTitle,
        referrer: payload.referrer,
        user_agent: payload.userAgent,
        device_type: payload.deviceType,
        browser: browserInfo.browser,
        os: browserInfo.os,
        client_timestamp: payload.clientTimestamp
          ? new Date(payload.clientTimestamp).toISOString()
          : null
      });

    if (eventError) {
      console.error('Error storing pixel event:', eventError);
      // Don't fail the request - pixel should be resilient
    }

    // Forward purchase events to Meta Conversions API (server-side tracking)
    // for stores that have CAPI enabled. This recovers attribution lost to
    // iOS14 / browser tracking restrictions. Fire-and-forget so we never
    // block the pixel response.
    if (eventType === 'purchase') {
      const orderId = String(payload.eventData?.orderId || payload.eventData?.order_id || '');
      const value = parseFloat(payload.eventData?.value || payload.eventData?.total || 0);
      const currency = String(payload.eventData?.currency || 'USD');

      if (orderId && value > 0) {
        // Extract IP from forwarded headers
        const ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          undefined;

        sendCapiPurchase(storeId, {
          orderId,
          value,
          currency,
          customerEmail: payload.customerEmail,
          customerPhone: payload.eventData?.phone,
          firstName: payload.eventData?.firstName,
          lastName: payload.eventData?.lastName,
          city: payload.eventData?.city,
          state: payload.eventData?.state,
          zip: payload.eventData?.zip,
          country: payload.eventData?.country,
          externalId: visitorId,
          pageUrl: payload.pageUrl,
          userAgent: payload.userAgent,
          ipAddress,
          fbc: payload.fbclid ? `fb.1.${Date.now()}.${payload.fbclid}` : undefined,
          fbp: payload.eventData?.fbp,
        })
          .then(async (result) => {
            // Log the result for observability
            await supabase.from('meta_capi_events_log').insert({
              store_id: storeId,
              event_name: 'Purchase',
              event_id: orderId,
              order_id: orderId,
              value,
              success: result.success,
              error: result.error || null,
            });
          })
          .catch((err) => {
            console.error('CAPI fire-and-forget failed:', err);
          });
      }
    }

    // Record touchpoint for attribution if we have attribution data
    if (payload.utmSource || payload.fbclid || payload.gclid || payload.ttclid) {
      try {
        const touchpointType = determineTouchpointType({
          utmSource: payload.utmSource,
          utmMedium: payload.utmMedium,
          fbclid: payload.fbclid,
          gclid: payload.gclid,
          ttclid: payload.ttclid,
          referrer: payload.referrer
        });

        // Use visitor ID as customer identifier for now
        // This will be linked to email when customer identifies
        await recordTouchpoint(storeId, visitorId, {
          identifierType: 'cookie',
          touchpointType,
          utmSource: payload.utmSource,
          utmMedium: payload.utmMedium,
          utmCampaign: payload.utmCampaign,
          utmContent: payload.utmContent,
          utmTerm: payload.utmTerm,
          fbclid: payload.fbclid,
          gclid: payload.gclid,
          ttclid: payload.ttclid,
          landingPage: payload.pageUrl,
          referrer: payload.referrer,
          sessionId: payload.sessionId,
          deviceType: payload.deviceType
        });
      } catch (touchpointError) {
        console.error('Error recording touchpoint:', touchpointError);
      }
    }

    // Update pixel config last_event_at
    await supabase
      .from('pixel_config')
      .upsert({
        store_id: storeId,
        is_verified: true,
        last_event_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_id'
      });

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders() }
    );

  } catch (error) {
    console.error('Pixel event error:', error);
    return NextResponse.json(
      { success: true }, // Return success to not break pixel
      { headers: corsHeaders() }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

/**
 * Simple user agent parser
 */
function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
    browser = 'Internet Explorer';
  }

  // OS detection
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return { browser, os };
}
