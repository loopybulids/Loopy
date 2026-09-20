'use client';

/**
 * Where a seller's storefront lives.
 *
 * Two addressing schemes are supported and both must keep working:
 *
 *   subdomain  cpaybara.loopynow.shop/orders   ← when a wildcard domain is set
 *   route      loopynow.shop/s/cpaybara/orders ← localhost and preview deploys
 *
 * The root path is NOT one of them: loopynow.shop/cpaybara is the seller's
 * console, not their shop. See middleware.ts for why the two audiences are
 * split by host rather than by path.
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

/**
 * True when the browser is on some store's subdomain rather than the main
 * site. Browser-only — there is no host to read during a server render.
 */
export function onAnyStoreSubdomain(): boolean {
  const root = rootDomain();
  if (!root || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === root || host === `www.${root}`) return false;
  return host.endsWith(`.${root}`);
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
   * No wildcard domain configured — localhost or a preview deploy. Fall back
   * to the real route against whatever origin we are served from. This form
   * is for development; what a seller shares is the subdomain above.
   */
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/s/${username}${suffix}`;
}

/**
 * Where the Store Editor's "Preview" opens.
 *
 * Deliberately the internal route on the *current* origin, not the store's
 * subdomain. An unpublished draft lives in localStorage, which is per-origin:
 * opening cpaybara.loopynow.shop from an editor running on www.loopynow.shop
 * reaches a different storage area, finds no draft, and shows the seller the
 * published shop while telling them it is a preview of their edits.
 */
export function storePreviewUrl(username: string, path?: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const suffix = clean(path);
  return `${origin}/s/${username}${suffix}?preview=1`;
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
 * next to `cpaybara.loopynow.shop`. Everywhere else it returns the real route.
 */
export function storeHref(username: string, path?: string): string {
  const suffix = clean(path);
  if (onStoreSubdomain(username)) return suffix || '/';
  return `/s/${username}${suffix}`;
}
