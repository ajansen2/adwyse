# AdWyse - Claude Code Documentation

## Project Overview
AdWyse is a Shopify app for ad attribution analytics, competing with Triple Whale ($149-219/mo). Price: $99/mo Pro, Free tier available. Built by Adam.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Shopify OAuth + Supabase Auth
- **Styling**: Tailwind CSS (dark theme)
- **Charts**: Recharts
- **Email**: Resend
- **AI**: Claude API (Anthropic) — `claude-sonnet-4-20250514`
- **Competitor Spy**: Apify (`curious_coder/facebook-ads-library-scraper`)
- **Hosting**: Vercel (adwyse.ca)
- **Payments**: Shopify Billing API (not Stripe)

## Key IDs
- Demo store for Adam: `987c61dd-7696-47ca-bf05-37876953b0ca`
- This store has a hardcoded Pro bypass in `/api/me/tier` and `requireProFeature()` so marketing demos always work
- Add `?force_tier=free` to any dashboard URL to test the free tier experience

---

## Subscription Tier System

### How it works
- `/lib/subscription-tiers.ts` defines `TierLimits` with boolean flags per feature
- `getStoreTier()` reads `subscription_status` from `adwyse_stores` table
- `requireProFeature(storeId, 'featureName')` returns a 403 Response if not allowed
- `/api/me/tier` endpoint returns tier info for the frontend
- `/lib/use-tier.ts` `useTier()` hook auto-resolves storeId from `?shop=` URL param
- Sidebar, MobileNav, dashboard page all use `useTier()` to hide Pro features

### Tiers
- **Free**: 1 ad account, 100 orders/mo, 30 days history, basic dashboard + funnel only
- **Trial**: 7 days, all Pro features
- **Pro** ($99/mo): Everything — unlimited accounts/orders, AI Chat, Competitor Spy, Cohorts, NC-ROAS, Creative Score, Budget Optimizer, CAPI, Slack, etc.

### Gated endpoints (return 403 for free users)
- `/api/chat` (aiChat)
- `/api/competitor-ads` (competitorSpy)
- `/api/budget-optimizer` (predictiveBudget)
- `/api/metrics/nc-roas` (ncRoas)
- `/api/metrics/cohorts` (cohortRetention)
- `/api/creatives/score` (creativeScore)
- `/api/meta-capi/settings` POST when enabling (conversionsApi)

### UI gating
- Sidebar filters nav items with `proOnly: true` flag
- Dashboard wraps Pro widgets in `showPro &&`
- Pro pages (cohorts, creatives/score, competitor-spy) show `<UpgradeGate>` for free users
- Free users see an "Upgrade to Pro" CTA at bottom of sidebar + upgrade nudge on dashboard

---

## All Features Built

### 1. AI Chat ("Ask AdWyse")
- `/app/api/chat/route.ts` — Claude-powered, gets 30-day data context
- `/lib/chat-context.ts` — builds compact snapshot from orders + campaigns
- `/components/dashboard/AskAdWyse.tsx` — floating purple button + slide-up chat panel
- Suggested questions, message history, loading states
- **Pro gated**

### 2. Competitor Spy (Live Ad Scraping)
- `/lib/apify-ads.ts` — Apify integration, normalizer, 24h Supabase cache, dedupe, brand-name filter, US-only
- `/app/api/competitor-ads/route.ts` — returns real Apify data or demo fallback
- `/app/api/competitor-ads/debug/route.ts` — raw Apify output for debugging
- `/app/api/competitors/route.ts` — CRUD for tracked competitors
- `/components/dashboard/CompetitorSpy.tsx` — dashboard widget
- `/app/dashboard/competitor-spy/page.tsx` — full page with live ads modal, Discover tab with search
- Migration `030_competitor_ads_cache.sql` — cache table
- **Pro gated**, costs ~$0.015/scrape via Apify
- Env var: `APIFY_API_TOKEN`

### 3. AI Creative Score
- `/lib/creative-score.ts` — percentile scoring (ROAS 40%, CTR 25%, CVR 25%, spend 10%)
- `/app/api/creatives/score/route.ts` — scores all creatives, demo fallback
- `/app/dashboard/creatives/score/page.tsx` — ranked grid with filter pills, kill list
- Ranks: Top (80+), Good (60+), Average (40+), Poor (20+), Kill (<20)
- **Pro gated**

### 4. Cohort Retention
- `/app/api/metrics/cohorts/route.ts` — groups by TRUE all-time first order, not window-relative
- `/app/dashboard/cohorts/page.tsx` — heatmap with retention%/revenue$ toggle
- Stat cards: total customers, avg M1 retention, cohort revenue
- **Pro gated**

### 5. New vs Repeat ROAS (NC-ROAS)
- `/app/api/metrics/nc-roas/route.ts` — splits by customer_email history
- `/components/dashboard/NCRoasCard.tsx` — dual metric card on dashboard
- Revenue split bar, AOV comparison, auto-generated insight
- **Pro gated**

### 6. Predictive Budget Optimizer
- `/lib/predictive-budget.ts` — trend analysis, linear regression, day-of-week patterns
- `/app/api/budget-optimizer/route.ts` — API with demo data + real analysis
- `/components/dashboard/BudgetOptimizer.tsx` — dashboard widget
- Best days to advertise with glowing highlights, budget pacing, 7-day forecast
- **Pro gated**

### 7. Campaign Comparison Tool
- `/app/dashboard/campaigns/compare/page.tsx` — compare 2-4 campaigns side by side
- Bar chart + radar chart, winner highlighting, efficiency metrics
- "Compare" button on campaigns page header

### 8. Meta Conversions API (CAPI)
- `/lib/meta-capi.ts` — SHA-256 hashed PII, Graph API v21.0
- Pixel event endpoint forwards `purchase` events server-side to Meta
- `/app/api/meta-capi/settings/route.ts` — GET/POST for credentials (token masked)
- `/app/api/meta-capi/test/route.ts` — sends test PageView event
- Settings UI section on `/dashboard/settings` (blue card)
- Migration `031_meta_capi.sql` — store_settings columns + events log table
- **Pro gated** (only when enabling)
- Needs: Web Pixel in Meta Events Manager (NOT an App dataset) + CAPI access token

### 9. Slack Daily Digest
- `/lib/slack-notifications.ts` — existing sendSlackDailySummary, sendSlackAlert, testSlackWebhook
- `/app/api/cron/slack-daily/route.ts` — cron sends yesterday's metrics to all Slack-enabled stores
- POST handler for manual "send test" from settings
- Cron: `0 14 * * *` UTC

### 10. Quick Actions (Command Palette)
- `/components/dashboard/QuickActions.tsx` — Cmd+K, floating orange button
- Searchable, keyboard nav, grouped by Navigation/Actions/Reports

### 11. Conversion Funnel
- `/app/api/analytics/funnel/route.ts` + `/components/charts/FunnelChart.tsx`
- Page Views → Add to Cart → Checkout → Purchase

### 12. Creative Fatigue Alerts
- `/lib/alerts.ts`, `/lib/creative-fatigue.ts`
- Cron: `/api/cron/check-alerts` (hourly), `/api/cron/check-fatigue` (daily)
- Types: roas_low, spend_high, budget_pacing, creative_fatigue, conversion_drop

### 13. Multi-Touch Attribution
- `/lib/attribution-engine.ts`, `/app/api/attribution/route.ts`
- Models: last_click, first_click, linear, time_decay, position_based

### 14. First-Party Pixel
- `/app/api/pixel/script/[storeId]/route.ts` — generates tracking script
- `/app/api/pixel/event/route.ts` — receives events, forwards purchase to CAPI
- Events: page_view, add_to_cart, checkout_started, purchase

### 15. Profit Tracking (COGS) + Customer LTV + Goal Tracking + Email Reports
- All existing, documented per file paths below

---

## Key File Locations

### API Routes
```
/app/api/chat/route.ts                    — AI Chat
/app/api/competitor-ads/route.ts          — Competitor Spy ads
/app/api/competitors/route.ts             — Competitor CRUD
/app/api/budget-optimizer/route.ts        — Predictive budget
/app/api/metrics/nc-roas/route.ts         — NC-ROAS
/app/api/metrics/cohorts/route.ts         — Cohort retention
/app/api/creatives/score/route.ts         — Creative score
/app/api/meta-capi/settings/route.ts      — CAPI config
/app/api/meta-capi/test/route.ts          — CAPI test
/app/api/me/tier/route.ts                 — Tier lookup (frontend)
/app/api/cron/slack-daily/route.ts        — Slack daily digest
/app/api/pixel/event/route.ts             — Pixel receiver + CAPI forward
```

### Libraries
```
/lib/subscription-tiers.ts     — Tier limits, requireProFeature()
/lib/use-tier.ts               — useTier() React hook
/lib/apify-ads.ts              — Apify integration + cache
/lib/meta-capi.ts              — Meta Conversions API
/lib/creative-score.ts         — Creative scoring algorithm
/lib/chat-context.ts           — AI Chat data snapshot builder
/lib/predictive-budget.ts      — Budget forecasting
/lib/slack-notifications.ts    — Slack webhooks
/lib/email-reports.ts          — Email report templates
/lib/attribution-engine.ts     — Attribution models
```

### Dashboard Components
```
/components/dashboard/AskAdWyse.tsx       — AI Chat floating panel
/components/dashboard/CompetitorSpy.tsx   — Competitor widget
/components/dashboard/BudgetOptimizer.tsx — Budget widget
/components/dashboard/NCRoasCard.tsx      — NC-ROAS card
/components/dashboard/QuickActions.tsx    — Cmd+K palette
/components/dashboard/UpgradeGate.tsx     — Pro upgrade screen
/components/dashboard/Sidebar.tsx         — Nav (tier-filtered)
/components/dashboard/MobileNav.tsx       — Mobile nav (tier-filtered)
```

### Pages
```
/app/dashboard/page.tsx                   — Main dashboard
/app/dashboard/cohorts/page.tsx           — Cohort retention
/app/dashboard/creatives/score/page.tsx   — Creative score
/app/dashboard/competitor-spy/page.tsx    — Competitor spy
/app/dashboard/campaigns/compare/page.tsx — Campaign comparison
/app/pricing/page.tsx                     — Pricing page
/app/page.tsx                             — Homepage (has pricing section)
```

---

## Database Migrations
Located in `/supabase/migrations/`:
- `001` through `027` — original schema through goals
- `028` — Predictive budget (campaign_daily_stats)
- `029` — Competitor spy tables
- `030` — Competitor ads cache (Apify)
- `031` — Meta CAPI (store_settings columns + events log)

---

## Cron Jobs (vercel.json)
```json
{ "path": "/api/cron/check-alerts", "schedule": "0 * * * *" }
{ "path": "/api/cron/check-fatigue", "schedule": "0 10 * * *" }
{ "path": "/api/reports/send?frequency=weekly", "schedule": "0 8 * * 1" }
{ "path": "/api/reports/send?frequency=monthly", "schedule": "0 8 1 * *" }
{ "path": "/api/cron/slack-daily", "schedule": "0 14 * * *" }
{ "path": "/api/cron/check-subscriptions", "schedule": "0 0 * * *" }
```

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
CRON_SECRET=
APIFY_API_TOKEN=
```

---

## UI Conventions
- **Theme**: Dark mode (`bg-slate-900`/`bg-zinc-950`, `text-white`)
- **Accent**: Orange (`text-orange-400`, `bg-orange-500`)
- **Cards**: `bg-white/5 backdrop-blur border border-white/10 rounded-xl`
- **Buttons**: `bg-orange-500 hover:bg-orange-600 text-white rounded-lg`
- **Pro badges**: `bg-purple-500/20 text-purple-300 text-xs rounded-full`

## Common Patterns

### Demo Data Pattern
```typescript
const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';
if (storeId === DEMO_STORE_ID) {
  return NextResponse.json(generateDemoData());
}
```

### Pro Feature Gate Pattern
```typescript
import { requireProFeature } from '@/lib/subscription-tiers';
const gate = await requireProFeature(storeId, 'aiChat');
if (gate) return gate;
```

### Tier Check in Frontend
```typescript
import { useTier } from '@/lib/use-tier';
const { isPro, loading } = useTier();
if (!isPro) return <UpgradeGate feature="..." description="..." />;
```

---

## Current Status (April 9, 2026)
- All features built and deployed to Vercel
- Pricing page updated with all 12+ Pro features
- Homepage pricing section updated
- Tier gating enforced on all Pro endpoints + UI
- Free users see stripped-down dashboard + upgrade nudges
- Competitor Spy live with Apify (US-only, deduped, brand-filtered)
- CAPI code built but needs merchant with a Meta Web Pixel to test end-to-end (Adam's Meta pixel is an App dataset, not Web — needs to create a Web pixel via Shopify Facebook & Instagram channel)
- Slack daily digest cron active
- `?force_tier=free` URL param available for testing free tier experience

## What's Next
- Test free tier visuals (use `?force_tier=free`)
- Verify CAPI end-to-end with a real Web pixel
- Get first 5 real merchant users
- Submit to Shopify App Store
- Build onboarding email sequence (Resend)
- Consider: in-app help tooltips, CAPI setup wizard
