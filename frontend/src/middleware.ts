import { NextRequest, NextResponse } from 'next/server';
import { HANDLE, RESERVED_PATHS } from '@/lib/reserved-paths';

/**
 * Who owns which URL.
 *
 * Loopy serves two audiences from one deployment, and they are split by host
 * rather than by path prefix:
 *
 *   cpaybara.loopynow.shop        the shop      → /s/cpaybara/…
 *   www.loopynow.shop/cpaybara    its console   → /seller/…
 *
 * Both rewrite onto routes that already exist, so the app renders one
 * storefront tree and one console tree and neither knows how it was reached.
 *
 * The split is deliberate. A seller's shop is the thing they hand to
 * customers, so it gets the short, memorable address; their own back office
 * is a private tool and lives inside ours. Putting both under the same host
 * would mean one path serving two different pages depending on who is looking,
 * which is not something a URL should ever do.
 *
 * Without a wildcard domain — localhost, preview deploys — shops are reached
 * at their real route, /s/cpaybara. The console still answers on /cpaybara
 * everywhere, so what a seller sees locally matches production.
 *
 * What keeps this safe is RESERVED_PATHS — see lib/reserved-paths.
 */

export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\.).*)'],
};

/**
 * www.loopynow.shop/cpaybara/orders → /seller/orders
 *
 * The handle is decorative here — the console shows whatever the session says,
 * never what the URL claims. It is in the address so a seller sees their own
 * shop's name while they work, instead of the word "seller". SellerLayout
 * corrects the handle if it does not match who is signed in.
 */
function rewriteConsolePath(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const first = (segments[0] || '').toLowerCase();
  if (!first || RESERVED_PATHS.has(first) || !HANDLE.test(first)) return null;

  const rest = segments.slice(1);
  const url = req.nextUrl.clone();
  url.pathname = `/seller${rest.length ? `/${rest.join('/')}` : ''}`;
  return NextResponse.rewrite(url);
}

export function middleware(req: NextRequest) {
  const roots = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!roots.length) return rewriteConsolePath(req) || NextResponse.next();

  const hostname = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const root = roots.find((d) => hostname === d || hostname.endsWith('.' + d));
  // The apex and www are the site itself, so a handle there is a console path.
  if (!root || hostname === root || hostname === `www.${root}`) {
    return rewriteConsolePath(req) || NextResponse.next();
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
