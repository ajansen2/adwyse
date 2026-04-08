/**
 * Apify Facebook Ad Library Scraper integration
 * Actor: curious_coder/facebook-ads-library-scraper
 * Pricing: $0.75 per 1,000 results
 *
 * Docs: https://apify.com/curious_coder/facebook-ads-library-scraper
 */

import { createClient } from '@supabase/supabase-js';

const APIFY_ACTOR_ID = 'curious_coder~facebook-ads-library-scraper';
const APIFY_API_BASE = 'https://api.apify.com/v2';
const CACHE_TTL_HOURS = 24;
const DEFAULT_LIMIT = 20;

export interface ApifyAd {
  id: string;
  advertiserName: string;
  adCreativeBody: string;
  adCreativeTitle?: string;
  thumbnailUrl?: string;
  snapshotUrl?: string;
  platform: 'facebook' | 'instagram' | 'both';
  adType: 'image' | 'video' | 'carousel';
  isActive: boolean;
  startedRunning: string;
  impressionRange?: string;
  spendRange?: string;
}

/**
 * Build the Facebook Ad Library search URL the actor expects.
 */
function buildAdLibraryUrl(query: string, country = 'ALL'): string {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    q: query,
    search_type: 'keyword_unordered',
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

/**
 * Normalize a raw Apify result into our ApifyAd shape.
 * The actor returns slightly different field names depending on ad type;
 * this maps the most common ones defensively.
 */
/** Pick the first non-empty string from a list of candidates. */
function pick(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

/** Walk an object recursively to find the first string at any of the given keys. */
function deepFind(obj: any, keys: string[], maxDepth = 4): string | undefined {
  if (!obj || maxDepth < 0) return undefined;
  if (typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === 'string' && obj[k].trim()) return obj[k];
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        const found = deepFind(item, keys, maxDepth - 1);
        if (found) return found;
      }
    } else if (typeof v === 'object') {
      const found = deepFind(v, keys, maxDepth - 1);
      if (found) return found;
    }
  }
  return undefined;
}

function normalizeApifyResult(raw: any): ApifyAd {
  const snapshot = raw.snapshot || raw.ad_snapshot || raw.adSnapshot || {};

  const advertiser =
    pick(
      snapshot.page_name,
      snapshot.pageName,
      raw.page_name,
      raw.pageName,
      raw.advertiserName,
      raw.advertiser_name,
      raw.advertiser,
      snapshot.byline,
      raw.byline
    ) ||
    deepFind(raw, ['page_name', 'pageName', 'advertiserName', 'advertiser_name']) ||
    'Unknown';

  const body =
    pick(
      snapshot.body?.text,
      snapshot.body?.markup?.__html,
      snapshot.bodyText,
      raw.ad_creative_body,
      raw.adCreativeBody,
      raw.body?.text,
      raw.body,
      raw.text,
      raw.creative_body,
      snapshot.link_description,
      snapshot.caption
    ) ||
    deepFind(raw, ['text', 'body', 'caption', 'description', 'message']) ||
    '';

  const title = pick(
    snapshot.title,
    snapshot.titleText,
    raw.ad_creative_title,
    raw.adCreativeTitle,
    raw.title,
    raw.headline,
    snapshot.link_url
  );

  // Platform detection
  const platforms: string[] = (
    raw.publisher_platforms ||
    raw.publisherPlatform ||
    raw.publisher_platform ||
    raw.platforms ||
    snapshot.publisher_platforms ||
    []
  )
    .map((p: any) => (typeof p === 'string' ? p.toLowerCase() : ''))
    .filter(Boolean);
  let platform: 'facebook' | 'instagram' | 'both' = 'facebook';
  const hasFb = platforms.some((p) => p.includes('facebook'));
  const hasIg = platforms.some((p) => p.includes('instagram'));
  if (hasFb && hasIg) platform = 'both';
  else if (hasIg) platform = 'instagram';

  // Ad type detection
  const videos = snapshot.videos || raw.videos || [];
  const cards = snapshot.cards || raw.cards || [];
  let adType: 'image' | 'video' | 'carousel' = 'image';
  if ((Array.isArray(videos) && videos.length) || raw.has_video) adType = 'video';
  else if (Array.isArray(cards) && cards.length > 1) adType = 'carousel';

  const thumb = pick(
    videos?.[0]?.video_preview_image_url,
    videos?.[0]?.videoPreviewImageURL,
    snapshot.images?.[0]?.original_image_url,
    snapshot.images?.[0]?.originalImageURL,
    snapshot.images?.[0]?.resized_image_url,
    snapshot.images?.[0]?.resizedImageURL,
    raw.thumbnail_url,
    raw.thumbnailUrl,
    raw.image_url,
    raw.imageUrl
  );

  const archiveId = raw.ad_archive_id || raw.adArchiveID || raw.adArchiveId || raw.id;

  return {
    id: String(archiveId || crypto.randomUUID()),
    advertiserName: advertiser,
    adCreativeBody: body,
    adCreativeTitle: title,
    thumbnailUrl: thumb,
    snapshotUrl:
      raw.snapshot_url ||
      raw.snapshotUrl ||
      raw.url ||
      (archiveId
        ? `https://www.facebook.com/ads/library/?id=${archiveId}`
        : undefined),
    platform,
    adType,
    isActive: raw.is_active !== false && raw.isActive !== false,
    startedRunning:
      pick(
        raw.start_date_string,
        raw.startDateString,
        raw.startedRunning,
        raw.start_date,
        raw.startDate
      ) || new Date().toISOString().split('T')[0],
    impressionRange: pick(
      raw.impressions?.text,
      raw.impressionsText,
      raw.impressionRange,
      snapshot.impressions?.text
    ),
    spendRange: pick(raw.spend?.text, raw.spendText, raw.spendRange, snapshot.spend?.text),
  };
}

/**
 * Run the Apify actor and return RAW results (no normalization).
 * Used by debug endpoint.
 */
export async function runApifyScraperRaw(
  query: string,
  limit: number
): Promise<any[] | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) return null;

  const url = `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiToken}`;
  // Actor requires minimum 10 charged results
  const input = {
    urls: [{ url: buildAdLibraryUrl(query) }],
    count: Math.max(10, limit),
    scrapeAdDetails: false,
    'scrapePageAds.activeStatus': 'active',
    period: '',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify error ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

/**
 * Run the Apify actor synchronously and get results.
 * Uses run-sync-get-dataset-items endpoint so we get results in one call.
 */
async function runApifyScraper(
  query: string,
  limit: number,
  apiToken: string
): Promise<ApifyAd[]> {
  const url = `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiToken}`;

  const input = {
    urls: [{ url: buildAdLibraryUrl(query) }],
    count: limit,
    'scrapeAdDetails': false,
    'scrapePageAds.activeStatus': 'active',
    period: '',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Apify returned non-array result');
  }

  return data.slice(0, limit).map(normalizeApifyResult);
}

/**
 * Get cached results from Supabase (if not expired).
 */
async function getCachedResults(queryKey: string): Promise<ApifyAd[] | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data } = await supabase
      .from('competitor_ads_cache')
      .select('results, expires_at')
      .eq('query_key', queryKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    return data ? (data.results as ApifyAd[]) : null;
  } catch (err) {
    console.error('Cache lookup failed:', err);
    return null;
  }
}

/**
 * Save results to cache.
 */
async function setCachedResults(
  queryKey: string,
  queryValue: string,
  results: ApifyAd[]
): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    await supabase
      .from('competitor_ads_cache')
      .upsert(
        {
          query_key: queryKey,
          query_value: queryValue,
          source: 'apify',
          results,
          result_count: results.length,
          fetched_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'query_key' }
      );
  } catch (err) {
    console.error('Cache write failed:', err);
  }
}

/**
 * Public entry: fetch competitor ads for a query.
 * Caches results in Supabase for 24h to limit Apify spend.
 * Returns null if APIFY_API_TOKEN is not configured (caller should fall back to demo data).
 */
export async function fetchCompetitorAds(
  query: string,
  limit = DEFAULT_LIMIT
): Promise<ApifyAd[] | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) return null;
  if (!query?.trim()) return [];

  const queryKey = `apify:${query.toLowerCase().trim()}:${limit}`;

  // Check cache first
  const cached = await getCachedResults(queryKey);
  if (cached) {
    console.log(`📦 Cache hit for "${query}" (${cached.length} ads)`);
    return cached;
  }

  // Run scraper
  console.log(`🕷️  Running Apify scraper for "${query}"`);
  const results = await runApifyScraper(query, limit, apiToken);

  // Cache results (don't await — fire and forget)
  setCachedResults(queryKey, query, results).catch(() => {});

  return results;
}
