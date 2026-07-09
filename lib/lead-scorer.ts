/**
 * Lead Scorer — uses Claude Haiku to classify Reddit posts
 * and draft reply suggestions for AdWyse leads.
 */

import Anthropic from '@anthropic-ai/sdk';
import { RedditPost } from './lead-scanner';

const anthropic = new Anthropic();

export interface ScoredLead {
  post: RedditPost;
  isLead: boolean;
  score: number;
  reason: string;
  skipReason: string | null;
  draftReply: string | null;
}

const SYSTEM_PROMPT = `You are a lead qualification assistant for AdWyse, a Shopify ad attribution app ($99/mo, competes with Triple Whale at $149-219/mo).

You must respond with ONLY valid JSON, no markdown fences, no extra text.`;

function buildUserPrompt(post: RedditPost): string {
  return `Analyze this Reddit post and respond in JSON:

Title: ${post.title}
Body: ${post.body.slice(0, 2000)}
Subreddit: r/${post.subreddit}
Author: u/${post.author}

{
  "isLead": boolean,        // true if this is a merchant with an attribution/ROAS problem AdWyse solves
  "score": 1-10,            // 10 = actively looking for a tool, 1 = vaguely related
  "reason": "one line",     // why this is or isn't a lead
  "skipReason": "string|null", // if not a lead: "vendor_post", "too_technical", "different_problem", etc.
  "draftReply": "string"    // A helpful reply that: (1) answers their actual question first, (2) mentions AdWyse naturally as one option, (3) never sounds like an ad. Write as a fellow merchant/founder, not a salesperson. If score < 5, set to null.
}`;
}

/**
 * Score a single Reddit post using Claude Haiku.
 */
async function scoreOne(post: RedditPost): Promise<ScoredLead> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(post) }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip markdown fences if Haiku wraps them
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      post,
      isLead: !!parsed.isLead,
      score: Math.min(10, Math.max(1, Number(parsed.score) || 1)),
      reason: String(parsed.reason || ''),
      skipReason: parsed.skipReason || null,
      draftReply: parsed.draftReply || null,
    };
  } catch (err) {
    console.error(`[lead-scorer] Error scoring post ${post.id}:`, err);
    return {
      post,
      isLead: false,
      score: 0,
      reason: 'Scoring failed',
      skipReason: 'error',
      draftReply: null,
    };
  }
}

/**
 * Score all posts. Runs sequentially to stay within rate limits.
 */
export async function scoreLeads(posts: RedditPost[]): Promise<ScoredLead[]> {
  const results: ScoredLead[] = [];

  for (const post of posts) {
    const scored = await scoreOne(post);
    results.push(scored);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  console.log(
    `[lead-scorer] Scored ${results.length} posts, ${results.filter((r) => r.score >= 5).length} actionable leads`
  );
  return results;
}
