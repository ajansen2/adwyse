# AdWyse Development Sprints

## Sprint 1: Core Dashboard & Test Installation (Week 1)
**Goal**: Get the app installable and show basic order attribution data

### Tasks:
1. **Build Dashboard Homepage** (`app/dashboard/page.tsx`)
   - Overview stats: Total orders, attributed orders, total revenue, avg ROAS
   - Recent orders table with attribution data
   - Campaign performance summary

2. **Build Orders View** (`app/dashboard/orders/page.tsx`)
   - Filterable table of all orders
   - Show: Order ID, Date, Total, Ad Source, Campaign, UTM params
   - Export to CSV functionality

3. **Build Campaigns View** (`app/dashboard/campaigns/page.tsx`)
   - List all campaigns (auto-created from order attribution)
   - Show: Campaign name, Platform, Orders, Revenue, Spend (manual for now), ROAS
   - Manual spend entry (until we connect APIs)

4. **Test App Installation**
   - Install on your test Shopify store
   - Verify webhook registration works
   - Create test orders with UTM parameters
   - Verify attribution tracking works

### Success Criteria:
✅ App installs successfully with $99/month charge
✅ Webhooks register automatically
✅ Test orders show up with attribution data
✅ Dashboard displays order and campaign data

---

## Sprint 2: Facebook Ads API Integration (Week 2)
**Goal**: Pull Facebook ad spend data automatically

### Tasks:
1. **Facebook OAuth Flow** (`app/dashboard/settings/facebook/page.tsx`)
   - "Connect Facebook Ads" button
   - OAuth callback handler
   - Store access token in `ad_accounts` table

2. **Facebook Ads API Integration** (`lib/facebook-ads.ts`)
   - Fetch ad accounts
   - Pull campaign data (spend, impressions, clicks)
   - Match campaigns by name to attribution data
   - Sync spend data daily via cron job

3. **Campaign Sync Cron Job** (`app/api/cron/sync-facebook/route.ts`)
   - Vercel cron job to sync Facebook data
   - Update `campaigns` table with spend data
   - Calculate ROAS automatically

4. **Settings Page** (`app/dashboard/settings/page.tsx`)
   - Show connected Facebook ad accounts
   - Manual sync button
   - Disconnect option

### Success Criteria:
✅ Merchants can connect Facebook Ads account
✅ Campaign spend data syncs automatically
✅ ROAS calculations are accurate
✅ Dashboard shows real Facebook data

---

## Sprint 3: Google Ads API Integration (Week 3)
**Goal**: Pull Google Ads spend data automatically

### Tasks:
1. **Google OAuth Flow** (`app/dashboard/settings/google/page.tsx`)
   - "Connect Google Ads" button
   - OAuth callback handler
   - Store refresh token in `ad_accounts` table

2. **Google Ads API Integration** (`lib/google-ads.ts`)
   - Fetch customer accounts
   - Pull campaign data (cost, impressions, clicks)
   - Match campaigns by name to attribution data
   - Sync spend data daily via cron job

3. **Campaign Sync Cron Job** (`app/api/cron/sync-google/route.ts`)
   - Vercel cron job to sync Google Ads data
   - Update `campaigns` table with spend data
   - Handle both Facebook and Google campaigns

4. **Multi-Platform Campaign View**
   - Show campaigns from both Facebook and Google
   - Unified ROAS calculations
   - Platform-specific filtering

### Success Criteria:
✅ Merchants can connect Google Ads account
✅ Google campaign spend syncs automatically
✅ Dashboard shows both Facebook and Google campaigns
✅ Multi-platform attribution works correctly

---

## Sprint 4: AI Insights with Claude (Week 4)
**Goal**: Generate actionable AI recommendations

### Tasks:
1. **Insights Generation** (`lib/generate-insights.ts`)
   - Analyze campaign performance data
   - Use Claude API to generate recommendations
   - Store insights in `insights` table
   - Weekly insight generation via cron

2. **Insights View** (`app/dashboard/insights/page.tsx`)
   - Display AI-generated insights
   - Categorize by type (optimization, budget, creative, targeting)
   - Mark insights as "Actioned" or "Dismissed"

3. **Email Insights Report** (`app/api/cron/send-insights/route.ts`)
   - Weekly email with top insights
   - Campaign performance summary
   - Top spending vs top performing comparison

4. **Insights Prompt Engineering**
   - Refine Claude prompts for better recommendations
   - Test with real campaign data
   - Add context about e-commerce best practices

### Success Criteria:
✅ AI insights generate weekly
✅ Recommendations are actionable and specific
✅ Merchants receive email reports
✅ Insights help improve ROAS

---

## Sprint 5: Polish & Shopify App Store Submission (Week 5)
**Goal**: Get app approved and published

### Tasks:
1. **UI/UX Polish**
   - Consistent orange/red gradient branding
   - Loading states and error handling
   - Mobile responsive design
   - Empty states for new users

2. **Onboarding Flow**
   - Welcome wizard after installation
   - Guide to connect Facebook/Google Ads
   - Sample data walkthrough
   - Video tutorial

3. **App Listing Materials**
   - App icon (512x512)
   - Screenshots (5-8 images)
   - App description
   - Feature list
   - Pricing details

4. **Testing & QA**
   - Test on multiple Shopify stores
   - Test with real Facebook/Google campaigns
   - Verify webhook reliability
   - Load testing

5. **Shopify App Store Submission**
   - Fill out app listing
   - Submit for review
   - Respond to reviewer feedback
   - Launch! 🚀

### Success Criteria:
✅ App passes Shopify review
✅ Listed on Shopify App Store
✅ Onboarding experience is smooth
✅ Ready for real merchants

---

## Sprint 0 (Current): Foundation Complete ✅
- ✅ Database schema created
- ✅ Shopify app registered
- ✅ OAuth flow implemented
- ✅ Webhook registration working
- ✅ Order attribution tracking
- ✅ Website rebrand complete
- ✅ Privacy/Terms updated
- ✅ Deployed to Vercel

---

## Next Steps:
**Start Sprint 1 now** - Build the dashboard so you can test the app installation and see attribution data flowing in!

Want me to start building the dashboard homepage?
