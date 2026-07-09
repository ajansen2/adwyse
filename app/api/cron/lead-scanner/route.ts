import { NextRequest, NextResponse } from 'next/server';
import { scanReddit } from '@/lib/lead-scanner';
import { scoreLeads } from '@/lib/lead-scorer';
import { sendLeadDigest } from '@/lib/lead-digest';

/**
 * Lead Scanner Cron — daily at noon UTC
 *
 * 1. Search Reddit for merchants with attribution/ROAS problems
 * 2. Score each post with Claude Haiku
 * 3. Send digest email to Adam
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/lead-scanner", "schedule": "0 12 * * *" }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[lead-scanner-cron] Starting daily scan...');

    // Step 1: Search Reddit
    const posts = await scanReddit();
    console.log(`[lead-scanner-cron] Found ${posts.length} unique posts`);

    if (posts.length === 0) {
      // No posts found — send a "quiet day" email
      const result = await sendLeadDigest([]);
      return NextResponse.json({
        posts: 0,
        leads: 0,
        emailSent: result.success,
      });
    }

    // Step 2: Score with Haiku
    const scored = await scoreLeads(posts);
    const actionable = scored.filter((s) => s.score >= 5);
    console.log(
      `[lead-scanner-cron] ${actionable.length}/${scored.length} actionable leads`
    );

    // Step 3: Send digest
    const result = await sendLeadDigest(scored);

    return NextResponse.json({
      posts: posts.length,
      scored: scored.length,
      leads: actionable.length,
      emailSent: result.success,
      emailError: result.error || null,
    });
  } catch (err) {
    console.error('[lead-scanner-cron] Fatal error:', err);
    return NextResponse.json(
      { error: 'Lead scanner failed', details: String(err) },
      { status: 500 }
    );
  }
}
