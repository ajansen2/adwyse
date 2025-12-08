/**
 * TikTok Ads API Integration
 * Fetches campaign data (spend, impressions, clicks, conversions) from TikTok Marketing API
 */

interface TikTokCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface TikTokAdvertiser {
  advertiserId: string;
  advertiserName: string;
}

/**
 * Get the OAuth URL for TikTok Ads authorization
 */
export function getTikTokAuthUrl(storeId: string): string {
  const appId = process.env.TIKTOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

  const params = new URLSearchParams({
    app_id: appId!,
    redirect_uri: redirectUri,
    state: storeId,
    rid: Math.random().toString(36).substring(7), // Random ID to prevent caching
  });

  return `https://business-api.tiktok.com/portal/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTikTokCode(authCode: string): Promise<{
  accessToken: string;
  advertisers: TikTokAdvertiser[];
}> {
  const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: authCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`);
  }

  const accessToken = data.data.access_token;
  const advertisers: TikTokAdvertiser[] = (data.data.advertiser_ids || []).map((id: string) => ({
    advertiserId: id,
    advertiserName: `Advertiser ${id}`, // Will be updated with actual name
  }));

  return { accessToken, advertisers };
}

/**
 * Get advertiser info
 */
export async function getTikTokAdvertiserInfo(
  accessToken: string,
  advertiserId: string
): Promise<TikTokAdvertiser | null> {
  try {
    const params = new URLSearchParams({
      advertiser_ids: JSON.stringify([advertiserId]),
    });

    const response = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Access-Token': accessToken,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data?.list?.[0]) {
      return null;
    }

    const advertiser = data.data.list[0];
    return {
      advertiserId: advertiser.advertiser_id,
      advertiserName: advertiser.advertiser_name || `Advertiser ${advertiser.advertiser_id}`,
    };
  } catch (error) {
    console.error('Error fetching advertiser info:', error);
    return null;
  }
}

/**
 * Fetch campaigns for a TikTok advertiser
 */
export async function fetchTikTokCampaigns(
  accessToken: string,
  advertiserId: string
): Promise<TikTokCampaign[]> {
  console.log(`🔵 [TikTok] Fetching campaigns for advertiser: ${advertiserId}`);

  try {
    // First, get campaign list
    const campaignResponse = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/campaign/get/',
      {
        method: 'GET',
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertiser_id: advertiserId,
          page_size: 100,
        }),
      }
    );

    // Use POST for campaign list as per TikTok API
    const campaignListResponse = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/campaign/get/',
      {
        method: 'POST',
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertiser_id: advertiserId,
          page_size: 100,
        }),
      }
    );

    if (!campaignListResponse.ok) {
      console.error('Failed to fetch TikTok campaigns');
      return [];
    }

    const campaignData = await campaignListResponse.json();

    if (campaignData.code !== 0) {
      console.error('TikTok API error:', campaignData.message);
      return [];
    }

    const campaignList = campaignData.data?.list || [];

    if (campaignList.length === 0) {
      console.log('🔵 [TikTok] No campaigns found');
      return [];
    }

    // Get campaign IDs for metrics
    const campaignIds = campaignList.map((c: any) => c.campaign_id);

    // Fetch metrics for campaigns (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const metricsResponse = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
      {
        method: 'POST',
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertiser_id: advertiserId,
          report_type: 'BASIC',
          dimensions: ['campaign_id'],
          metrics: ['spend', 'impressions', 'clicks', 'conversion'],
          data_level: 'AUCTION_CAMPAIGN',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          page_size: 100,
          filtering: {
            campaign_ids: campaignIds,
          },
        }),
      }
    );

    let metricsMap: Record<string, any> = {};

    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      if (metricsData.code === 0 && metricsData.data?.list) {
        for (const metric of metricsData.data.list) {
          metricsMap[metric.dimensions.campaign_id] = metric.metrics;
        }
      }
    }

    // Combine campaign info with metrics
    const campaigns: TikTokCampaign[] = campaignList.map((campaign: any) => {
      const metrics = metricsMap[campaign.campaign_id] || {};

      return {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: campaign.status,
        spend: parseFloat(metrics.spend || '0'),
        impressions: parseInt(metrics.impressions || '0', 10),
        clicks: parseInt(metrics.clicks || '0', 10),
        conversions: parseInt(metrics.conversion || '0', 10),
      };
    });

    console.log(`🔵 [TikTok] Found ${campaigns.length} campaigns`);
    return campaigns;

  } catch (error) {
    console.error('Error fetching TikTok campaigns:', error);
    return [];
  }
}

/**
 * Test if an access token is valid
 */
export async function testTikTokToken(accessToken: string, advertiserId: string): Promise<boolean> {
  try {
    const info = await getTikTokAdvertiserInfo(accessToken, advertiserId);
    return info !== null;
  } catch (error) {
    return false;
  }
}
