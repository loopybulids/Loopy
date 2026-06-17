// Server-side data fetching (runs on the Next server, not the browser).
// This makes the storefront + product pages render fully on first paint —
// no client "Loading…" flash, and it matches the PRD's SSR-for-SEO goal.
const BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function getStoreSSR(username: string) {
  try {
    const r = await fetch(`${BASE}/sellers/${username}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function getDiscoverSSR() {
  try {
    const r = await fetch(`${BASE}/sellers`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function getProductSSR(id: string) {
  try {
    const r = await fetch(`${BASE}/products/${id}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}
