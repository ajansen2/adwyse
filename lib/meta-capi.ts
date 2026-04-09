/**
 * Meta Conversions API (CAPI) — server-side event tracking
 *
 * Sends purchase + other key events directly from our server to Meta,
 * bypassing iOS14 / browser tracking restrictions. When used alongside
 * the browser pixel, Meta dedupes by event_id and credits the highest-
 * fidelity signal — typically the server-side one.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Required from merchant:
 *   - meta_pixel_id (16-digit number)
 *   - meta_capi_token (long-lived access token from Meta Events Manager)
 *
 * Both stored in store_settings table.
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const META_API_VERSION = 'v21.0';

export interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string; // your internal customer id
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // _fbc cookie value
  fbp?: string; // _fbp cookie value
}

export interface CapiCustomData {
  currency?: string;
  value?: number;
  contentIds?: string[];
  contentName?: string;
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  numItems?: number;
  orderId?: string;
}

export interface CapiEvent {
  eventName: 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'ViewContent' | 'PageView' | 'Lead';
  eventTime: number; // Unix seconds
  eventId?: string; // dedupe key — should match the pixel's event_id
  eventSourceUrl?: string;
  actionSource?: 'website' | 'app' | 'phone_call' | 'email' | 'system_generated';
  userData: CapiUserData;
  customData?: CapiCustomData;
}

/** SHA-256 hash, lowercase + trim, as Meta requires for PII fields */
function hash(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.toString().trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** Build Meta-format user_data object with hashed PII */
function buildUserData(u: CapiUserData): Record<string, any> {
  const out: Record<string, any> = {};
  if (u.email) out.em = [hash(u.email)];
  if (u.phone) out.ph = [hash(u.phone.replace(/\D/g, ''))];
  if (u.firstName) out.fn = [hash(u.firstName)];
  if (u.lastName) out.ln = [hash(u.lastName)];
  if (u.city) out.ct = [hash(u.city)];
  if (u.state) out.st = [hash(u.state)];
  if (u.zip) out.zp = [hash(u.zip)];
  if (u.country) out.country = [hash(u.country)];
  if (u.externalId) out.external_id = [hash(u.externalId)];
  if (u.clientIpAddress) out.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbc) out.fbc = u.fbc;
  if (u.fbp) out.fbp = u.fbp;
  return out;
}

/** Build Meta-format custom_data object */
function buildCustomData(c?: CapiCustomData): Record<string, any> | undefined {
  if (!c) return undefined;
  const out: Record<string, any> = {};
  if (c.currency) out.currency = c.currency;
  if (c.value !== undefined) out.value = c.value;
  if (c.contentIds) out.content_ids = c.contentIds;
  if (c.contentName) out.content_name = c.contentName;
  if (c.contentType) out.content_type = c.contentType;
  if (c.contents) out.contents = c.contents;
  if (c.numItems !== undefined) out.num_items = c.numItems;
  if (c.orderId) out.order_id = c.orderId;
  return out;
}

/** Get a store's CAPI credentials from store_settings */
export async function getCapiCredentials(
  storeId: string
): Promise<{ pixelId: string; accessToken: string; testCode?: string } | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from('store_settings')
    .select('meta_pixel_id, meta_capi_token, meta_capi_test_code, meta_capi_enabled')
    .eq('store_id', storeId)
    .maybeSingle();

  if (!data?.meta_capi_enabled || !data?.meta_pixel_id || !data?.meta_capi_token) {
    return null;
  }

  return {
    pixelId: data.meta_pixel_id,
    accessToken: data.meta_capi_token,
    testCode: data.meta_capi_test_code || undefined,
  };
}

/**
 * Send a single event to Meta CAPI for a given store.
 * Returns { success, eventsReceived, error? }.
 */
export async function sendCapiEvent(
  storeId: string,
  event: CapiEvent
): Promise<{ success: boolean; eventsReceived?: number; error?: string }> {
  const creds = await getCapiCredentials(storeId);
  if (!creds) {
    return { success: false, error: 'CAPI not configured for this store' };
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${creds.pixelId}/events?access_token=${creds.accessToken}`;

  const payload: any = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource || 'website',
        user_data: buildUserData(event.userData),
        custom_data: buildCustomData(event.customData),
      },
    ],
  };

  if (creds.testCode) {
    payload.test_event_code = creds.testCode;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('CAPI error:', data);
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      eventsReceived: data.events_received || 1,
    };
  } catch (err: any) {
    console.error('CAPI request failed:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Convenience: send a Purchase event from our pixel data.
 * Maps our internal event shape → CAPI shape.
 */
export async function sendCapiPurchase(
  storeId: string,
  data: {
    orderId: string;
    value: number;
    currency: string;
    customerEmail?: string;
    customerPhone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    externalId?: string;
    pageUrl?: string;
    userAgent?: string;
    ipAddress?: string;
    fbc?: string;
    fbp?: string;
    eventTime?: number; // unix seconds; defaults to now
  }
) {
  return sendCapiEvent(storeId, {
    eventName: 'Purchase',
    eventTime: data.eventTime || Math.floor(Date.now() / 1000),
    eventId: data.orderId, // use order id for dedupe with browser pixel
    eventSourceUrl: data.pageUrl,
    actionSource: 'website',
    userData: {
      email: data.customerEmail,
      phone: data.customerPhone,
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      externalId: data.externalId,
      clientIpAddress: data.ipAddress,
      clientUserAgent: data.userAgent,
      fbc: data.fbc,
      fbp: data.fbp,
    },
    customData: {
      currency: data.currency,
      value: data.value,
      orderId: data.orderId,
    },
  });
}
