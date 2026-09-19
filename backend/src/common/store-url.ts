/**
 * A storefront's public address, for links that leave the server — order
 * receipts, review invitations, anything a shopper receives.
 *
 * Mirrors frontend/src/lib/store-url.ts:
 *
 *   https://cpaybara.loopynow.shop/orders        when PUBLIC_ROOT_DOMAIN is set
 *   http://localhost:3000/s/cpaybara/orders      in development
 *
 * The second form is the route the app really renders; the first is a wildcard
 * subdomain the frontend's middleware rewrites onto it. Emails should carry
 * the subdomain, because a buyer reads that link — and because the root path,
 * loopynow.shop/cpaybara, is the seller's own console rather than their shop.
 */
export function storeUrl(username: string | null | undefined, path = ''): string | null {
  if (!username) return null;
  const suffix = path && !path.startsWith('/') ? `/${path}` : path;

  const root = (process.env.PUBLIC_ROOT_DOMAIN || '').split(',')[0].trim();
  if (root) return `https://${username}.${root}${suffix}`;

  const base = (process.env.PUBLIC_WEB_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/s/${username}${suffix}`;
}
