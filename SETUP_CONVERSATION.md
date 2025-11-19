# AdWyse Setup Conversation

**Date:** November 18, 2025
**Project:** AdWyse - AI-powered ad attribution for Shopify merchants
**Domain:** adwyse.ca
**GitHub:** https://github.com/ajansen2/adwyse

---

## Business Model Summary

### What We're Building
**AdWyse** - A $99/month SaaS that shows Shopify merchants which ads actually make them money.

**The Problem We Solve:**
1. **Broken Tracking (iOS 14)** - Apple's privacy update broke Facebook/Google ad tracking
2. **Multi-Platform Attribution** - Merchants run ads on Facebook, Google, TikTok but don't know which platform drives sales
3. **Expensive Solutions** - Triple Whale ($129-599/month) and Polar Analytics ($199-599/month) are too expensive and complex

**Our Solution:**
- Track every order back to its original ad source
- Use Claude AI to generate actionable insights
- Simple dashboard showing ROAS (Return on Ad Spend)
- $99/month flat fee (vs $129-599 competitors)
- 7-day free trial

### Revenue Model
- **Pricing:** $99/month (single tier to start)
- **Trial:** 7 days free (credit card required)
- **Target Market:** Shopify stores spending $1k-50k/month on ads
- **Profit Margin:** ~90% ($99 revenue - $10 costs = $89 profit/customer)

### Year 1 Goals
- Month 3: Launch with first 3 customers ($297 MRR)
- Month 6: 20-30 customers ($2k-3k MRR)
- Month 12: 100 customers (~$10k MRR = $120k/year)

---

## Tech Stack

```
Frontend: Next.js 15.5.4 (App Router)
Backend: Next.js API Routes
Database: Supabase (PostgreSQL) - Reusing "Argora DBMS"
Hosting: Vercel
AI: Claude Haiku API (@anthropic-ai/sdk v0.65.0)
Payments: Stripe
Domain: adwyse.ca
```

**Why This Stack:**
- ✅ Already used in cart recovery app (can copy 80% of code)
- ✅ Supabase free tier supports multiple apps (saving $25/month)
- ✅ Claude API extremely cheap ($0.25/$1.25 per million tokens)
- ✅ Facebook/Google APIs are FREE (no usage costs)
- ✅ Vercel free tier works fine for MVP

**Cost per customer:**
- Claude API: ~$5-10/month
- Supabase: $0 (free tier) or amortized across all customers
- Vercel: $0 (free tier)
- **Total: ~$10/month per customer**
- **Profit: $89/customer/month**

---

## Database Schema

### Tables Created (in Argora DBMS - Supabase)

1. **adwyse_stores** - Shopify stores using AdWyse
   - shop_domain, access_token, subscription_status, trial_ends_at

2. **adwyse_ad_accounts** - Connected ad platforms
   - platform (facebook/google/tiktok), account_id, access_token

3. **adwyse_campaigns** - Daily campaign metrics
   - platform_campaign_id, campaign_name, spend, impressions, clicks
   - attributed_revenue, attributed_orders, roas

4. **adwyse_orders** - Shopify orders with attribution
   - shopify_order_id, total_price
   - utm_source, utm_campaign, fbclid, gclid
   - attributed_platform, attributed_campaign_id

5. **adwyse_insights** - AI-generated recommendations
   - insight_type, title, description
   - suggested_action, estimated_impact

---

## Key Features

### MVP (Months 1-2):
- ✅ Shopify order tracking
- ✅ Facebook Ads integration
- ✅ Google Ads integration
- ✅ Basic dashboard (ROAS, spend, revenue)
- ✅ AI insights powered by Claude Haiku
- ✅ 7-day free trial

### Phase 2 (Months 3-4):
- Weekly email reports
- Historical data import (90 days)
- Campaign comparison charts
- Export reports (PDF/CSV)

### Phase 3 (Months 5+):
- TikTok Ads integration
- Pinterest Ads
- Multi-touch attribution (advanced)
- Team access for agencies
- White-label option ($299/month tier)

---

## How It Works

### For Merchants (Simple):
1. Install AdWyse from Shopify App Store
2. Connect Facebook Ads account (1 click OAuth)
3. Connect Google Ads account (1 click OAuth)
4. Done! Dashboard populates within 24 hours

### Behind the Scenes:
```
1. Merchant makes sale on Shopify
   ↓
2. Shopify webhook → AdWyse API (orders/create)
   ↓
3. Extract UTM parameters, FBCLID, GCLID from landing_site_ref
   ↓
4. Match order to ad campaign (Facebook/Google)
   ↓
5. Pull ad spend data from Facebook/Google APIs
   ↓
6. Calculate: Revenue - Ad Cost = Profit
   ↓
7. Claude AI analyzes patterns → generates insights
   ↓
8. Display in dashboard + weekly email
```

### Example AI Insight:
```
🤖 AdWyse AI Recommendations:

⚠️ URGENT: Your "Summer Sale" campaign is losing $47/day
→ Pause this campaign immediately
→ Estimated savings: $1,410/month

🚀 OPPORTUNITY: Your Google Shopping ads have 5.2x ROAS
→ Increase budget from $500 to $800/month
→ Estimated additional profit: $1,560/month
```

---

## Competitive Advantages

| Feature | AdWyse | Triple Whale | Polar Analytics |
|---------|--------|--------------|-----------------|
| Price | $99/mo | $129-599/mo | $199-599/mo |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| AI Insights | ✅ Claude | ❌ | ❌ |
| Setup Time | 2 minutes | 15+ minutes | 30+ minutes |

**Our unique angles:**
1. **AI-powered insights** (tells you WHAT to do, not just shows data)
2. **Affordable** ($99 vs $129-599)
3. **Simple** (built for non-technical merchants)
4. **Fast** (2-minute setup vs 30+ minutes)

---

## Go-to-Market Strategy

### Primary Channel: Shopify App Store
- 60,000+ daily searches for apps
- Free organic traffic (near-zero CAC)
- Built-in trust via reviews
- **SEO keywords:** "attribution", "ROAS", "ad tracking", "Facebook ads", "iOS 14 fix"

### Secondary Channels:
1. **Content/SEO**
   - "How to track Facebook ads after iOS 14"
   - "What is ROAS and how to improve it"
   - "Why your Facebook tracking is broken"

2. **Community Engagement**
   - r/shopify (580k members)
   - Shopify Community forums
   - eCommerce Facebook groups
   - Answer questions, build authority

3. **Paid Ads** (later, once proven)
   - Facebook ads targeting Shopify merchants
   - Google ads for "ad attribution tool"

---

## Development Progress

### ✅ Completed (Nov 18, 2025):

1. **Project Setup**
   - Created `/Users/adam/adwyse` folder
   - Copied cart recovery app code as base
   - Updated package.json to "adwyse"
   - Initialized Git repository

2. **GitHub**
   - Created private repo: https://github.com/ajansen2/adwyse
   - Initial commit pushed

3. **Database**
   - Repurposed "Argora DBMS" Supabase project (saves $25/month)
   - Created migration: `001_adwyse_initial_schema.sql`
   - 5 tables: stores, ad_accounts, campaigns, orders, insights
   - Includes RLS policies and helper functions

4. **Environment Setup**
   - Created `.env.local` with Supabase credentials
   - Configured for adwyse.ca domain

### 🔄 In Progress:
- Running database migration in Supabase SQL Editor

### ⏳ Next Steps:

1. **Finish Database Setup**
   - Run migration SQL in Supabase
   - Verify tables created

2. **Create Shopify App**
   - Go to partners.shopify.com
   - Create new app: "AdWyse"
   - Get API key + secret
   - Add to .env.local

3. **Get API Keys**
   - Anthropic API key (console.anthropic.com)
   - Stripe keys (if adding billing)
   - Add to .env.local

4. **Deploy to Vercel**
   - Create new Vercel project
   - Import from GitHub (ajansen2/adwyse)
   - Add environment variables
   - Connect adwyse.ca domain

5. **Update Code**
   - Change webhooks from cart/create → orders/create
   - Build attribution tracking logic
   - Create dashboard UI for campaigns
   - Integrate Claude AI for insights

---

## Environment Variables

```bash
# Supabase (Argora DBMS)
NEXT_PUBLIC_SUPABASE_URL=https://ouxsgxpbmglglyjxcrlt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App URL
NEXT_PUBLIC_APP_URL=https://adwyse.ca

# Shopify (TO BE CREATED)
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_secret_here
SHOPIFY_SCOPES=read_orders,read_products,write_webhooks

# Anthropic (TO BE CREATED)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Stripe (optional)
STRIPE_SECRET_KEY=your_stripe_secret_here
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key_here

# Resend (optional)
RESEND_API_KEY=your_resend_key_here
```

---

## Key Decisions Made

### 1. **Domain Choice: adwyse.ca**
- Purchased adwyse.ca (not .io due to budget)
- Can upgrade to .io later if needed
- .ca works fine for MVP

### 2. **Reuse Argora DBMS Supabase**
- Saves $25/month (vs creating new project)
- Old tables kept (safe approach)
- New tables prefixed with `adwyse_`

### 3. **Pricing: $99/month Single Tier**
- Simple to sell ("It's $99, period")
- Can add tiers later based on feedback
- Positioned below competition ($129+)

### 4. **Copy Cart Recovery Code**
- Cuts development time in HALF
- Already has Shopify OAuth, webhooks, Supabase setup
- Just need to swap core logic

### 5. **Use Claude Haiku (not Sonnet)**
- 10x cheaper than Sonnet
- Fast enough for real-time insights
- Can upgrade to Sonnet for premium tier later

---

## Testing Strategy

### Phase 1: Mock Data (Week 1-2)
1. Shopify dev store + test orders with UTM parameters
2. Mock Facebook/Google campaign data
3. Test attribution matching logic
4. Test Claude AI with mock data

### Phase 2: Real API Integration (Week 3)
1. Set up Facebook Test Ad Account
2. Set up Google Test Ad Account
3. Connect real APIs (but test data)
4. Verify API calls work

### Phase 3: Beta Tester (Week 4)
1. Find 1-2 merchants on r/shopify
2. Offer free access for 6 months
3. Test with their REAL ad accounts
4. Get feedback, iterate

### Phase 4: Launch (Week 5-6)
1. Fix bugs from beta
2. Polish UI
3. Submit to Shopify App Store
4. Launch!

---

## Why This Business Will Work

### 1. **Real Pain Point**
- Merchants losing $1,000-3,000/month on bad ads
- Existing solutions too expensive ($129-599/month)
- Post-iOS 14 tracking is BROKEN
- Desperate for solution

### 2. **Clear ROI**
```
Merchant spends: $5,000/month on ads
Wastes: $1,500/month (30% is typical)

WITH AdWyse ($99/month):
- Cuts waste to $300/month
- Saves: $1,200/month
- ROI: 12x return on $99 investment
```

### 3. **Low CAC (Customer Acquisition Cost)**
- Shopify App Store = free traffic
- SEO = passive long-term
- Reddit/forums = free
- **Estimated CAC: $0-20 per customer**

### 4. **High Margins**
- Revenue: $99/month
- Costs: ~$10/month (APIs)
- Profit: $89/month per customer
- **Margin: 90%**

### 5. **Proven Market**
- Triple Whale raised millions, has thousands of customers
- Polar Analytics same thing
- Market is HUGE (4.5M+ Shopify stores)

### 6. **Competitive Advantage**
- AI insights (no one else has)
- Cheaper ($99 vs $129-599)
- Simpler (2-minute setup)
- Built by someone who understands the pain

---

## Revenue Projections

### Conservative Year 1:

| Month | New Customers | Total Customers | MRR | Notes |
|-------|---------------|-----------------|-----|-------|
| 1-2 | 0 | 0 | $0 | Building MVP |
| 3 | 3 | 3 | $297 | Launch + beta testers |
| 4 | 5 | 8 | $792 | App Store traction |
| 5 | 7 | 14 | $1,386 | Reviews help ranking |
| 6 | 10 | 23 | $2,277 | SEO starts working |
| 9 | 15 | 50 | $4,950 | Steady growth |
| 12 | 20 | 100 | $9,900 | **Year 1 goal** |

**Year 1 Total Revenue:** ~$45k-60k

### Year 2 (Scaling):
- 200 customers = $19,800/month = **$237,600/year**
- Costs: ~$2,000-3,000/month (APIs, hosting)
- **Net profit: ~$200k+**

---

## Files Created

```
/Users/adam/adwyse/
├── .env.local (Supabase + API keys)
├── .git/ (Git repository)
├── .gitignore
├── package.json (updated to "adwyse")
├── supabase/
│   └── migrations/
│       └── 001_adwyse_initial_schema.sql
├── app/ (Next.js app - copied from cart recovery)
├── components/ (React components)
├── lib/ (utilities)
└── middleware.ts (Shopify auth)
```

---

## Next Session Tasks

1. ✅ Run migration SQL in Supabase SQL Editor
2. ⏳ Create Shopify app at partners.shopify.com
3. ⏳ Get Anthropic API key
4. ⏳ Deploy to Vercel with adwyse.ca domain
5. ⏳ Update webhooks to track orders (not carts)
6. ⏳ Build attribution logic
7. ⏳ Create dashboard UI
8. ⏳ Test with dev store

---

## Resources

- **GitHub:** https://github.com/ajansen2/adwyse
- **Supabase:** https://supabase.com/dashboard/project/ouxsgxpbmglglyjxcrlt
- **Domain:** adwyse.ca
- **Shopify Partners:** https://partners.shopify.com
- **Anthropic Console:** https://console.anthropic.com

---

## Key Insights from Conversation

1. **We pivoted from white-label client portals** → Ad attribution because:
   - White-label requires active sales/outreach
   - Adam doesn't enjoy sales calls
   - Ad attribution has lower CAC (Shopify App Store)

2. **We validated ad attribution is a real pain:**
   - iOS 14 broke tracking
   - Merchants spending thousands on ads blindly
   - Competition is expensive ($129-599/month)
   - Clear ROI (saves $1,200+ for $99 cost)

3. **We chose to reuse cart recovery code:**
   - Cuts dev time from 6-8 weeks → 2-3 weeks
   - Already has Shopify integration working
   - Proven deployment setup

4. **We decided to reuse Argora DBMS:**
   - Saves $25/month
   - Free tier supports multiple apps
   - Old tables kept (safe)

5. **Pricing strategy:**
   - $99/month flat (simple)
   - 7-day trial (standard)
   - Can add tiers later based on data

---

**Last Updated:** November 18, 2025
**Status:** Database migration in progress
**Next:** Run SQL in Supabase, create Shopify app, deploy to Vercel
