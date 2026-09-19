'use client';
import { createContext, useContext } from 'react';

/**
 * The seller console answers on two prefixes.
 *
 *   /cpaybara/orders   what a seller sees, and what middleware rewrites
 *   /seller/orders     the route Next actually renders
 *
 * Only the first is worth showing anyone: a seller opening their back office
 * should see their own shop's name, not the word "seller". But the app is
 * built on the second — every file under app/seller, every redirect, every
 * `pathname ===` comparison — and rewriting all of that to a dynamic segment
 * would be a lot of churn to achieve nothing the address bar can't.
 *
 * So the two are translated here, in one place.
 *
 * The prefix comes from a context that SellerLayout fills from the *session*,
 * not from usePathname(). That is deliberate. Next does not promise whether
 * usePathname() reports the URL the browser shows or the route a middleware
 * rewrite chose, and building links out of a value that could be either is how
 * you get a page whose links silently drop the handle — or, worse, an effect
 * that rewrites the URL in a loop. The signed-in seller's handle is the one
 * fact both agree on.
 */

const CANONICAL = '/seller';

const ConsoleBaseContext = createContext<string>(CANONICAL);
export const ConsoleBaseProvider = ConsoleBaseContext.Provider;

/** The prefix a console URL is written with: `/seller` or `/cpaybara`. */
export function consoleBase(pathname: string): string {
  const first = pathname.split('/')[1] || '';
  return first ? `/${first}` : CANONICAL;
}

/** `/cpaybara/orders` → `/seller/orders`, the route that actually renders. */
export function canonicalPath(pathname: string): string {
  const base = consoleBase(pathname);
  return base === CANONICAL ? pathname : `${CANONICAL}${pathname.slice(base.length)}`;
}

/** `/seller/orders` → `/cpaybara/orders`, for links and redirects. */
export function consoleHref(base: string, path: string): string {
  if (base === CANONICAL || !path.startsWith(CANONICAL)) return path;
  return `${base}${path.slice(CANONICAL.length)}` || base;
}

/**
 * Turns a canonical `/seller/…` path into a link for the prefix in use.
 *
 * Next puts whatever a link says into the address bar, so one `/seller/orders`
 * left hardcoded inside the console drops the handle out of the URL for the
 * rest of the session.
 */
export function useConsoleHref(): (path: string) => string {
  const base = useContext(ConsoleBaseContext);
  return (path: string) => consoleHref(base, path);
}
