# 📧 Webhook & Email Testing Guide

## ✅ What's Been Set Up

### Email System (SendGrid)
All email templates are ready and will be triggered automatically:

1. **Welcome Email** (`/api/emails/welcome`)
   - Sent when: User completes first payment (setup fee)
   - Includes: Dashboard link, quick start guide, features overview

2. **Payment Success** (`/api/emails/payment-success`)
   - Sent when: Subscription renewal payment succeeds
   - Includes: Payment confirmation, amount, subscription details

3. **Payment Failed** (`/api/emails/payment-failed`)
   - Sent when: Payment fails (expired card, insufficient funds, etc.)
   - Includes: Warning, action steps, update payment link

4. **Subscription Cancelled** (`/api/emails/subscription-cancelled`)
   - Sent when: User cancels subscription
   - Includes: Cancellation confirmation, feedback request, reactivation option

### Stripe Webhook
Already configured at `/api/webhooks/stripe/route.ts` and handles:
- ✅ `checkout.session.completed` → Updates database + sends welcome email
- ✅ `customer.subscription.created` → Creates subscription record
- ✅ `customer.subscription.updated` → Updates subscription status
- ✅ `customer.subscription.deleted` → Marks as cancelled + sends email
- ✅ `invoice.payment_succeeded` → Records payment
- ✅ `invoice.payment_failed` → Marks past_due + sends alert email

---

## 🔧 Setup Required

### 1. Add SendGrid API Key

You need to set up SendGrid to enable emails:

**Option A: Use Existing SendGrid Account**
- Go to SendGrid Dashboard → Settings → API Keys
- Create new key with "Mail Send" permission
- Copy the key

**Option B: Create Free SendGrid Account**
- Go to https://signup.sendgrid.com/
- Sign up for free tier (100 emails/day forever)
- Verify your email
- Create API key

**Add to Vercel:**
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@argora.ai
```

### 2. Configure Stripe Webhook (Production)

**In Stripe Dashboard:**
1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://deals.argora.ai/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret**

**Add to Vercel:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Add to .env.local (for local testing):**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🧪 Testing Locally (Before Deploy)

### 1. Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### 2. Forward Webhooks to Localhost
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_test_`

### 3. Run Your App
```bash
npm run dev
```

### 4. Trigger Test Events
```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

### 5. Check Logs
- Look in terminal for `✅ Email sent to...`
- Check SendGrid Activity (if API key is set)
- Verify database updates in Supabase

---

## 🚀 Testing in Production

### 1. Use Stripe Test Mode
In your Stripe Dashboard (Test Mode):
- Create a test payment with card: `4242 4242 4242 4242`
- Use any future expiry date and any CVC
- Complete checkout

### 2. Check Results
- Go to Stripe → Developers → Webhooks → Your endpoint
- Check "Recent Events" to see if webhook was called
- Check Supabase → profiles table → verify user record updated
- **Check your email** (if SendGrid is configured)

### 3. Simulate Failures
Use these test cards to trigger different scenarios:

**Payment Declined:**
- Card: `4000 0000 0000 0002`
- This will trigger `invoice.payment_failed` → sends alert email

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`

**Expired Card:**
- Card: `4000 0000 0000 0069`

---

## ✉️ Email Templates Preview

### Welcome Email
- Logo + "Welcome to Your Investment Dashboard! 🎉"
- Success badge
- Dashboard access button
- Features checklist
- Quick start guide
- Support contact

### Payment Success
- "Payment Successful! ✅"
- Amount badge ($50.00)
- Subscription details
- Dashboard link

### Payment Failed
- "⚠️ Payment Failed"
- Reason list (insufficient funds, expired card, etc.)
- Update payment button
- Grace period info (7 days)

### Subscription Cancelled
- "We're Sorry to See You Go"
- What happens next
- Feedback request
- Reactivate option

---

## 🐛 Troubleshooting

### Emails Not Sending

**Check 1: Is SendGrid API Key Set?**
```bash
# In Vercel, check environment variables
# Look for SENDGRID_API_KEY
```

**Check 2: Is FROM_EMAIL Verified?**
- SendGrid requires sender verification
- Go to SendGrid → Sender Authentication
- Verify your FROM_EMAIL address

**Check 3: Check Logs**
```bash
# Look for these in Vercel logs or terminal:
✅ Email sent to user@example.com
# OR
⚠️ SENDGRID_API_KEY not configured - email not sent
```

### Webhook Not Triggering

**Check 1: Webhook Secret Correct?**
- Copy from Stripe Dashboard → Webhooks → Signing secret
- Must match STRIPE_WEBHOOK_SECRET in .env

**Check 2: Check Stripe Webhook Logs**
- Stripe Dashboard → Developers → Webhooks → Your endpoint
- Click on webhook → View logs
- Look for 200 responses (success) or errors

**Check 3: Endpoint URL Correct?**
- Should be: `https://deals.argora.ai/api/webhooks/stripe`
- NOT: `http://localhost:3000/...` (production)

---

## 📊 Monitoring

### Stripe Dashboard
- Webhooks → Your endpoint → Recent events
- Shows all triggered events and responses

### SendGrid Dashboard
- Activity → Shows all sent emails
- Email status (delivered, opened, bounced)

### Supabase Dashboard
- profiles table → Check updated fields:
  - `stripe_customer_id`
  - `subscription_status`
  - `setup_fee_paid`
  - `last_payment_date`

---

## 🎯 Quick Checklist for Launch

- [ ] SendGrid API key added to Vercel
- [ ] FROM_EMAIL verified in SendGrid
- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret added to Vercel
- [ ] Test payment completed successfully
- [ ] Welcome email received
- [ ] Database updated with payment info
- [ ] Subscription status shows "active"

---

## 🆘 Support

If emails aren't working:
1. Emails will gracefully fail (won't break the app)
2. Users can still access dashboard via URL
3. You can manually send credentials via support email

**For Testing Help:**
- Stripe Test Mode Docs: https://stripe.com/docs/testing
- SendGrid API Docs: https://docs.sendgrid.com/api-reference
