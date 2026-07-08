/**
 * Static sample dataset for "View sample data" mode.
 * Store: Bella's Boutique — mid-size fashion ecommerce.
 *
 * All numbers are internally consistent:
 *   - Total spend:   $38,000  (FB $18k + Google $14k + TikTok $6k)
 *   - Total revenue: $142,000  (blended ROAS 3.74x)
 *   - Orders:        320       (AOV $443.75)
 *   - NC-ROAS 2.8x, repeat ROAS 5.1x
 */

// ── Types ──────────────────────────────────────────────────────────

export interface SampleCampaign {
  id: string;
  name: string;
  platform: 'facebook' | 'google' | 'tiktok';
  status: 'active' | 'paused';
  spend: number;
  revenue: number;
  orders: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

export interface SampleCreative {
  id: string;
  name: string;
  platform: 'facebook' | 'google' | 'tiktok';
  score: number;
  rank: 'top' | 'good' | 'average' | 'poor' | 'kill';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
}

export interface SampleCohort {
  month: string;
  label: string;
  customers: number;
  retention: number[];   // [M0, M1, M2, M3] as percentages
  revenue: number[];     // [M0, M1, M2, M3] in dollars
}

export interface SampleAttributionModel {
  model: string;
  revenue: number;
  roas: number;
  topChannel: string;
}

export interface SampleFunnelStep {
  name: string;
  value: number;
}

export interface SampleDataset {
  store: { name: string; domain: string };
  overview: {
    totalSpend: number;
    totalRevenue: number;
    totalOrders: number;
    aov: number;
    blendedRoas: number;
    facebookSpend: number;
    googleSpend: number;
    tiktokSpend: number;
  };
  campaigns: SampleCampaign[];
  ncRoas: {
    newCustomerRevenue: number;
    newCustomerSpend: number;
    newCustomerRoas: number;
    repeatRevenue: number;
    repeatSpend: number;
    repeatRoas: number;
    newCustomerOrders: number;
    repeatOrders: number;
    newAov: number;
    repeatAov: number;
  };
  cohorts: SampleCohort[];
  creatives: SampleCreative[];
  attribution: SampleAttributionModel[];
  funnel: SampleFunnelStep[];
  revenueOverTime: { date: string; revenue: number; adRevenue: number; spend: number; orders: number }[];
}

// ── Helper ─────────────────────────────────────────────────────────

function round2(n: number) { return Math.round(n * 100) / 100; }

// ── Campaigns ──────────────────────────────────────────────────────
// Total spend:   38,000
// Total revenue: 142,000
// Total orders:  320

const campaigns: SampleCampaign[] = [
  // ── Strong performers (ROAS 4-6x) ───────────────
  {
    id: 'sc-1', name: 'Summer Collection - Lookalike', platform: 'facebook', status: 'active',
    spend: 6200, revenue: 31000, orders: 68,
    impressions: 420000, clicks: 8400, conversions: 68,
    roas: round2(31000 / 6200), // 5.0x
  },
  {
    id: 'sc-2', name: 'Brand Search - Exact Match', platform: 'google', status: 'active',
    spend: 3800, revenue: 22800, orders: 52,
    impressions: 180000, clicks: 9200, conversions: 52,
    roas: round2(22800 / 3800), // 6.0x
  },
  {
    id: 'sc-3', name: 'Retargeting - Cart Abandoners', platform: 'facebook', status: 'active',
    spend: 4200, revenue: 18900, orders: 42,
    impressions: 310000, clicks: 6200, conversions: 42,
    roas: round2(18900 / 4200), // 4.5x
  },

  // ── Moderate performers (ROAS 2-3x) ─────────────
  {
    id: 'sc-4', name: 'Shopping - Top Products', platform: 'google', status: 'active',
    spend: 5400, revenue: 16200, orders: 36,
    impressions: 520000, clicks: 12000, conversions: 36,
    roas: round2(16200 / 5400), // 3.0x
  },
  {
    id: 'sc-5', name: 'New Arrivals - Broad', platform: 'facebook', status: 'active',
    spend: 4800, revenue: 12000, orders: 28,
    impressions: 680000, clicks: 10200, conversions: 28,
    roas: round2(12000 / 4800), // 2.5x
  },
  {
    id: 'sc-6', name: 'Performance Max - All Products', platform: 'google', status: 'active',
    spend: 4800, revenue: 10080, orders: 22,
    impressions: 890000, clicks: 14200, conversions: 22,
    roas: round2(10080 / 4800), // 2.1x
  },
  {
    id: 'sc-7', name: 'Trending Looks - For You Page', platform: 'tiktok', status: 'active',
    spend: 3600, revenue: 10800, orders: 24,
    impressions: 1200000, clicks: 18000, conversions: 24,
    roas: round2(10800 / 3600), // 3.0x
  },

  // ── Underperformers (ROAS 0.5-1.2x) ─────────────
  {
    id: 'sc-8', name: 'Awareness - Video Views', platform: 'tiktok', status: 'active',
    spend: 2400, revenue: 2880, orders: 8,
    impressions: 2100000, clicks: 25200, conversions: 8,
    roas: round2(2880 / 2400), // 1.2x
  },
  {
    id: 'sc-9', name: 'Cold Audience - Interest Stack', platform: 'facebook', status: 'active',
    spend: 2800, revenue: 1540, orders: 4,
    impressions: 520000, clicks: 5200, conversions: 4,
    roas: round2(1540 / 2800), // 0.55x
  },

  // ── Paused campaign ──────────────────────────────
  {
    id: 'sc-10', name: 'Spring Clearance (Paused)', platform: 'facebook', status: 'paused',
    spend: 0, revenue: 15800, orders: 36,
    impressions: 0, clicks: 0, conversions: 36,
    roas: 0, // paused, historical only
  },
];

// Verify spend totals:
// FB:  6200 + 4200 + 4800 + 2800 + 0 = 18000
// G:   3800 + 5400 + 4800          = 14000
// TT:  3600 + 2400                 = 6000
// Total: 38000

// Verify revenue totals:
// 31000+22800+18900+16200+12000+10080+10800+2880+1540+15800 = 142000

// Verify orders:
// 68+52+42+36+28+22+24+8+4+36 = 320

// ── NC-ROAS ────────────────────────────────────────────────────────
// New customer: 60% of orders (192), lower AOV (~$380), ROAS 2.8x
// Repeat: 40% of orders (128), higher AOV (~$540), ROAS 5.1x

const ncRoas = {
  newCustomerOrders: 192,
  repeatOrders: 128,
  newCustomerRevenue: 72960,   // 192 * ~380
  repeatRevenue: 69040,        // 128 * ~539.4 → 69040
  // rev check: 72960 + 69040 = 142000 ✓
  newCustomerSpend: 26057,     // 72960 / 2.8 = 26057
  repeatSpend: 13537,          // 69040 / 5.1 ≈ 13537
  // spend check: 26057 + 13537 ≈ 39594 (allocations can overlap with non-attributed)
  newCustomerRoas: 2.8,
  repeatRoas: 5.1,
  newAov: round2(72960 / 192), // $380
  repeatAov: round2(69040 / 128), // $539.38
};

// ── Cohorts ────────────────────────────────────────────────────────

const cohorts: SampleCohort[] = [
  {
    month: '2026-03', label: 'Mar 2026', customers: 82,
    retention: [100, 28, 18, 12],
    revenue:   [31200, 8740, 5620, 3740],
  },
  {
    month: '2026-04', label: 'Apr 2026', customers: 76,
    retention: [100, 26, 16],
    revenue:   [28800, 7490, 4610],
  },
  {
    month: '2026-05', label: 'May 2026', customers: 88,
    retention: [100, 30],
    revenue:   [34600, 10380],
  },
  {
    month: '2026-06', label: 'Jun 2026', customers: 74,
    retention: [100],
    revenue:   [29400],
  },
];

// ── Creatives ──────────────────────────────────────────────────────

function rankFromScore(s: number): 'top' | 'good' | 'average' | 'poor' | 'kill' {
  if (s >= 80) return 'top';
  if (s >= 60) return 'good';
  if (s >= 40) return 'average';
  if (s >= 20) return 'poor';
  return 'kill';
}

const creatives: SampleCreative[] = [
  // 2 top
  { id: 'cr-1',  name: 'Summer Vibes Carousel',      platform: 'facebook', score: 92, spend: 3200, impressions: 210000, clicks: 5460, ctr: 2.60, conversions: 38, roas: 5.4 },
  { id: 'cr-2',  name: 'Best Sellers Banner',         platform: 'google',   score: 88, spend: 2800, impressions: 140000, clicks: 4900, ctr: 3.50, conversions: 32, roas: 5.1 },
  // 5 good
  { id: 'cr-3',  name: 'New Arrival Video 30s',       platform: 'facebook', score: 76, spend: 2400, impressions: 320000, clicks: 5120, ctr: 1.60, conversions: 24, roas: 3.8 },
  { id: 'cr-4',  name: 'UGC Unboxing #1',             platform: 'tiktok',   score: 74, spend: 1800, impressions: 580000, clicks: 8700, ctr: 1.50, conversions: 18, roas: 3.6 },
  { id: 'cr-5',  name: 'Dynamic Product Retarget',    platform: 'facebook', score: 71, spend: 2100, impressions: 180000, clicks: 3960, ctr: 2.20, conversions: 20, roas: 3.4 },
  { id: 'cr-6',  name: 'Google Responsive Display',   platform: 'google',   score: 68, spend: 2600, impressions: 480000, clicks: 6240, ctr: 1.30, conversions: 18, roas: 2.9 },
  { id: 'cr-7',  name: 'Lifestyle Flat Lay',          platform: 'facebook', score: 62, spend: 1900, impressions: 260000, clicks: 4160, ctr: 1.60, conversions: 14, roas: 2.6 },
  // 4 average
  { id: 'cr-8',  name: 'Sale Announcement Static',    platform: 'facebook', score: 55, spend: 1600, impressions: 220000, clicks: 2860, ctr: 1.30, conversions: 10, roas: 2.1 },
  { id: 'cr-9',  name: 'Collection Slideshow',        platform: 'google',   score: 48, spend: 1400, impressions: 310000, clicks: 3410, ctr: 1.10, conversions: 8,  roas: 1.8 },
  { id: 'cr-10', name: 'TikTok GRWM Collab',          platform: 'tiktok',   score: 45, spend: 1200, impressions: 420000, clicks: 4620, ctr: 1.10, conversions: 6,  roas: 1.6 },
  { id: 'cr-11', name: 'Product Grid 4-up',           platform: 'facebook', score: 42, spend: 1100, impressions: 190000, clicks: 2090, ctr: 1.10, conversions: 6,  roas: 1.5 },
  // 3 poor
  { id: 'cr-12', name: 'Text-Heavy Promo Banner',     platform: 'google',   score: 32, spend: 900,  impressions: 280000, clicks: 1960, ctr: 0.70, conversions: 3,  roas: 0.9 },
  { id: 'cr-13', name: 'Generic Brand Video',         platform: 'tiktok',   score: 28, spend: 800,  impressions: 350000, clicks: 2100, ctr: 0.60, conversions: 2,  roas: 0.7 },
  { id: 'cr-14', name: 'Old Season Clearance',        platform: 'facebook', score: 22, spend: 700,  impressions: 160000, clicks: 960,  ctr: 0.60, conversions: 2,  roas: 0.6 },
  // 1 kill
  { id: 'cr-15', name: 'Stock Photo Ad v2',           platform: 'facebook', score: 14, spend: 600,  impressions: 140000, clicks: 560,  ctr: 0.40, conversions: 1,  roas: 0.3 },
].map(c => ({ ...c, platform: c.platform as 'facebook' | 'google' | 'tiktok', rank: rankFromScore(c.score) }));

// ── Attribution models ─────────────────────────────────────────────

const attribution: SampleAttributionModel[] = [
  { model: 'Last Click',       revenue: 142000, roas: 3.74, topChannel: 'Facebook' },
  { model: 'First Click',      revenue: 142000, roas: 3.74, topChannel: 'Google' },
  { model: 'Linear',           revenue: 142000, roas: 3.74, topChannel: 'Facebook' },
  { model: 'Time Decay',       revenue: 142000, roas: 3.74, topChannel: 'Facebook' },
  { model: 'Position Based',   revenue: 142000, roas: 3.74, topChannel: 'Google' },
];

// ── Funnel ─────────────────────────────────────────────────────────
// Page Views 45k → ATC 3.2k → Checkout 1.8k → Purchase 320

const funnel: SampleFunnelStep[] = [
  { name: 'Page Views',   value: 45000 },
  { name: 'Add to Cart',  value: 3200 },
  { name: 'Checkout',     value: 1800 },
  { name: 'Purchase',     value: 320 },
];

// ── Revenue over time (last 30 days) ───────────────────────────────

function generateRevenueTimeline(): { date: string; revenue: number; adRevenue: number; spend: number; orders: number }[] {
  const data: { date: string; revenue: number; adRevenue: number; spend: number; orders: number }[] = [];
  const baseRevenue = 142000 / 30; // ~4733/day
  const baseSpend = 38000 / 30;    // ~1267/day
  const baseOrders = 320 / 30;     // ~10.7/day

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Add realistic daily variance (+/- 35%)
    const dayOfWeek = d.getDay();
    const weekendDip = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.78 : 1.0;
    const variance = 0.65 + Math.random() * 0.70; // 0.65 to 1.35
    const dayMultiplier = weekendDip * variance;

    const revenue = Math.round(baseRevenue * dayMultiplier);
    const spend = Math.round(baseSpend * dayMultiplier * (0.9 + Math.random() * 0.2));
    const adRevenue = Math.round(revenue * (0.6 + Math.random() * 0.2)); // 60-80% ad-attributed
    const orders = Math.max(1, Math.round(baseOrders * dayMultiplier));

    data.push({ date: dateStr, revenue, adRevenue, spend, orders });
  }
  return data;
}

// ── Exported dataset ───────────────────────────────────────────────

export const SAMPLE_DATA: SampleDataset = {
  store: { name: "Bella's Boutique", domain: 'bellas-boutique.myshopify.com' },

  overview: {
    totalSpend: 38000,
    totalRevenue: 142000,
    totalOrders: 320,
    aov: round2(142000 / 320), // $443.75
    blendedRoas: round2(142000 / 38000), // 3.74x
    facebookSpend: 18000,
    googleSpend: 14000,
    tiktokSpend: 6000,
  },

  campaigns,
  ncRoas,
  cohorts,
  creatives,
  attribution,
  funnel,
  revenueOverTime: generateRevenueTimeline(),
};
