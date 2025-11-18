# Pre-Launch Test Plan for Argora Cart Recovery

## Overview
Comprehensive testing checklist before launching the $99/month Shopify cart recovery app.

**Test Environment**: argora-test.myshopify.com
**Production URL**: https://argora.ai
**Test Date**: October 18, 2025

---

## Test 1: OAuth + Billing Flow ✅

### Prerequisites
- [ ] Clear existing test store connections from Supabase
- [ ] Uninstall app from argora-test store (if installed)
- [ ] Clear browser cookies/cache

### Test Steps
1. **Start OAuth Install**
   - [ ] Visit: https://argora.ai/dashboard/connect-store
   - [ ] Enter: `argora-test.myshopify.com`
   - [ ] Click "Connect Store"

2. **OAuth Authorization**
   - [ ] Redirected to Shopify OAuth page
   - [ ] Verify permissions requested (read orders, read products, etc.)
   - [ ] Click "Install app"

3. **Billing Approval**
   - [ ] Redirected to Shopify billing approval page
   - [ ] Verify: "Argora Cart Recovery - Pro Plan"
   - [ ] Verify: "$99.00/month"
   - [ ] Verify: "14-day free trial"
   - [ ] Verify: "$0.00 due today" (test mode)
   - [ ] Click "Approve"

4. **Success Verification**
   - [ ] Redirected to: https://argora.ai/dashboard?billing=success
   - [ ] Success banner appears with confetti/celebration
   - [ ] Banner shows: "Welcome to Argora Cart Recovery! 🎉"
   - [ ] Banner shows: "14-day free trial" information
   - [ ] Banner shows checklist: webhooks, cart detection, AI emails
   - [ ] Banner auto-hides after 10 seconds
   - [ ] Top-right badge shows: "✓ Pro Plan" in GREEN

5. **Database Verification** (Check Supabase)
   - [ ] `merchants` table has new row with correct email
   - [ ] `stores` table has new row:
     - `billing_status`: "active"
     - `billing_charge_id`: (Shopify charge ID)
     - `subscription_tier`: "pro"
     - `trial_ends_at`: 14 days from now
     - `webhook_configured`: true
   - [ ] `auth.users` table has user account created

6. **Shopify Verification**
   - [ ] Check Shopify admin > Settings > Apps and sales channels
   - [ ] Argora app is installed
   - [ ] Check Shopify > Settings > Webhooks
   - [ ] Two webhooks registered:
     - `checkouts/create`
     - `checkouts/update`

---

## Test 2: Abandoned Cart Detection 🛒

### Test Steps

1. **Create Test Abandoned Cart #1**
   - [ ] In Shopify admin, create a test checkout
   - [ ] Add product to cart (e.g., "Test Product - $50")
   - [ ] Enter customer details:
     - Email: test1@example.com
     - First name: John
     - Last name: Smith
   - [ ] Proceed to shipping/payment but DON'T complete
   - [ ] Abandon the cart (close browser)

2. **Create Test Abandoned Cart #2**
   - [ ] Repeat above with different customer:
     - Email: test2@example.com
     - First name: Jane
     - Last name: Doe
     - Cart value: $75

3. **Create Test Abandoned Cart #3**
   - [ ] Repeat with:
     - Email: test3@example.com
     - First name: Bob
     - Last name: Johnson
     - Cart value: $120

4. **Verify Webhook Processing**
   - [ ] Check Vercel logs: https://vercel.com/adam-s-projects-59a2a3e0/deals-dashboard
   - [ ] Look for webhook logs showing "checkouts/create" received
   - [ ] Verify no errors in processing

5. **Verify Dashboard Display**
   - [ ] Refresh: https://argora.ai/dashboard
   - [ ] **Abandoned Carts** metric shows: "3"
   - [ ] **Recovery Rate** shows: "0%" (none recovered yet)
   - [ ] **Revenue Recovered** shows: "$0.00"
   - [ ] **Recent Abandoned Carts** section shows 3 carts:
     - Cart 1: John Smith, test1@example.com, $50.00
     - Cart 2: Jane Doe, test2@example.com, $75.00
     - Cart 3: Bob Johnson, test3@example.com, $120.00
   - [ ] All carts show status badge: "Abandoned" (yellow)
   - [ ] Timestamps are correct (e.g., "Oct 18, 11:30 PM")

6. **Verify Database** (Check Supabase `abandoned_carts` table)
   - [ ] 3 rows created
   - [ ] Each has correct:
     - `customer_email`
     - `customer_first_name`
     - `customer_last_name`
     - `cart_value`
     - `status`: "abandoned"
     - `abandoned_at`: correct timestamp
     - `emails_sent`: 0
     - `store_id`: matches your store

---

## Test 3: Email Sending & Timing ✉️

### Email Timing Configuration
Default settings (in `merchants.settings`):
- **Email 1**: 1 hour after abandonment
- **Email 2**: 24 hours after Email 1
- **Email 3**: 48 hours after Email 2

### Test Steps

#### Option A: Wait for Real Timing (Slow but realistic)
1. **Wait 1 Hour**
   - [ ] Wait 1 hour after creating abandoned carts
   - [ ] Cron job runs (every hour)
   - [ ] Emails sent to all 3 test customers

#### Option B: Manual Test (Fast)
1. **Modify Abandoned Cart Timestamps** (Supabase)
   - [ ] Go to Supabase > abandoned_carts table
   - [ ] Edit `abandoned_at` for Cart #1 to 2 hours ago
   - [ ] Edit `abandoned_at` for Cart #2 to 1.5 hours ago
   - [ ] Edit `abandoned_at` for Cart #3 to 30 minutes ago

2. **Manually Trigger Cron Job**
   - [ ] Visit: https://argora.ai/api/cron/test-recovery
   - [ ] Check response:
     ```json
     {
       "success": true,
       "emailsSent": 2,
       "cartsProcessed": 3
     }
     ```
   - [ ] Only Cart #1 and #2 should get emails (>1 hour old)

3. **Verify Emails Sent** (Check Resend Dashboard)
   - [ ] Go to: https://resend.com/emails
   - [ ] 2 emails sent to:
     - test1@example.com
     - test2@example.com
   - [ ] Email subject: "You left something behind! 🛒"
   - [ ] Email contains:
     - Customer's first name
     - Cart value
     - Product details
     - "Complete Your Order" button
     - Recovery link

4. **Verify Dashboard Updates**
   - [ ] Refresh: https://argora.ai/dashboard
   - [ ] Cart #1 status changed to: "Recovering" (blue badge)
   - [ ] Cart #2 status changed to: "Recovering" (blue badge)
   - [ ] Cart #3 status still: "Abandoned" (yellow badge)

5. **Verify Database Updates** (Supabase `abandoned_carts`)
   - [ ] Cart #1:
     - `emails_sent`: 1
     - `first_email_sent_at`: current timestamp
     - `status`: "recovering"
   - [ ] Cart #2: same as Cart #1
   - [ ] Cart #3: unchanged (emails_sent: 0, status: "abandoned")

### Test Email #2 and #3 Timing

6. **Test Second Email** (24 hours after Email #1)
   - [ ] Modify `first_email_sent_at` to 25 hours ago for Cart #1
   - [ ] Run: https://argora.ai/api/cron/test-recovery
   - [ ] Email #2 sent to Cart #1
   - [ ] Database updated:
     - `emails_sent`: 2
     - `second_email_sent_at`: current timestamp

7. **Test Third Email** (48 hours after Email #2)
   - [ ] Modify `second_email_sent_at` to 49 hours ago
   - [ ] Run: https://argora.ai/api/cron/test-recovery
   - [ ] Email #3 sent to Cart #1
   - [ ] Database updated:
     - `emails_sent`: 3
     - `third_email_sent_at`: current timestamp

8. **Verify Max 3 Emails**
   - [ ] Run cron again
   - [ ] NO more emails sent to Cart #1
   - [ ] Response shows: `emailsSent: 0` for Cart #1

---

## Test 4: Cart Recovery Flow (Completion) ✅

### Test Steps

1. **Simulate Customer Completing Purchase**
   - [ ] Click recovery link in email
   - [ ] Redirected to Shopify checkout
   - [ ] Complete the purchase
   - [ ] Order confirmed

2. **Verify Shopify Order**
   - [ ] Check Shopify admin > Orders
   - [ ] New order appears for recovered cart
   - [ ] Order value matches abandoned cart value

3. **Verify Dashboard Update**
   - [ ] Refresh: https://argora.ai/dashboard
   - [ ] Cart status changed to: "Recovered" (green badge)
   - [ ] **Recovery Rate** updated (e.g., "33.3%" if 1 of 3 recovered)
   - [ ] **Revenue Recovered** updated (e.g., "$50.00")

4. **Verify Database Update** (Supabase `abandoned_carts`)
   - [ ] Cart row updated:
     - `status`: "recovered"
     - `recovered_at`: completion timestamp

---

## Test 5: Edge Cases & Error Handling 🔧

### Test Invalid Scenarios

1. **Invalid Shop URL**
   - [ ] Visit: https://argora.ai/dashboard/connect-store
   - [ ] Enter: "invalid-shop"
   - [ ] Error message appears
   - [ ] No crash

2. **Duplicate Store Install**
   - [ ] Try installing same store twice
   - [ ] System handles gracefully (updates existing or shows message)

3. **Billing Declined**
   - [ ] Start OAuth flow
   - [ ] Click "Decline" on billing page
   - [ ] Redirected to: /dashboard?billing=declined
   - [ ] Appropriate message shown
   - [ ] Database shows `billing_status`: "declined"

4. **Email Sending Failure**
   - [ ] Temporarily break Resend API key (wrong key in env)
   - [ ] Run cron job
   - [ ] Check logs for graceful error handling
   - [ ] Cron doesn't crash, logs error
   - [ ] Restore API key

---

## Test 6: Performance & Reliability ⚡

### Test Steps

1. **Load Test: Multiple Carts**
   - [ ] Create 20 abandoned carts
   - [ ] Run cron job
   - [ ] All 20 emails sent successfully
   - [ ] No rate limiting issues
   - [ ] Response time < 30 seconds

2. **Webhook Stress Test**
   - [ ] Create 10 carts rapidly
   - [ ] All webhooks processed
   - [ ] No dropped events
   - [ ] Database has all 10 carts

3. **Dashboard Performance**
   - [ ] Dashboard loads in < 2 seconds
   - [ ] Metrics calculate correctly
   - [ ] No console errors

---

## Test 7: Production Readiness Checklist ✅

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` = https://argora.ai
- [ ] `SHOPIFY_CLIENT_ID_PRODUCTION` set
- [ ] `SHOPIFY_CLIENT_SECRET_PRODUCTION` set
- [ ] `RESEND_API_KEY` set
- [ ] `CRON_SECRET` set (for cron job security)

### Shopify App Configuration
- [ ] App URL: https://argora.ai
- [ ] Allowed redirect URLs includes: https://argora.ai/api/auth/shopify/callback
- [ ] Webhooks configured with correct URL
- [ ] Billing configured: $99/month, 14-day trial

### Vercel Cron Job
- [ ] Cron job scheduled in vercel.json: `"0 * * * *"` (every hour)
- [ ] OR: External cron service (cron-job.org) hitting /api/cron/recovery-emails

### Database
- [ ] All migrations applied
- [ ] RLS policies configured
- [ ] Indexes created for performance

### Monitoring
- [ ] Vercel logs accessible
- [ ] Supabase logs accessible
- [ ] Resend dashboard accessible
- [ ] Shopify Partner dashboard accessible

---

## Launch Decision Criteria ✅

**Ready to launch when ALL these are TRUE:**

- [x] OAuth flow works end-to-end
- [x] Billing approval works (test mode)
- [ ] Abandoned carts detected and shown on dashboard
- [ ] Emails send at correct times
- [ ] Email content is correct and professional
- [ ] Recovery completion flow works
- [ ] No critical bugs or errors
- [ ] Performance is acceptable
- [ ] All environment variables are set
- [ ] Monitoring is in place

---

## Post-Launch Monitoring 📊

**First 24 Hours:**
- [ ] Check every 6 hours for errors
- [ ] Monitor first real customer install
- [ ] Verify first real abandoned cart
- [ ] Verify first real email sent
- [ ] Verify first real recovery

**First Week:**
- [ ] Monitor daily
- [ ] Track customer feedback
- [ ] Track recovery rate
- [ ] Check for any edge cases

**First Month:**
- [ ] Collect performance metrics
- [ ] Optimize email timing based on data
- [ ] Plan feature improvements
- [ ] Apply for "Built for Shopify" badge (if 50+ installs)

---

## Test Results Log

| Test | Status | Date | Notes |
|------|--------|------|-------|
| OAuth + Billing | ⏳ Pending | - | - |
| Cart Detection | ⏳ Pending | - | - |
| Email Sending | ⏳ Pending | - | - |
| Cart Recovery | ⏳ Pending | - | - |
| Edge Cases | ⏳ Pending | - | - |
| Performance | ⏳ Pending | - | - |
| Production Ready | ⏳ Pending | - | - |

**Legend:**
- ⏳ Pending
- ✅ Passed
- ❌ Failed
- ⚠️ Issues Found

---

## Next Steps After Testing

1. Fix any issues found during testing
2. Document any workarounds or known limitations
3. Prepare customer support materials
4. Set up monitoring alerts
5. Launch! 🚀
6. Submit to Shopify App Store in parallel
