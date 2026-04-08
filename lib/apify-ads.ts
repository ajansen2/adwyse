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
function normalizeApifyResult(raw: any): ApifyAd {
  const snapshot = raw.snapshot || raw.ad_snapshot || {};
  const body =
    snapshot.body?.text ||
    raw.ad_creative_body ||
    raw.adCreativeBody ||
    raw.body ||
    '';
  const title =
    snapshot.title ||
    raw.ad_creative_title ||
    raw.adCreativeTitle ||
    raw.title ||
    '';
  const advertiser =
    snapshot.page_name ||
    raw.page_name ||
    raw.advertiserName ||
    raw.advertiser_name ||
    'Unknown';

  // Platform: Apify returns publisher_platforms array
  const platforms: string[] = raw.publisher_platforms || raw.platforms || [];
  let platform: 'facebook' | 'instagram' | 'both' = 'facebook';
  const hasFb = platforms.some((p) => p?.toLowerCase().includes('facebook'));
  const hasIg = platforms.some((p) => p?.toLowerCase().includes('instagram'));
  if (hasFb && hasIg) platform = 'both';
  else if (hasIg) platform = 'instagram';

  // Ad type detection
  let adType: 'image' | 'video' | 'carousel' = 'image';
  if (snapshot.videos?.length || raw.has_video) adType = 'video';
  else if (snapshot.cards?.length > 1 || raw.is_carousel) adType = 'carousel';

  const thumb =
    snapshot.videos?.[0]?.video_preview_image_url ||
    snapshot.images?.[0]?.original_image_url ||
    snapshot.images?.[0]?.resized_image_url ||
    raw.thumbnail_url ||
    raw.thumbnailUrl;

  return {
    id: String(raw.ad_archive_id || raw.id || raw.adArchiveID || crypto.randomUUID()),
    advertiserName: advertiser,
    adCreativeBody: body,
    adCreativeTitle: title || undefined,
    thumbnailUrl: thumb,
    snapshotUrl:
      raw.snapshot_url ||
      (raw.ad_archive_id
        ? `https://www.facebook.com/ads/library/?id=${raw.ad_archive_id}`
        : undefined),
    platform,
    adType,
    isActive: raw.is_active !== false,
    startedRunning:
      raw.start_date_string ||
      raw.startedRunning ||
      raw.start_date ||
      new Date().toISOString().split('T')[0],
    impressionRange: raw.impressions?.text || raw.impressionRange,
    spendRange: raw.spend?.text || raw.spendRange,
  };
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
