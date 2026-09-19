'use client';

/**
 * Where a seller's storefront lives.
 *
 * Two addressing schemes are supported and both must keep working:
 *
 *   subdomain  cpaybara.loopynow.shop/orders   ← when a wildcard domain is set
 *   root path  loopynow.shop/cpaybara/orders    ← everywhere else
 *
 * `middleware.ts` rewrites the first into the second, so the app only ever
 * renders `/s/<username>/…` routes. This module is the other half: it decides
 * which form to *print* — because a link a seller copies into an Instagram bio
 * should read as their own shop, not as a path inside ours.
 *
 * The logic used to be copy-pasted into a couple of settings pages and absent
 * everywhere else, which is why "Preview" still opened `/s/cpaybara?preview=1`.
 */

/** The apex domain wildcard subdomains hang off, when one is configured. */
export function rootDomain(): string | null {
  // Several may be listed; the first is the canonical one for building links.
  const raw = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
  const first = raw.split(',')[0].trim();
  return first || null;
}

/** True when the browser is already on this store's own subdomain. */
export function onStoreSubdomain(username?: string): boolean {
  const root = rootDomain();
  if (!root || typeof window === 'undefined' || !username) return false;
  const host = window.location.hostname;
  return host === `${username}.${root}`;
}

const clean = (path?: string) => {
  const p = (path || '').trim();
  if (!p || p === '/') return '';
  return p.startsWith('/') ? p : `/${p}`;
};

/**
 * An absolute, shareable URL for a storefront.
 *
 * Use for anything that leaves the app or opens a new tab: copy-link buttons,
 * "View storefront", checkout links, QR codes, emails.
 */
export function storeUrl(username: string, path?: string): string {
  const root = rootDomain();
  const suffix = clean(path);
  if (root) return `https://${username}.${root}${suffix}`;

  /*
   * No wildcard domain configured (localhost, preview deploys, or the Hobby
   * plan) — use the root path against whatever origin we are served from.
   * `/s/` stays as the internal route the middleware rewrites to; it is not
   * something a seller should ever have to paste into their bio.
   */
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/${username}${suffix}`;
}

/** The same thing without a scheme, for display: `cpaybara.loopynow.shop`. */
export function storeUrlLabel(username: string, path?: string): string {
  return storeUrl(username, path).replace(/^https?:\/\//, '');
}

/**
 * A URL for in-app navigation to a storefront route.
 *
 * On a store's own subdomain this returns a bare path (`/orders`), so links
 * stay on that host and the address bar doesn't show `/s/cpaybara/orders`
 * next to `cpaybara.loopynow.shop`. Everywhere else it returns the root-path
 * form, which the middleware rewrites to the real route.
 */
export function storeHref(username: string, path?: string): string {
  const suffix = clean(path);
  if (onStoreSubdomain(username)) return suffix || '/';
  return `/${username}${suffix}`;
}
