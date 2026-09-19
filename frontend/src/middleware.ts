import { NextRequest, NextResponse } from 'next/server';

/**
 * Where a storefront lives in the URL.
 *
 * Two rewrites, both landing on the same `/s/<handle>/…` routes so the app
 * only ever renders one storefront tree:
 *
 *   1. Subdomain — cpaybara.loopynow.shop/orders. The nicest form, but it
 *      needs a wildcard domain (*.loopynow.shop) pointed at this project,
 *      which is a paid Vercel feature. Off unless NEXT_PUBLIC_ROOT_DOMAIN is
 *      set.
 *   2. Root path — loopynow.shop/cpaybara/orders. Works everywhere, including
 *      localhost and preview deploys, with no DNS at all.
 *
 * The second is why RESERVED_PATHS exists: at the root of the site a handle
 * competes with every real page, so anything the app owns — now or later — is
 * claimed here and can never be rewritten to a store. Next matches static
 * segments before dynamic ones, so /admin would win regardless; the list also
 * stops a seller taking a handle that is unreachable as a result.
 */

/** Top-level paths that belong to the app, not to a store. */
const RESERVED_PATHS = new Set([
  's', 'admin', 'seller', 'sellers', 'api', 'login', 'signup', 'logout',
  'legal', 'privacy', 'terms', 'refunds', 'shipping', 'sellers-terms',
  'cart', 'checkout', 'orders', 'order', 'product', 'products', 'store', 'stores',
  'about', 'help', 'support', 'contact', 'pricing', 'blog', 'docs', 'status', 'app',
  'www', 'assets', 'static', 'cdn', 'icon', 'favicon', 'robots', 'sitemap', 'sw',
]);

/** A plausible store handle: what updateProfile() slugifies a name down to. */
const HANDLE = /^[a-z0-9][a-z0-9-]{1,38}$/;
export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\.).*)'],
};

/** loopynow.shop/cpaybara/orders → /s/cpaybara/orders */
function rewriteRootPath(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const first = (segments[0] || '').toLowerCase();
  if (!first || RESERVED_PATHS.has(first) || !HANDLE.test(first)) return null;

  const url = req.nextUrl.clone();
  url.pathname = `/s/${segments.join('/')}`;
  return NextResponse.rewrite(url);
}

export function middleware(req: NextRequest) {
  const roots = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!roots.length) return rewriteRootPath(req) || NextResponse.next();

  const hostname = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const root = roots.find((d) => hostname === d || hostname.endsWith('.' + d));
  // The apex and www are the site itself — a handle there is a root path.
  if (!root || hostname === root || hostname === `www.${root}`) {
    return rewriteRootPath(req) || NextResponse.next();
  }

  const sub = hostname.slice(0, hostname.length - root.length - 1);
  // `www` is the site itself; the rest are reserved so a seller can never take
  // a handle that would shadow our own hosts.
  if (!sub || sub.includes('.') || RESERVED_PATHS.has(sub)) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (!url.pathname.startsWith('/s/')) {
    url.pathname = `/s/${sub}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
