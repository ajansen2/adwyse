# View-Through Attribution (VTA) Implementation Plan

## Overview
View-through attribution credits conversions to users who saw an ad but didn't click on it. This is crucial for measuring brand awareness campaigns and upper-funnel advertising.

## Current State
- Adwyse has multi-touch attribution with 5 models (last_click, first_click, linear, time_decay, position_based)
- All models are click-based - they only track users who clicked an ad
- No impression tracking currently exists

## Requirements for VTA

### 1. Ad Platform Impression Data (REQUIRED)
To implement VTA, we need impression-level data from ad platforms:

**Facebook/Meta Ads:**
- Requires Facebook Marketing API access
- Need `ads_management` and `read_insights` permissions
- Must request user's `ad_account_id` during onboarding
- API endpoint: `/{ad_account_id}/insights` with `impressions` metric
- Rate limits: 200 calls/hour per ad account

**Google Ads:**
- Requires Google Ads API access
- Need `AdWords API` OAuth scope
- Use `Customer Service` to pull impression reports
- Can get impression data at campaign/adset/ad level

**TikTok Ads:**
- Requires TikTok Marketing API
- Business Center access needed
- `campaign_get` and `report_get` permissions

### 2. User-Level Impression Tracking
Ad platforms don't share user-level impressions for privacy. We need:

**Option A: First-Party Pixel Impression Tracking**
- Deploy ad creative pixels that fire on impression
- Store visitor_id + creative_id + timestamp
- Match impressions to conversions by visitor_id
- Limitation: Only works on placements we control

**Option B: Aggregate View-Through Attribution**
- Use statistical models based on:
  - Total impressions during attribution window
  - Conversion rate lift during campaign
  - Control group comparison
- Less accurate but doesn't require user-level data

**Option C: Platform-Reported VTA (Recommended)**
- Use each platform's built-in view-through attribution
- Pull `actions` data with `view_through_attributions`
- Display alongside click-through data
- Most accurate, least engineering effort

### 3. Attribution Window Configuration
Standard VTA windows:
- 1 day for display/video ads (Facebook default)
- 7 days for consideration campaigns
- 24 hours for TikTok/Snapchat

## Implementation Plan

### Phase 1: Platform VTA Integration (When APIs Available)
1. Update Facebook sync to pull `view_through_attributions` from insights
2. Update Google sync to pull `view_through_conversions` metric
3. Add `view_through_conversions` column to `adwyse_campaigns` table
4. Display VTA alongside click attribution in dashboard

```sql
-- Database changes needed
ALTER TABLE adwyse_campaigns
  ADD COLUMN view_through_conversions INTEGER DEFAULT 0,
  ADD COLUMN view_through_revenue DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN view_through_window_hours INTEGER DEFAULT 24;
```

### Phase 2: First-Party VTA (Optional Enhancement)
1. Add impression tracking to pixel script
2. Store impression events in `pixel_events` with event_type='ad_impression'
3. Update attribution engine to include impression touchpoints
4. Weight impression touchpoints lower than click touchpoints

```typescript
// New attribution type
export type AttributionModel =
  | 'last_click'
  | 'first_click'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'view_through';  // New

// VTA-specific weighting
const VTA_CREDIT_RATIO = 0.3; // View gets 30% of click credit
```

### Phase 3: Advanced VTA Analytics
1. Compare VTA vs click attribution
2. Incrementality testing
3. View-through attribution window optimization

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Facebook Marketing API | Pending | Need App Review approval |
| Google Ads API | Available | Need OAuth setup |
| TikTok Marketing API | Pending | Need Business Center access |

## Files to Create/Modify

- [ ] `/lib/attribution-engine.ts` - Add VTA model
- [ ] `/lib/facebook-ads.ts` - Pull VTA metrics
- [ ] `/lib/google-ads.ts` - Pull VTA metrics
- [ ] `/app/api/analytics/attribution/route.ts` - Add VTA endpoint
- [ ] Migration for VTA columns
- [ ] Dashboard component for VTA comparison

## Estimated Effort
- Phase 1: 2-3 days (once APIs available)
- Phase 2: 1 week
- Phase 3: 2-3 days

## Next Steps
1. Complete Facebook Marketing API App Review
2. Set up Google Ads API credentials
3. Begin Phase 1 implementation once API access is confirmed
