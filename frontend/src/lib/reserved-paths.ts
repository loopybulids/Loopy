/**
 * Top-level paths that belong to the app, not to a store handle.
 *
 * `www.loopynow.shop/cpaybara` is a seller's console, which means a handle at
 * the root of the site competes with every real page. Anything the app owns —
 * now or later — is claimed here and can never be taken by a seller.
 *
 * Next matches static segments before dynamic ones, so /admin would win
 * regardless; the point of the list is to stop a seller *registering* a handle
 * that would then be unreachable, and to let other code tell "a page of ours"
 * apart from "somebody's handle" without a database round trip.
 *
 * Plain module, no 'use client': this is imported by middleware (edge runtime)
 * and by browser code. It is mirrored by RESERVED_HANDLES in
 * backend/src/sellers/sellers.service.ts — keep the two in step.
 */
export const RESERVED_PATHS = new Set([
  's', 'admin', 'seller', 'sellers', 'api', 'login', 'signup', 'logout',
  'legal', 'privacy', 'terms', 'refunds', 'shipping', 'sellers-terms',
  'cart', 'checkout', 'orders', 'order', 'product', 'products', 'store', 'stores',
  'about', 'help', 'support', 'contact', 'pricing', 'blog', 'docs', 'status', 'app',
  'www', 'assets', 'static', 'cdn', 'icon', 'favicon', 'robots', 'sitemap', 'sw',
]);

/** A plausible store handle: what updateProfile() slugifies a name down to. */
export const HANDLE = /^[a-z0-9][a-z0-9-]{1,38}$/;
