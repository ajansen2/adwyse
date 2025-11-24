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
  try {
    const fields = [
      'id',
      'name',
      'status',
      'created_time',
      'updated_time',
      'insights.date_preset(' + datePreset + '){spend,impressions,clicks,actions}'
    ].join(',');

    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`;

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Facebook API error response:', error);
      // Return empty array instead of throwing if it's just "no campaigns"
      if (error?.error?.code === 100 || error?.error?.code === 190) {
        console.log('ℹ️ No ad account or invalid token, returning empty array');
        return [];
      }
      throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (!data.data) {
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
