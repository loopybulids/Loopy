import { NextRequest, NextResponse } from 'next/server';

/**
 * Per-seller subdomain routing: capybara.loopy.shop → /s/capybara
 *
 * Activates only when NEXT_PUBLIC_ROOT_DOMAIN is set (e.g. "loopy.shop") AND
 * you've pointed a wildcard domain (*.loopy.shop) at this Vercel project
 * (requires Vercel Pro). On localhost / *.vercel.app it does nothing, so
 * path-based storefronts (/s/username) keep working everywhere.
 */
export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\.).*)'],
};

export function middleware(req: NextRequest) {
  const roots = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!roots.length) return NextResponse.next();

  const hostname = (req.headers.get('host') || '').split(':')[0];
  const root = roots.find((d) => hostname === d || hostname.endsWith('.' + d));
  if (!root || hostname === root || hostname === `www.${root}`) return NextResponse.next();

  const sub = hostname.slice(0, hostname.length - root.length - 1);
  if (!sub || sub === 'www') return NextResponse.next();

  const url = req.nextUrl.clone();
  if (!url.pathname.startsWith('/s/')) {
    url.pathname = `/s/${sub}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
