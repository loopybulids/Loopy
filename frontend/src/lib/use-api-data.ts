'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Read an API endpoint and paint the last known answer immediately.
 *
 * Every console page is a client component that fetches on mount, so the
 * in-memory cache in `api.ts` only helps if you come back within its TTL and
 * never reload. Leave a page for longer, or refresh, and the cards go back to
 * skeletons and wait on Neon — which is what "the content takes time to load
 * when I come back" actually is.
 *
 * This keeps the previous payload in localStorage and hands it back
 * synchronously on mount, so the page paints filled in on the first frame,
 * then quietly refreshes and re-renders when the real answer lands.
 *
 * Cached values are scoped to the current session token, so switching store
 * or account can never show one seller another's figures.
 */

const NS = 'loopy_swr';
/** Beyond this, a remembered payload is too old to show even briefly. */
const MAX_AGE = 24 * 60 * 60 * 1000;

function scope(): string {
  try {
    // Namespaced by session, not by user id: the token is what changes when
    // you switch store or sign in as someone else.
    const t = localStorage.getItem('loopy_token');
    return t ? t.slice(-16) : 'anon';
  } catch {
    return 'anon';
  }
}

const keyFor = (key: string) => `${NS}:${scope()}:${key}`;

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(keyFor(key));
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (!at || Date.now() - at > MAX_AGE) return null;
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Drop payloads belonging to other sessions.
 *
 * The cache is namespaced by token, and every sign-in mints a new one — so
 * each session's payloads are orphaned rather than overwritten by the next.
 * They accumulate until localStorage is full, at which point writes start
 * failing silently and pages stop painting from cache: "the data disappears
 * after a few refreshes". Nothing ever collected them, because the only
 * cleanup ran on an explicit sign-out.
 */
function pruneOtherSessions() {
  if (typeof window === 'undefined') return;
  const mine = `${NS}:${scope()}:`;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${NS}:`) && !k.startsWith(mine)) localStorage.removeItem(k);
    }
  } catch { /* nothing we can do */ }
}

function write(key: string, data: unknown) {
  const payload = JSON.stringify({ at: Date.now(), data });
  try {
    localStorage.setItem(keyFor(key), payload);
  } catch {
    // Almost always the quota. Clear out the dead sessions and try once more;
    // if it still won't fit, the page works, it just won't paint instantly
    // next time.
    pruneOtherSessions();
    try {
      localStorage.setItem(keyFor(key), payload);
    } catch { /* storage blocked, or this payload alone is too big */ }
  }
}

/** Drop every remembered payload. Call on sign-out and store switch. */
export function clearApiDataCache() {
  if (typeof window === 'undefined') return;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${NS}:`)) localStorage.removeItem(k);
    }
  } catch { /* nothing we can do */ }
}

export interface ApiData<T> {
  data: T | null;
  /** True only when there is nothing at all to show yet. */
  loading: boolean;
  /** True while a background refresh is in flight over existing data. */
  refreshing: boolean;
  error: string;
  reload: () => Promise<void>;
}

/** Once per page load, before anything caches against the current session. */
let pruned = false;

export function useApiData<T>(key: string, fetcher: () => Promise<T>): ApiData<T> {
  if (!pruned) { pruned = true; pruneOtherSessions(); }

  const cached = useRef<T | null>(null);
  if (cached.current === null) cached.current = read<T>(key);

  const [data, setData] = useState<T | null>(cached.current);
  const [loading, setLoading] = useState(cached.current === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Held in a ref so a caller passing an inline arrow doesn't restart the
  // effect on every render.
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  /**
   * Which fetch is allowed to publish its result.
   *
   * This was a single `alive` ref flipped to false on unmount — which broke
   * outright under React Strict Mode. In development React mounts, unmounts,
   * then remounts every component; the unmount set the flag false and nothing
   * ever set it back, so every setState afterwards was skipped and the page
   * sat on its skeletons forever. Production has no Strict Mode, so it worked
   * there and only there.
   *
   * A token per run fixes both problems at once: a stale response from a
   * superseded fetch is ignored, and a remount simply starts a new run.
   */
  const runId = useRef(0);
  useEffect(() => () => { runId.current += 1; }, []);

  const run = useCallback(async () => {
    const mine = (runId.current += 1);
    const current = () => runId.current === mine;

    setRefreshing(true);
    try {
      const fresh = await fetchRef.current();
      if (!current()) return;
      setData(fresh);
      setError('');
      write(key, fresh);
    } catch (e: any) {
      if (!current()) return;
      // Keep showing what we have; only surface the error if there's nothing.
      setError(e?.message || 'Could not load.');
    } finally {
      if (current()) { setLoading(false); setRefreshing(false); }
    }
  }, [key]);

  useEffect(() => { run(); }, [run]);

  return { data, loading, refreshing, error, reload: run };
}
