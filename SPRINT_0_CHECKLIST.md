# ✅ SPRINT 0 CHECKLIST - Database & Setup

**Status:** IN PROGRESS
**Goal:** Get database migrated and API keys configured before Sprint 1

---

## 1. DATABASE MIGRATION (CRITICAL - DO THIS FIRST)

### Option A: Supabase Dashboard (RECOMMENDED - Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project: `Argos-Deals` or whatever it's named
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"** button

5. **First, run the cleanup script:**
   - Open `supabase/migrations/006b_cleanup_before_007.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **"Run"** (or press Cmd+Enter)
   - Wait for success message

6. **Then, run the main migration:**
   - Click "New Query" again
   - Open `supabase/migrations/007_transform_to_cart_recovery.sql`
   - Copy ALL contents (it's 600+ lines)
   - Paste into SQL Editor
   - Click **"Run"** (or press Cmd+Enter)
   - Wait for success message (may take 10-15 seconds)

7. **Verify tables were created:**
   - Click **"Table Editor"** in left sidebar
   - You should see these 8 NEW tables:
     - [ ] `merchants` (transformed from profiles)
     - [ ] `stores`
     - [ ] `abandoned_carts`
     - [ ] `recovery_campaigns`
     - [ ] `recovery_messages`
     - [ ] `recovered_orders`
     - [ ] `analytics_daily`
     - [ ] `subscriptions`
     - [ ] `activities` (kept from before)

### Option B: Supabase CLI (If you prefer)

```bash
cd /Users/adam/Desktop/Argora.ai/Argos-Deals/deals-dashboard
supabase db reset
```

### ❌ If You Get Errors

**Error: "constraint violation"** → Run cleanup script first (006b_cleanup_before_007.sql)
**Error: "trigger depends on function"** → Run cleanup script first
**Error: "table already exists"** → Tables are already created, skip to verification

---

## 2. VERIFY SUPABASE CONNECTION

Run this to test your app can connect to Supabase:

```bash
cd /Users/adam/Desktop/Argora.ai/Argos-Deals/deals-dashboard
npm run dev
```

Visit http://localhost:3001 (or 3000) and check:
- [ ] No "Supabase connection error" in console
- [ ] Homepage loads without errors
- [ ] Check browser console (F12) for any red errors

---

## 3. GET API KEYS (Do These in Order)

### A. Anthropic Claude API (REQUIRED FOR MVP)

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Go to **"API Keys"** section
4. Click **"Create Key"**
5. Copy the key (starts with `sk-ant-api03-...`)
6. Add $10 credit to your account (Settings → Billing)

**Save this:**
```
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

### B. Resend Email API (REQUIRED FOR MVP)

1. Go to https://resend.com/
2. Sign up (free 3,000 emails/month)
3. Go to **"API Keys"** section
4. Click **"Create API Key"**
5. Copy the key (starts with `re_...`)

**Save this:**
```
RESEND_API_KEY=re_your_key_here
```

### C. Shopify Partner Account (REQUIRED FOR SPRINT 2)

1. Go to https://partners.shopify.com/signup
2. Sign up for Shopify Partner account (FREE)
3. After signup, you'll get access to:
   - Development stores (free test stores)
   - App creation dashboard
   - Webhook testing tools

**You'll use this in Sprint 2 to create your Shopify App.**

### D. Stripe Test Mode (REQUIRED FOR SPRINT 7)

1. Go to https://dashboard.stripe.com/register
2. Sign up for Stripe account
3. Stay in **TEST MODE** (toggle in top right)
4. Go to Developers → API Keys
5. Copy **Publishable key** and **Secret key**

**Save these:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 4. UPDATE ENVIRONMENT VARIABLES

1. Copy the example file:
```bash
cd /Users/adam/Desktop/Argora.ai/Argos-Deals/deals-dashboard
cp .env.local.example .env.local
```

2. Edit `.env.local` and add:

```bash
# SUPABASE (You already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ANTHROPIC CLAUDE AI (Get from step 3A)
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# RESEND EMAIL (Get from step 3B)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@argora.ai

# STRIPE (Get from step 3D - Test mode keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# SHOPIFY (Leave blank for now - will add in Sprint 2)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_orders,read_customers,write_script_tags

# APP URL (For local development)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

3. **IMPORTANT:** Never commit `.env.local` to git (it's in .gitignore)

---

## 5. TEST EVERYTHING WORKS

```bash
cd /Users/adam/Desktop/Argora.ai/Argos-Deals/deals-dashboard
npm run dev
```

Visit http://localhost:3001 and verify:
- [ ] Homepage loads with $99/month pricing
- [ ] No SMS references anywhere
- [ ] "Install Shopify App" buttons work (even if they go to placeholder)
- [ ] No console errors in browser (F12)

---

## 6. COMMIT YOUR PROGRESS

```bash
cd /Users/adam/Desktop/Argora.ai/Argos-Deals/deals-dashboard
git add .
git commit -m "Sprint 0 complete: Database migration + landing pages updated to $99/month Shopify App"
git push origin main
```

---

## ✅ SPRINT 0 COMPLETION CRITERIA

Check all boxes before starting Sprint 1:

- [ ] Database migration ran successfully (8 tables exist in Supabase)
- [ ] Supabase connection works (no errors in app)
- [ ] Anthropic API key obtained and added to .env.local
- [ ] Resend API key obtained and added to .env.local
- [ ] Shopify Partner account created (for Sprint 2)
- [ ] Stripe test account created (for Sprint 7)
- [ ] Landing pages show $99/month pricing
- [ ] No SMS references on any page
- [ ] Dev server runs without errors
- [ ] Changes committed to git

---

## ⏭️ NEXT: START SPRINT 1

Once all boxes are checked, come back and say:

**"Sprint 0 complete, ready for Sprint 1"**

And we'll start building:
- Merchant signup/login with Supabase Auth
- Dashboard layout with sidebar navigation
- Empty state: "Connect Your Shopify Store" CTA
- Basic profile management

**Estimated time for Sprint 1:** 3-4 days at 16hr/day = 48-64 hours

Let's do this! 🚀
