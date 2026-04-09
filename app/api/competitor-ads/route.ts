import { NextRequest, NextResponse } from 'next/server';
import { fetchCompetitorAds } from '@/lib/apify-ads';
import { requireProFeature } from '@/lib/subscription-tiers';

/**
 * Competitor Ad Spy API
 *
 * Data sources (in order of preference):
 *   1. Apify Facebook Ad Library scraper (when APIFY_API_TOKEN is set
 *      and a search query is provided) — real, live ads with 24h caching
 *   2. Demo seed data — fallback when no token or no query
 */

interface CompetitorAd {
  id: string;
  advertiserName: string;
  adCreativeLink?: string;
  adCreativeBody: string;
  adCreativeTitle?: string;
  thumbnailUrl?: string;
  platform: 'facebook' | 'instagram' | 'both';
  adType: 'image' | 'video' | 'carousel';
  isActive: boolean;
  startedRunning: string;
  impressionRange?: string;
  spendRange?: string;
}

// Demo competitor data based on industry
const demoCompetitorData: Record<string, CompetitorAd[]> = {
  fitness: [
    {
      id: 'ad_1',
      advertiserName: 'FitLife Pro',
      adCreativeBody: '🔥 Transform your body in 30 days! Our proven workout program has helped 50,000+ people reach their fitness goals. Start your free trial today.',
      adCreativeTitle: 'Free 30-Day Fitness Challenge',
      platform: 'both',
      adType: 'video',
      isActive: true,
      startedRunning: '2026-03-15',
      impressionRange: '500K-1M',
      spendRange: '$5,000-$10,000'
    },
    {
      id: 'ad_2',
      advertiserName: 'GymWear Co',
      adCreativeBody: 'Premium athletic wear that moves with you. Sweat-wicking, breathable, and stylish. Shop the new collection.',
      adCreativeTitle: '40% Off New Arrivals',
      platform: 'instagram',
      adType: 'carousel',
      isActive: true,
      startedRunning: '2026-03-20',
      impressionRange: '100K-500K',
      spendRange: '$1,000-$5,000'
    },
    {
      id: 'ad_3',
      advertiserName: 'ProteinPlus',
      adCreativeBody: 'Build muscle faster with our scientifically-formulated protein blend. 25g protein per serving. Zero sugar.',
      adCreativeTitle: 'Buy 2 Get 1 Free',
      platform: 'facebook',
      adType: 'image',
      isActive: true,
      startedRunning: '2026-03-01',
      impressionRange: '1M-5M',
      spendRange: '$10,000-$50,000'
    }
  ],
  fashion: [
    {
      id: 'ad_4',
      advertiserName: 'TrendyThreads',
      adCreativeBody: 'Spring Collection is HERE! Fresh styles, vibrant colors. Free shipping on orders over $50.',
      adCreativeTitle: 'New Spring Arrivals',
      platform: 'instagram',
      adType: 'carousel',
      isActive: true,
      startedRunning: '2026-03-10',
      impressionRange: '500K-1M',
      spendRange: '$5,000-$10,000'
    },
    {
      id: 'ad_5',
      advertiserName: 'LuxeBoutique',
      adCreativeBody: 'Elevate your wardrobe with designer pieces at accessible prices. Limited stock available.',
      adCreativeTitle: 'Designer Sale - Up to 70% Off',
      platform: 'both',
      adType: 'video',
      isActive: true,
      startedRunning: '2026-03-25',
      impressionRange: '100K-500K',
      spendRange: '$2,000-$5,000'
    }
  ],
  beauty: [
    {
      id: 'ad_6',
      advertiserName: 'GlowSkin Labs',
      adCreativeBody: 'Dermatologist-approved skincare that actually works. See visible results in 14 days or your money back.',
      adCreativeTitle: 'Get Your Free Sample Kit',
      platform: 'both',
      adType: 'video',
      isActive: true,
      startedRunning: '2026-02-28',
      impressionRange: '1M-5M',
      spendRange: '$20,000-$50,000'
    },
    {
      id: 'ad_7',
      advertiserName: 'NaturalBeauty',
      adCreativeBody: '100% organic, cruelty-free makeup. Look beautiful while being kind to the planet.',
      adCreativeTitle: 'Shop Clean Beauty',
      platform: 'instagram',
      adType: 'image',
      isActive: true,
      startedRunning: '2026-03-18',
      impressionRange: '500K-1M',
      spendRange: '$3,000-$8,000'
    }
  ],
  tech: [
    {
      id: 'ad_8',
      advertiserName: 'TechGadgets',
      adCreativeBody: 'The smart home devices you need. Easy setup, works with Alexa & Google Home. Shop now.',
      adCreativeTitle: 'Smart Home Starter Kit - $99',
      platform: 'facebook',
      adType: 'carousel',
      isActive: true,
      startedRunning: '2026-03-05',
      impressionRange: '1M-5M',
      spendRange: '$15,000-$30,000'
    }
  ],
  default: [
    {
      id: 'ad_9',
      advertiserName: 'ShopSmart',
      adCreativeBody: 'Quality products at unbeatable prices. Free shipping on all orders. Shop our bestsellers.',
      adCreativeTitle: 'Spring Sale - 50% Off',
      platform: 'both',
      adType: 'image',
      isActive: true,
      startedRunning: '2026-03-22',
      impressionRange: '500K-1M',
      spendRange: '$5,000-$10,000'
    },
    {
      id: 'ad_10',
      advertiserName: 'BrandX',
      adCreativeBody: 'Discover why thousands of customers love us. 5-star rated products, fast shipping.',
      adCreativeTitle: 'Shop Now',
      platform: 'facebook',
      adType: 'video',
      isActive: true,
      startedRunning: '2026-03-01',
      impressionRange: '100K-500K',
      spendRange: '$2,000-$5,000'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const industry = searchParams.get('industry') || 'default';
    const platform = searchParams.get('platform'); // 'facebook', 'instagram', or null for all
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const storeId = searchParams.get('store_id');

    // Pro gate — block free users from burning Apify credits
    const gate = await requireProFeature(storeId, 'competitorSpy');
    if (gate) return gate;

    // Try real Apify scrape if a query is provided and token is configured
    if (query) {
      try {
        const apifyResults = await fetchCompetitorAds(query, limit);
        if (apifyResults !== null) {
          let ads = apifyResults;
          if (platform) {
            ads = ads.filter((ad) => ad.platform === platform || ad.platform === 'both');
          }
          return NextResponse.json({
            ads,
            totalCount: ads.length,
            isDemo: false,
            metaApiStatus: 'connected',
            source: 'apify',
          });
        }
      } catch (err) {
        console.error('Apify fetch failed, falling back to demo:', err);
        // Fall through to demo data
      }
    }

    // Demo fallback
    let ads = demoCompetitorData[industry] || demoCompetitorData.default;

    // Add some from default to increase variety
    if (industry !== 'default') {
      ads = [...ads, ...demoCompetitorData.default];
    }

    // Filter by platform if specified
    if (platform) {
      ads = ads.filter(ad => ad.platform === platform || ad.platform === 'both');
    }

    // Filter by query if provided
    if (query) {
      const searchLower = query.toLowerCase();
      ads = ads.filter(ad =>
        ad.advertiserName.toLowerCase().includes(searchLower) ||
        ad.adCreativeBody.toLowerCase().includes(searchLower) ||
        ad.adCreativeTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent
    ads.sort((a, b) => new Date(b.startedRunning).getTime() - new Date(a.startedRunning).getTime());

    return NextResponse.json({
      ads,
      totalCount: ads.length,
      isDemo: true, // Flag that this is demo data
      metaApiStatus: 'demo', // Can be 'connected', 'demo', or 'error'
      source: 'demo',
    });
  } catch (error) {
    console.error('Error fetching competitor ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitor ads' },
      { status: 500 }
    );
  }
}
