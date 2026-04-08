# Meta Ad Library Integration Plan

## Overview
The Meta Ad Library is a public database of ads running on Facebook, Instagram, Messenger, and WhatsApp. Integration would enable competitor analysis and creative inspiration features.

## Use Cases

### 1. Competitor Spy
- Search competitors' ads by page name or URL
- View their active ad creatives
- Track when they launch new campaigns
- Analyze ad copy patterns

### 2. Creative Inspiration
- Browse top-performing ads in user's niche
- Filter by industry, country, platform
- Save ads to inspiration board

### 3. Market Intelligence
- See ad volume trends by category
- Track seasonal advertising patterns
- Identify new market entrants

## Meta Ad Library API

### Access Requirements
- **App Review Required**: Yes, must submit for `ads_read` permission
- **Business Verification**: Required
- **Use Case Justification**: Must explain competitive analysis feature
- **Rate Limits**: 200 calls/hour, 1000 calls/day

### API Endpoints

**Search Ads:**
```
GET /ads_archive
Parameters:
  - search_terms (string): Keywords to search
  - search_page_ids (array): Page IDs to search
  - ad_type: "POLITICAL_AND_ISSUE_ADS" or "ALL"
  - ad_reached_countries: Array of country codes
  - ad_active_status: "ACTIVE", "INACTIVE", "ALL"
  - fields: ad_creative_body, ad_creative_link_caption, etc.
```

**Response Fields:**
- `id` - Ad archive ID
- `ad_creation_time` - When ad was created
- `ad_creative_body` - Ad text
- `ad_creative_link_title` - Link headline
- `ad_creative_link_caption` - Link description
- `ad_creative_link_description` - Additional description
- `ad_snapshot_url` - URL to view full ad
- `page_id` - Facebook Page ID
- `page_name` - Page name
- `impressions` - Impression ranges (e.g., "10K-50K")
- `spend` - Spend ranges
- `demographic_distribution` - Age/gender breakdown

### Limitations
1. **No direct image/video access** - Only snapshot URLs
2. **Aggregated data only** - No user-level targeting info
3. **Political ads focus** - Full data only for political/issue ads
4. **Regional restrictions** - Some data not available in all regions

## Implementation Plan

### Phase 1: Manual Ad Library Search
Build UI that links to Meta's Ad Library with pre-filled search:
```typescript
const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(competitorName)}`;
```
- No API needed
- Users manually browse Ad Library
- Can still provide UI for saving insights

### Phase 2: API Integration (Requires Approval)

**Files to Create:**
```
/lib/meta-ad-library.ts          - API client
/app/api/competitor-spy/route.ts - Backend endpoint
/components/dashboard/CompetitorSpy.tsx - UI component
```

**Database:**
```sql
CREATE TABLE competitor_ads (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES adwyse_stores(id),
  ad_archive_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,
  ad_body TEXT,
  ad_title TEXT,
  ad_caption TEXT,
  snapshot_url TEXT,
  impression_range TEXT,
  spend_range TEXT,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competitor_pages (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES adwyse_stores(id),
  page_id TEXT NOT NULL,
  page_name TEXT,
  is_tracking BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ
);
```

**UI Features:**
1. Search bar for competitor names/URLs
2. Grid of ad cards with thumbnails
3. Filter by date, platform, status
4. Save to "Inspiration Board"
5. Alert when competitor launches new ads

### Phase 3: AI-Powered Insights
- Analyze competitor ad copy with Claude
- Identify messaging patterns
- Generate creative suggestions
- Track trend changes over time

## App Review Submission

### Required Materials
1. **Video Demo**: Show how feature will be used
2. **Privacy Policy**: Update to mention competitor analysis
3. **Terms of Service**: Add Ad Library usage terms
4. **Use Case Description**: Explain competitive intelligence feature

### Expected Timeline
- Submission to review: 1 day
- Review process: 2-4 weeks
- Possible additional questions: 1-2 weeks

### Approval Likelihood
- **Medium-High**: Competitive analysis is a valid business use case
- Must emphasize: "Helps businesses understand market trends"
- Avoid: Any mention of ad copying or plagiarism

## Alternative: Web Scraping (Not Recommended)
- Against Meta's Terms of Service
- Risk of account/app ban
- Unreliable data extraction
- NOT implementing this approach

## Current Status
- [ ] Facebook App created
- [ ] Business verification completed
- [ ] `ads_read` permission requested
- [ ] App Review submitted
- [ ] Approval received

## Dependencies

| Dependency | Status | Action |
|------------|--------|--------|
| Facebook App | Created | Need to verify business |
| Business Manager | Exists | Need admin access |
| App Review | Not started | Prepare materials |

## Estimated Effort
- Phase 1 (Manual): 1 day
- Phase 2 (API): 3-4 days (after approval)
- Phase 3 (AI): 2-3 days

## Next Steps
1. **Immediate**: Implement Phase 1 (manual link to Ad Library)
2. **This Week**: Complete Facebook business verification
3. **Next Week**: Submit App Review for `ads_read`
4. **On Approval**: Implement Phase 2 & 3
