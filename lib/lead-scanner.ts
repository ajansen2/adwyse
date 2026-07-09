/**
 * Reddit Lead Scanner for AdWyse
 *
 * Searches Reddit's public JSON API for merchants asking about
 * ad attribution problems — potential AdWyse customers.
 */

const USER_AGENT = 'AdWyse Lead Scanner 1.0 (by /u/adwyse_app)';
const RATE_LIMIT_MS = 2100; // >2s between requests (Reddit's rule)

const SUBREDDITS = [
  'shopify',
  'ecommerce',
  'FacebookAds',
  'PPC',
  'ShopifyeCommerce',
  'dropship',
];

// Phrase-combo queries: each entry becomes a Reddit search query
const SEARCH_QUERIES = [
  // "triple whale" + pain signals
  '"triple whale" expensive OR alternative OR "worth it" OR cancel OR "too much" OR pricing',
  // "attribution" + broken signals
  '"attribution" broken OR wrong OR iOS OR "doesn\'t match" OR inaccurate OR lost',
  // "ROAS" + confusion signals
  '"ROAS" tracking OR "doesn\'t match" OR wrong OR "can\'t see" OR "which ads"',
  // Direct intent phrases
  '"which ads are actually working"',
  '"ad attribution shopify"',
  '"track facebook ads shopify"',
  '"shopify ad tracking"',
];

export interface RedditPost {
  id: string;
  title: string;
  body: string;
  subreddit: string;
  author: string;
  url: string;
  permalink: string;
  createdUtc: number;
  score: number;
  isComment: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search a single subreddit with a single query string.
 * Returns deduplicated posts within the last 24h window.
 */
async function searchSubreddit(
  subreddit: string,
  query: string
): Promise<RedditPost[]> {
  const url = new URL(`https://www.reddit.com/r/${subreddit}/search.json`);
  url.searchParams.set('q', query);
  url.searchParams.set('restrict_sr', '1');
  url.searchParams.set('sort', 'new');
  url.searchParams.set('t', 'day');
  url.searchParams.set('limit', '25');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (res.status === 429) {
      console.warn(`[lead-scanner] Rate-limited on r/${subreddit}, skipping query`);
      return [];
    }

    if (!res.ok) {
      console.warn(
        `[lead-scanner] Reddit returned ${res.status} for r/${subreddit}: ${query}`
      );
      return [];
    }

    const json = await res.json();
    const children = json?.data?.children ?? [];

    return children.map((child: any) => {
      const d = child.data;
      return {
        id: d.id,
        title: d.title || '',
        body: d.selftext || '',
        subreddit: d.subreddit,
        author: d.author,
        url: `https://reddit.com${d.permalink}`,
        permalink: d.permalink,
        createdUtc: d.created_utc,
        score: d.score,
        isComment: child.kind === 't1',
      };
    });
  } catch (err) {
    console.error(`[lead-scanner] Error searching r/${subreddit}:`, err);
    return [];
  }
}

/**
 * Run all search queries across all subreddits.
 * Deduplicates by Reddit post ID.
 * Rate-limits to 1 request per 2 seconds.
 */
export async function scanReddit(): Promise<RedditPost[]> {
  const seen = new Map<string, RedditPost>();
  let requestCount = 0;

  for (const subreddit of SUBREDDITS) {
    for (const query of SEARCH_QUERIES) {
      // Rate limit: wait between requests
      if (requestCount > 0) {
        await sleep(RATE_LIMIT_MS);
      }
      requestCount++;

      const posts = await searchSubreddit(subreddit, query);
      for (const post of posts) {
        if (!seen.has(post.id)) {
          seen.set(post.id, post);
        }
      }
    }
  }

  console.log(
    `[lead-scanner] Scanned ${requestCount} queries, found ${seen.size} unique posts`
  );
  return Array.from(seen.values());
}
