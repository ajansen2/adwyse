# Sprint 4: Automated Email Scheduling - Deployment Guide

## What We Built

The automated cart recovery system that:
- Runs every hour via Vercel Cron
- Checks all merchants with email recovery enabled
- Uses custom timing settings (not fixed 1h/24h/48h)
- Sends Email 1, 2, or 3 based on timing
- Stops at 3 emails max per cart

## Files Modified

1. **`/app/api/cron/recovery-emails/route.ts`** - Updated cron job logic
   - Now checks merchant email settings
   - Uses custom timing (first_email_delay, second_email_delay, third_email_delay)
   - Only processes merchants with emails_enabled = true

2. **`/vercel.json`** - Already configured!
   - Runs every hour: `"schedule": "0 * * * *"`
   - Calls `/api/cron/recovery-emails`

3. **`/app/api/cron/test-recovery/route.ts`** - NEW! Manual test endpoint
   - Visit `https://argora.ai/api/cron/test-recovery` to manually trigger cron job

## Environment Variables Needed

Add this to Vercel:

### CRON_SECRET
A secret key to prevent unauthorized cron job access.

**Generate one:**
```bash
openssl rand -base64 32
```

**Add to Vercel:**
1. Go to Vercel Dashboard → argora.ai project
2. Settings → Environment Variables
3. Add new variable:
   - Name: `CRON_SECRET`
   - Value: `<your-generated-secret>`
   - Environment: Production, Preview, Development

### NEXT_PUBLIC_APP_URL (if not set)
Should be: `https://argora.ai`

## How It Works

### Timing Logic

**Example:**
- Your settings: Email 1 at 1 hour, Email 2 at 24 hours, Email 3 at 48 hours
- Cart abandoned: Monday 10:00 AM
- Cron runs every hour

**What happens:**
1. **Monday 11:00 AM** (1 hour later)
   - Cron runs, sees cart abandoned 1 hour ago
   - Sends Email 1
   - Updates `first_email_sent_at` to Monday 11:00 AM

2. **Tuesday 11:00 AM** (24 hours after Email 1)
   - Cron runs, sees Email 1 was sent 24 hours ago
   - Sends Email 2
   - Updates `second_email_sent_at` to Tuesday 11:00 AM

3. **Thursday 11:00 AM** (48 hours after Email 2)
   - Cron runs, sees Email 2 was sent 48 hours ago
   - Sends Email 3
   - Updates `third_email_sent_at` to Thursday 11:00 AM
   - Cart now has 3 emails sent (max reached)

4. **Future cron runs**
   - Cart has 3 emails, skipped in future runs

### Toggle Behavior

When you turn OFF the email recovery toggle:
- Cron job checks `emails_enabled` in merchant settings
- Your stores are skipped
- No emails sent until you turn it back ON

## Testing

### Option 1: Manual Test (Recommended)

Visit in your browser:
```
https://argora.ai/api/cron/test-recovery
```

This will:
- Manually trigger the cron job
- Show you how many emails would be sent
- Display any errors

### Option 2: Wait for Hourly Run

The cron job runs every hour automatically. Check logs in:
- Vercel Dashboard → Deployments → Functions → Logs

### Option 3: Test with Old Cart

To test Email 1 immediately:
1. Update your test cart's `abandoned_at` timestamp to 2 hours ago
2. Set `emails_sent` to 0
3. Run manual test endpoint

**SQL to backdate cart:**
```sql
UPDATE abandoned_carts
SET
  abandoned_at = NOW() - INTERVAL '2 hours',
  emails_sent = 0,
  first_email_sent_at = NULL,
  second_email_sent_at = NULL,
  third_email_sent_at = NULL,
  status = 'abandoned'
WHERE id = 'f7796b06-88f3-4711-bf45-5a255c2f396d';
```

Then visit: `https://argora.ai/api/cron/test-recovery`

## Deployment Steps

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Sprint 4: Automated email scheduling with custom timing"
   git push
   ```

2. **Add CRON_SECRET to Vercel**
   - Generate secret: `openssl rand -base64 32`
   - Add to Vercel environment variables

3. **Test the cron job**
   - Visit `https://argora.ai/api/cron/test-recovery`
   - Should see JSON response with stats

4. **Monitor first automatic run**
   - Wait for the next hour (e.g., if it's 2:30 PM, wait until 3:00 PM)
   - Check Vercel logs for cron execution

## Monitoring

### Check if cron is running:
- Vercel Dashboard → Functions → Cron Jobs
- Should see "recovery-emails" running hourly

### Check logs:
- Vercel Dashboard → Deployments → (latest) → Functions → Logs
- Search for "Starting cart recovery email cron job"

### Expected log output:
```
🕐 Starting cart recovery email cron job...
📊 Found 1 merchants with email recovery enabled
📦 Processing 1 carts for merchant abc-123
📧 Sending email 1 for cart f7796b06-88f3-4711-bf45-5a255c2f396d
✅ Email 1 sent successfully for cart f7796b06-88f3-4711-bf45-5a255c2f396d
✅ Cron job completed
📊 Stats: 1 emails sent, 1 carts processed
```

## Troubleshooting

### No emails being sent?

1. **Check merchant settings:**
   - Is `emails_enabled` = true?
   - Are timing values set correctly?

2. **Check cart timing:**
   - Has enough time passed since abandonment?
   - Use SQL to check: `SELECT abandoned_at, emails_sent, NOW() FROM abandoned_carts;`

3. **Check cart status:**
   - Must be 'abandoned' or 'recovering'
   - Must have `emails_sent < 3`

4. **Check logs in Vercel:**
   - Look for errors in function logs

### Cron not running?

1. **Verify Vercel Pro plan:**
   - Hourly crons require Vercel Pro ($20/month)
   - Hobby plan only allows daily crons

2. **Check vercel.json:**
   - Should have cron configuration
   - Already set up in your project

3. **Redeploy:**
   - Sometimes need to redeploy after adding vercel.json

## Cost Considerations

### Vercel Cron Jobs
- **Pro Plan Required:** $20/month for hourly crons
- **Alternative:** Use free external cron services like:
  - cron-job.org (free, hits your endpoint hourly)
  - EasyCron (free tier available)

### Claude API Usage
- Haiku model: ~$0.0001 per email (very cheap!)
- 1000 emails = ~$0.10

### Resend API
- Free tier: 100 emails/day, 3000/month
- Pro tier: $20/month for 50k emails

## What's Next?

Sprint 4 is complete! Next sprint could include:
- Email open tracking
- Click tracking on "Complete Purchase" button
- Analytics dashboard
- A/B testing
- SMS recovery

## Questions?

If something isn't working:
1. Check Vercel logs
2. Run manual test endpoint
3. Check merchant settings in database
4. Verify environment variables are set
