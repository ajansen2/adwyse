/**
 * Google Ads API Integration
 * Fetches campaign data (spend, impressions, clicks, conversions) from Google Ads API
 */

interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface GoogleAdsCustomer {
  customerId: string;
  descriptiveName: string;
}

/**
 * Get the OAuth URL for Google Ads authorization
 */
export function getGoogleAdsAuthUrl(storeId: string): string {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/adwords',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state: storeId, // Pass store ID in state for callback
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh the access token using refresh token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get accessible Google Ads customer accounts
 */
export async function getGoogleAdsCustomers(accessToken: string): Promise<GoogleAdsCustomer[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  console.log('🔵 [Google Ads] Fetching accessible customers...');
  console.log('🔵 [Google Ads] Developer token present:', !!developerToken);
  console.log('🔵 [Google Ads] Developer token (first 10 chars):', developerToken?.substring(0, 10) + '...');
  console.log('🔵 [Google Ads] Access token (first 20 chars):', accessToken?.substring(0, 20) + '...');

  const response = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken!,
    },
  });

  const responseText = await response.text();
  console.log('🔵 [Google Ads] Response status:', response.status);
  console.log('🔵 [Google Ads] Response content-type:', response.headers.get('content-type'));
  console.log('🔵 [Google Ads] Full response:', responseText);

  if (!response.ok) {
    console.error('❌ [Google Ads] Failed to get customers. Raw response:', responseText);

    // Try to parse as JSON for detailed error info
    let errorMessage: string;
    let errorDetails: string = '';
    try {
      const error = JSON.parse(responseText);
      // Extract detailed error information
      const errorObj = error?.error;
      errorMessage = errorObj?.message || 'Unknown error';

      // Check for specific error codes
      if (errorObj?.details) {
        for (const detail of errorObj.details) {
          if (detail.errors) {
            for (const err of detail.errors) {
              errorDetails += `\n  - ${err.errorCode?.authorizationError || err.errorCode?.requestError || 'Error'}: ${err.message}`;
            }
          }
        }
      }

      console.error('❌ [Google Ads] Error code:', errorObj?.code);
      console.error('❌ [Google Ads] Error status:', errorObj?.status);
      console.error('❌ [Google Ads] Error details:', errorDetails || 'None');

      // Common error explanations
      if (errorMessage.includes('not implemented') || errorMessage.includes('not supported') || errorMessage.includes('not enabled')) {
        console.error('❌ [Google Ads] This error usually means:');
        console.error('   1. Developer token is in TEST mode (can only access test accounts)');
        console.error('   2. Developer token approval is still pending');
        console.error('   3. API access level is insufficient');
        console.error('   Check: https://ads.google.com/nav/selectaccount → Tools & Settings → API Center');
      }
    } catch {
      // HTML response - extract title or first meaningful text
      const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i);
      errorMessage = titleMatch ? titleMatch[1] : `HTTP ${response.status}: Non-JSON response from Google API`;
    }
    throw new Error(`Google Ads API error: ${errorMessage}${errorDetails}`);
  }

  // Parse the successful response
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error('Failed to parse successful response:', responseText.substring(0, 500));
    throw new Error('Invalid response from Google Ads API');
  }
  const customerResourceNames = data.resourceNames || [];

  // Fetch details for each customer
  const customers: GoogleAdsCustomer[] = [];

  for (const resourceName of customerResourceNames) {
    const customerId = resourceName.replace('customers/', '');

    try {
      const customerResponse = await fetch(
        `https://googleads.googleapis.com/v18/customers/${customerId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken!,
          },
        }
      );

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customers.push({
          customerId: customerId,
          descriptiveName: customerData.descriptiveName || `Account ${customerId}`,
        });
      }
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
    }
  }

  return customers;
}

/**
 * Fetch campaigns for a Google Ads customer
 */
export async function fetchGoogleAdsCampaigns(
  accessToken: string,
  customerId: string,
  refreshToken?: string
): Promise<GoogleAdsCampaign[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  // Remove dashes from customer ID if present
  const cleanCustomerId = customerId.replace(/-/g, '');

  console.log(`🔵 [Google Ads] Fetching campaigns for customer: ${cleanCustomerId}`);

  // Build the GAQL query for campaign performance
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
  `;

  try {
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Ads API error:', error);

      // If token expired and we have refresh token, try to refresh
      if (response.status === 401 && refreshToken) {
        console.log('Token expired, refreshing...');
        const newTokens = await refreshGoogleToken(refreshToken);
        return fetchGoogleAdsCampaigns(newTokens.accessToken, customerId);
      }

      return [];
    }

    const data = await response.json();

    // Parse the streaming response
    const campaigns: GoogleAdsCampaign[] = [];

    if (Array.isArray(data)) {
      for (const batch of data) {
        if (batch.results) {
          for (const result of batch.results) {
            const campaign = result.campaign;
            const metrics = result.metrics || {};

            campaigns.push({
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              spend: (metrics.costMicros || 0) / 1000000, // Convert micros to dollars
              impressions: metrics.impressions || 0,
              clicks: metrics.clicks || 0,
              conversions: metrics.conversions || 0,
            });
          }
        }
      }
    }

    console.log(`🔵 [Google Ads] Found ${campaigns.length} campaigns`);
    return campaigns;

  } catch (error) {
    console.error('Error fetching Google Ads campaigns:', error);
    return [];
  }
}

/**
 * Test if an access token is valid
 */
export async function testGoogleAdsToken(accessToken: string): Promise<boolean> {
  try {
    const customers = await getGoogleAdsCustomers(accessToken);
    return customers.length > 0;
  } catch (error) {
    return false;
  }
}
