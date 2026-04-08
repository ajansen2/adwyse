# AdWyse - Claude Code Documentation

## Project Overview
AdWyse is a Shopify app for ad attribution analytics, competing with Triple Whale ($149-219/mo). Target price: $99.99/mo.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Shopify OAuth + Supabase Auth
- **Styling**: Tailwind CSS (dark theme)
- **Charts**: Recharts
- **Email**: Resend
- **AI**: Claude API (Anthropic)

## Key Store ID
Demo store for Adam: `987c61dd-7696-47ca-bf05-37876953b0ca`

---

## Features Built

### 1. AI Budget Optimizer with Predictions
**Files:**
- `/app/api/budget-optimizer/route.ts` - API with demo data and real campaign analysis
- `/components/dashboard/BudgetOptimizer.tsx` - Dashboard widget
- `/lib/predictive-budget.ts` - Trend analysis, forecasting engine

**Features:**
- Campaign performance analysis
- Budget reallocation recommendations
- Trend detection (improving/declining/stable)
- Day-of-week performance patterns
- 7-day ROAS predictions
- Budget pacing indicator
- Confidence scores

### 2. Conversion Funnel
**Files:**
- `/app/api/analytics/funnel/route.ts` - Funnel data from pixel events
- `/components/charts/FunnelChart.tsx` - Visual funnel

**Stages:** Page Views → Add to Cart → Checkout → Purchase

### 3. Creative Fatigue Alerts (Email + Slack)
**Files:**
- `/lib/alerts.ts` - Alert system with creative_fatigue detection
- `/lib/creative-fatigue.ts` - Fatigue analysis logic
- `/app/api/cron/check-alerts/route.ts` - Hourly cron for email/Slack
- `/app/api/cron/check-fatigue/route.ts` - Daily fatigue check

**Alert Types:** roas_low, spend_high, budget_pacing, creative_fatigue, conversion_drop

### 4. Multi-Touch Attribution
**Files:**
- `/lib/attribution-engine.ts` - Attribution calculations
- `/app/api/attribution/route.ts` - Attribution API

**Models:** last_click, first_click, linear, time_decay, position_based

### 5. First-Party Pixel
**Files:**
- `/app/api/pixel/script/[storeId]/route.ts` - Pixel script generator
- `/app/api/pixel/event/route.ts` - Event receiver

**Events:** page_view, add_to_cart, checkout_started, purchase

### 6. Competitor Spy
**Files:**
- `/components/dashboard/CompetitorSpy.tsx` - Dashboard widget
- `/app/api/competitors/route.ts` - CRUD API
- `/app/dashboard/competitor-spy/page.tsx` - Full page

**Features:**
- Track competitors by name
- Quick search → Meta Ad Library
- Save competitor notes

### 7. Profit Tracking (COGS)
**Files:**
- `/app/api/products/costs/route.ts` - Product costs API
- `/app/dashboard/profit/page.tsx` - Profit dashboard
- `/components/dashboard/ProfitSummary.tsx` - Widget

### 8. Goal Tracking
**Files:**
- `/app/api/goals/route.ts` - Goals CRUD
- `/app/api/goals/progress/route.ts` - Progress tracking
- `/components/dashboard/GoalProgress.tsx` - Widget

### 9. Customer LTV
**Files:**
- `/app/api/ltv/route.ts` - LTV calculations
- `/app/dashboard/ltv/page.tsx` - LTV dashboard

### 10. Campaign Comparison Tool
**Files:**
- `/app/dashboard/campaigns/compare/page.tsx` - Side-by-side comparison page

**Features:**
- Compare 2-4 campaigns side by side
- Core metrics comparison (spend, revenue, ROAS, orders)
- Efficiency metrics (CPC, CTR, CVR, AOV, CPA)
- Bar chart and radar chart visualizations
- Winner highlighting for each metric
- Campaign selector modal

### 11. Quick Actions (Command Palette)
**Files:**
- `/components/dashboard/QuickActions.tsx` - Floating action button + modal

**Features:**
- Floating action button (bottom right)
- Cmd+K keyboard shortcut to open
- Search through actions
- Keyboard navigation (arrows + enter)
- Grouped by category (Navigation, Actions, Reports)
- Quick access to all major pages

### 12. Weekly Email Reports
**Files:**
- `/lib/email-reports.ts` - Report generation and sending
- `/app/api/reports/send/route.ts` - Cron trigger endpoint
- `/app/api/reports/settings/route.ts` - User preferences

**Features:**
- Weekly and monthly report options
- Beautiful HTML email template
- Top campaigns breakdown
- ROAS and revenue summaries
- Pro feature (tier-gated)

---

## Database Migrations
Located in `/supabase/migrations/`:
- `001` - Initial schema
- `020` - Webhook reliability
- `021` - Profit tracking (COGS)
- `022` - Multi-touch attribution
- `023` - First-party pixel
- `024` - Creative attribution
- `025` - Enhanced alerts
- `026` - Slack integration
- `027` - Goals & targets
- `028` - Predictive budget (campaign_daily_stats)
- `029` - Competitor spy

---

## Cron Jobs
Configure in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/check-alerts", "schedule": "0 * * * *" },
    { "path": "/api/cron/check-fatigue", "schedule": "0 6 * * *" },
    { "path": "/api/reports/send?frequency=weekly", "schedule": "0 9 * * 1" },
    { "path": "/api/reports/send?frequency=monthly", "schedule": "0 9 1 * *" }
  ]
}
```

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

---

## Planned Features (Need External Dependencies)

### View-Through Attribution
- Needs Facebook/Google Ads API for impression data
- See `/docs/ROADMAP_VIEW_THROUGH_ATTRIBUTION.md`

### Meta Ad Library API Integration
- Needs Facebook App Review approval for `ads_read`
- See `/docs/ROADMAP_META_AD_LIBRARY.md`

---

## UI Conventions
- **Theme**: Dark mode (`bg-slate-900`, `text-white`)
- **Accent**: Orange (`text-orange-400`, `bg-orange-500`)
- **Cards**: `bg-white/5 backdrop-blur border border-white/10 rounded-xl`
- **Buttons**: `bg-orange-500 hover:bg-orange-600 text-white rounded-lg`

---

## Common Patterns

### Demo Data Pattern
```typescript
const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

if (storeId === DEMO_STORE_ID) {
  return NextResponse.json(generateDemoData());
}
```

### API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');
  if (!storeId) {
    return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
  }
  // ...
}
```

### Dashboard Component Pattern
```typescript
export function MyWidget({ storeId }: { storeId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/my-endpoint?store_id=${storeId}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <LoadingSkeleton />;
  return <div>...</div>;
}
```
