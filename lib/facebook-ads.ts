/**
 * Facebook Ads API Integration
 * Fetches campaign data (spend, impressions, clicks, conversions) from Facebook Marketing API
 */

interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_time: string;
  updated_time: string;
}

interface FacebookInsights {
  date_start: string;
  date_stop: string;
  spend: number;
  impressions: number;
  clicks: number;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

/**
 * Fetch all campaigns for an ad account
 */
export async function fetchFacebookCampaigns(
  accessToken: string,
  adAccountId: string,
  datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_30d'
): Promise<FacebookCampaign[]> {
  console.log(`🔵 [FB API] fetchFacebookCampaigns called for account: ${adAccountId}`);

  try {
    const fields = [
      'id',
      'name',
      'status',
      'created_time',
      'updated_time',
      'insights.date_preset(' + datePreset + '){spend,impressions,clicks,actions}'
    ].join(',');

    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken.substring(0, 20)}...`;
    console.log(`🔵 [FB API] Request URL (truncated): ${url.split('access_token')[0]}...`);

    // Add timeout to prevent hanging - 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('🔵 [FB API] Timeout reached (10s), aborting request...');
      controller.abort();
    }, 10000); // 10 second timeout

    console.log('🔵 [FB API] Sending request to Facebook...');
    const fullUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`;

    let response: Response;
    try {
      response = await fetch(fullUrl, { signal: controller.signal });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log('🔵 [FB API] Request was aborted due to timeout');
        return []; // Return empty array on timeout
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    console.log(`🔵 [FB API] Response received. Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [FB API] Error response:', JSON.stringify(error));
      // Return empty array instead of throwing if it's just "no campaigns"
      if (error?.error?.code === 100 || error?.error?.code === 190) {
        console.log('ℹ️ [FB API] No ad account or invalid token, returning empty array');
        return [];
      }
      throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log(`🔵 [FB API] Data received. Has campaigns: ${!!data.data}, Count: ${data.data?.length || 0}`);

    if (!data.data) {
      console.log('🔵 [FB API] No data.data in response, returning empty array');
      return [];
    }

    // Transform the data
    return data.data.map((campaign: any) => {
      const insights = campaign.insights?.data?.[0];

      // Extract purchase conversions
      const conversions = insights?.actions?.find(
        (action: any) => action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase'
      )?.value || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend: parseFloat(insights?.spend || '0'),
        impressions: parseInt(insights?.impressions || '0', 10),
        clicks: parseInt(insights?.clicks || '0', 10),
        conversions: parseInt(conversions, 10),
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
      };
    });
  } catch (error) {
    console.error('❌ Error fetching Facebook campaigns:', error);
    throw error;
  }
}

/**
 * Fetch insights for a specific campaign over a date range
 */
export async function fetchCampaignInsights(
  accessToken: string,
  campaignId: string,
  dateStart: string, // YYYY-MM-DD
  dateEnd: string // YYYY-MM-DD
): Promise<FacebookInsights | null> {
  try {
    const fields = 'spend,impressions,clicks,actions';
    const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=${fields}&time_range={'since':'${dateStart}','until':'${dateEnd}'}&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const insights = data.data[0];

    return {
      date_start: insights.date_start,
      date_stop: insights.date_stop,
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0', 10),
      clicks: parseInt(insights.clicks || '0', 10),
      actions: insights.actions || [],
    };
  } catch (error) {
    console.error('❌ Error fetching campaign insights:', error);
    throw error;
  }
}

/**
 * Test if an access token is valid
 */
export async function testFacebookToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// =============================================================================
// Ad-Level (Creative) Data Fetching
// =============================================================================

export interface FacebookAd {
  id: string;
  name: string;
  status: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  creative_type: string;
  thumbnail_url?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface FacebookAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

/**
 * Fetch all ads (creatives) for an ad account
 */
export async function fetchFacebookAds(
  accessToken: string,
  adAccountId: string,
  datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_30d'
): Promise<FacebookAd[]> {
  console.log(`🔵 [FB API] fetchFacebookAds called for account: ${adAccountId}`);

  try {
    const fields = [
      'id',
      'name',
      'status',
      'adset_id',
      'campaign_id',
      'creative{thumbnail_url,object_type}',
      `insights.date_preset(${datePreset}){spend,impressions,clicks,actions}`
    ].join(',');

    const fullUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/ads?fields=${fields}&limit=500&access_token=${accessToken}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [FB API] Error fetching ads:', error);
      return [];
    }

    const data = await response.json();
    if (!data.data) return [];

    // We need to fetch adset and campaign names separately
    const adsetIds = [...new Set(data.data.map((ad: any) => ad.adset_id))];
    const campaignIds = [...new Set(data.data.map((ad: any) => ad.campaign_id))];

    // Fetch adset names
    const adsetNames = await fetchAdSetNames(accessToken, adsetIds as string[]);
    // Fetch campaign names
    const campaignNames = await fetchCampaignNames(accessToken, campaignIds as string[]);

    return data.data.map((ad: any) => {
      const insights = ad.insights?.data?.[0];
      const conversions = insights?.actions?.find(
        (a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )?.value || 0;

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        adset_id: ad.adset_id,
        adset_name: adsetNames[ad.adset_id] || '',
        campaign_id: ad.campaign_id,
        campaign_name: campaignNames[ad.campaign_id] || '',
        creative_type: ad.creative?.object_type || 'unknown',
        thumbnail_url: ad.creative?.thumbnail_url,
        spend: parseFloat(insights?.spend || '0'),
        impressions: parseInt(insights?.impressions || '0', 10),
        clicks: parseInt(insights?.clicks || '0', 10),
        conversions: parseInt(conversions, 10)
      };
    });
  } catch (error) {
    console.error('❌ Error fetching Facebook ads:', error);
    return [];
  }
}

/**
 * Fetch all ad sets for an ad account
 */
export async function fetchFacebookAdSets(
  accessToken: string,
  adAccountId: string,
  datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_30d'
): Promise<FacebookAdSet[]> {
  console.log(`🔵 [FB API] fetchFacebookAdSets called for account: ${adAccountId}`);

  try {
    const fields = [
      'id',
      'name',
      'status',
      'campaign_id',
      `insights.date_preset(${datePreset}){spend,impressions,clicks,actions}`
    ].join(',');

    const fullUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets?fields=${fields}&limit=500&access_token=${accessToken}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.data) return [];

    const campaignIds = [...new Set(data.data.map((adset: any) => adset.campaign_id))];
    const campaignNames = await fetchCampaignNames(accessToken, campaignIds as string[]);

    return data.data.map((adset: any) => {
      const insights = adset.insights?.data?.[0];
      const conversions = insights?.actions?.find(
        (a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )?.value || 0;

      return {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        campaign_id: adset.campaign_id,
        campaign_name: campaignNames[adset.campaign_id] || '',
        spend: parseFloat(insights?.spend || '0'),
        impressions: parseInt(insights?.impressions || '0', 10),
        clicks: parseInt(insights?.clicks || '0', 10),
        conversions: parseInt(conversions, 10)
      };
    });
  } catch (error) {
    console.error('❌ Error fetching Facebook ad sets:', error);
    return [];
  }
}

/**
 * Helper: Fetch adset names by IDs
 */
async function fetchAdSetNames(
  accessToken: string,
  adsetIds: string[]
): Promise<Record<string, string>> {
  if (adsetIds.length === 0) return {};

  try {
    const url = `https://graph.facebook.com/v18.0/?ids=${adsetIds.join(',')}&fields=name&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) return {};

    const data = await response.json();
    const names: Record<string, string> = {};
    for (const id of adsetIds) {
      if (data[id]?.name) {
        names[id] = data[id].name;
      }
    }
    return names;
  } catch {
    return {};
  }
}

/**
 * Helper: Fetch campaign names by IDs
 */
async function fetchCampaignNames(
  accessToken: string,
  campaignIds: string[]
): Promise<Record<string, string>> {
  if (campaignIds.length === 0) return {};

  try {
    const url = `https://graph.facebook.com/v18.0/?ids=${campaignIds.join(',')}&fields=name&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) return {};

    const data = await response.json();
    const names: Record<string, string> = {};
    for (const id of campaignIds) {
      if (data[id]?.name) {
        names[id] = data[id].name;
      }
    }
    return names;
  } catch {
    return {};
  }
}

/**
 * Fetch ad-level insights with daily breakdown
 */
export async function fetchAdInsightsDaily(
  accessToken: string,
  adAccountId: string,
  dateStart: string,
  dateEnd: string
): Promise<Array<{
  ad_id: string;
  ad_name: string;
  adset_id: string;
  campaign_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}>> {
  try {
    const fields = [
      'ad_id',
      'ad_name',
      'adset_id',
      'campaign_id',
      'spend',
      'impressions',
      'clicks',
      'actions'
    ].join(',');

    const timeRange = encodeURIComponent(JSON.stringify({ since: dateStart, until: dateEnd }));
    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/insights?fields=${fields}&level=ad&time_increment=1&time_range=${timeRange}&limit=500&access_token=${accessToken}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.data) return [];

    return data.data.map((row: any) => {
      const conversions = row.actions?.find(
        (a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )?.value || 0;

      return {
        ad_id: row.ad_id,
        ad_name: row.ad_name,
        adset_id: row.adset_id,
        campaign_id: row.campaign_id,
        date: row.date_start,
        spend: parseFloat(row.spend || '0'),
        impressions: parseInt(row.impressions || '0', 10),
        clicks: parseInt(row.clicks || '0', 10),
        conversions: parseInt(conversions, 10)
      };
    });
  } catch (error) {
    console.error('Error fetching daily ad insights:', error);
    return [];
  }
}
