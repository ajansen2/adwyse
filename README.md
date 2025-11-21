# AdWyse

AI-powered ad attribution for Shopify merchants. Track which ads actually make you money.

## What is AdWyse?

AdWyse solves the attribution crisis caused by iOS 14 privacy updates. We help Shopify merchants:
- Track every order back to its original ad source (Facebook, Google, TikTok)
- Calculate true ROAS (Return on Ad Spend)
- Get AI-powered insights on which campaigns to pause/scale
- Stop wasting money on underperforming ads

## Pricing

$99/month with 7-day free trial

## Tech Stack

- **Frontend:** Next.js 15.5.4 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude Haiku (Anthropic)
- **Hosting:** Vercel
- **Domain:** adwyse.ca

## Getting Started

### Prerequisites
- Node.js 18+
- Shopify Partner account
- Supabase account
- Anthropic API key

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_secret
SHOPIFY_SCOPES=read_orders,read_customers

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# App URL
NEXT_PUBLIC_APP_URL=https://adwyse.ca
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

Run the migration in Supabase SQL Editor:

```bash
supabase/migrations/001_adwyse_initial_schema.sql
```

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

## Features

- ✅ Shopify OAuth integration
- ✅ Order tracking with UTM attribution
- ✅ Facebook Ads integration
- ✅ Google Ads integration
- ✅ AI-powered insights (Claude Haiku)
- ✅ ROAS calculations
- 🚧 TikTok Ads integration (coming soon)
- 🚧 Weekly email reports (coming soon)

## License

Proprietary - © 2025 Adam Jansen
