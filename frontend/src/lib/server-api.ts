/**
 * Server-side data fetching (runs on the Next server, not the browser).
 *
 * This makes the storefront and product pages render fully on first paint — no
 * client "Loading…" flash, and it matches the PRD's SSR-for-SEO goal.
 *
 * Every one of these reads went to the API, and through it to Neon, on every
 * single request — including two people opening the same shop a second apart,
 * and including the second page a shopper clicks. Each store page is now
 * remembered for a few seconds, which is far shorter than anyone's attention
 * and long enough to collapse a burst of traffic into one query.
 *
 * Deliberately a plain in-process map rather than Next's fetch cache: these
 * routes read searchParams (`?preview=1`) and are therefore dynamic, and a
 * dynamic route's fetches are not cached. A memo here works regardless of how
 * Next decides to render the page.
 *
 * `fresh` skips it. A seller previewing an unpublished draft must see the
 * draft, not what the last visitor saw.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/** Short enough that a price change is never visibly stale. */
const TTL_MS = 15_000;
/** A lid, so a long-lived instance serving many stores cannot grow forever. */
const MAX_ENTRIES = 200;

const memo = new Map<string, { at: number; data: unknown }>();

async function read<T>(path: string, fresh = false): Promise<T | null> {
  const now = Date.now();

  if (!fresh) {
    const hit = memo.get(path);
    if (hit && now - hit.at < TTL_MS) return hit.data as T;
  }

  try {
    const r = await fetch(`${BASE}${path}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const data = (await r.json()) as T;

    // Oldest out first. Insertion order is Map's iteration order, and re-
    // setting a key moves it to the end, so the first key is the least
    // recently fetched.
    if (memo.size >= MAX_ENTRIES) {
      const oldest = memo.keys().next().value;
      if (oldest !== undefined) memo.delete(oldest);
    }
    memo.delete(path);
    memo.set(path, { at: now, data });
    return data;
  } catch {
    return null;
  }
}

export function getStoreSSR(username: string, fresh = false) {
  return read<any>(`/sellers/${username}`, fresh);
}

export function getDiscoverSSR() {
  return read<any>('/sellers');
}

export function getProductSSR(id: string) {
  return read<any>(`/products/${id}`);
}
