'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const sessKey = (u: string) => `loopy_cust_${u}`;
const cartKey = (u: string) => `loopy_cart_${u}`;

export type Cust = { token: string; customer: { id: string; name?: string; email?: string } };

export function getCust(u: string): Cust | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(sessKey(u));
    if (!s) return null;
    const r = JSON.parse(s);
    // Sessions saved before the accessToken/token fix are still in browsers —
    // read either shape so nobody has to sign out to recover.
    const token = r?.token ?? r?.accessToken;
    return token ? { token, customer: r?.customer } : null;
  } catch { return null; }
}
/**
 * Accepts the raw auth response. The API returns the JWT as `accessToken`
 * while everything here reads `token`, so normalise once at the boundary —
 * otherwise every authenticated call quietly sends `Bearer undefined` and the
 * backend answers 401.
 */
export function setCust(u: string, r: any) {
  const c: Cust = { token: r?.accessToken ?? r?.token, customer: r?.customer };
  localStorage.setItem(sessKey(u), JSON.stringify(c));
  window.dispatchEvent(new Event('cust-change'));
}
export function clearCust(u: string) { localStorage.removeItem(sessKey(u)); window.dispatchEvent(new Event('cust-change')); }

async function custReq(u: string, path: string, init?: RequestInit) {
  const c = getCust(u);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(c ? { Authorization: `Bearer ${c.token}` } : {}), ...(init?.headers || {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    const b = await res.json().catch(() => ({}));

    /**
     * A rejected token is a dead session, and the shopper cannot fix it.
     *
     * Sessions last 7 days. Once one lapses the page still showed the buyer
     * as signed in and answered "Unauthorized" on the pay button — a dead end
     * at the worst possible moment. Clearing it here makes the sign-in panel
     * reappear (the pages listen for `cust-change`), so the shopper signs back
     * in and keeps their cart instead of being stuck.
     */
    if (res.status === 401 && c) {
      clearCust(u);
      throw new Error('Your session expired — please sign in again to place your order.');
    }

    throw new Error(b?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

// Unauthenticated POST to a store's customer-auth endpoints.
async function authReq(u: string, action: string, body: any) {
  const r = await fetch(`${BASE}/stores/${u}/customer-auth/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({} as any)))?.message || 'Sign-in failed');
  return r.json();
}

export const custApi = {
  /** Exchange a Google ID token for a per-store customer session. */
  authGoogle: (u: string, token: string) => authReq(u, 'google', { token }),
  /** Step 1 of signup — emails a 6-digit code. Returns { pending, sent, devCode? }. */
  register: (u: string, body: { name?: string; email: string; password: string }) => authReq(u, 'register', body),
  /** Step 2 of signup — exchanges the code for a session. */
  verifySignup: (u: string, email: string, code: string) => authReq(u, 'verify', { email, code }),
  login: (u: string, email: string, password: string) => authReq(u, 'login', { email, password }),
  me: (u: string) => custReq(u, '/customer/me'),
  updateMe: (u: string, body: { name?: string; phone?: string }) =>
    custReq(u, '/customer/me', { method: 'PUT', body: JSON.stringify(body) }),
  wishlist: (u: string) => custReq(u, '/customer/wishlist'),
  wishlistIds: (u: string) => custReq(u, '/customer/wishlist/ids'),
  // The header badge listens for 'wishlist-change' to refresh its count.
  addWishlist: (u: string, pid: string) =>
    custReq(u, `/customer/wishlist/${pid}`, { method: 'POST' }).then((r) => { window.dispatchEvent(new Event('wishlist-change')); return r; }),
  removeWishlist: (u: string, pid: string) =>
    custReq(u, `/customer/wishlist/${pid}`, { method: 'DELETE' }).then((r) => { window.dispatchEvent(new Event('wishlist-change')); return r; }),
  addresses: (u: string) => custReq(u, '/customer/addresses'),
  addAddress: (u: string, body: any) => custReq(u, '/customer/addresses', { method: 'POST', body: JSON.stringify(body) }),
  checkout: (u: string, body: any) => custReq(u, '/customer/checkout', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * Rate a delivered order — 1-5 stars plus an optional comment.
   *
   * The server allows this only on a delivered order the caller bought, and
   * only once, so the form is offered on exactly those orders.
   */
  addReview: (u: string, orderId: string, rating: number, comment?: string) =>
    custReq(u, `/orders/${orderId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),

  /**
   * Price a coupon against the current cart.
   *
   * The figure returned is what the server will charge — checkout recomputes
   * the discount from the coupon row and ignores anything the client sends,
   * so this is a quote the buyer can trust rather than a hint.
   */
  previewCoupon: (u: string, code: string, itemsSubtotal: number) =>
    custReq(u, `/stores/${u}/coupon/preview`, {
      method: 'POST',
      body: JSON.stringify({ code, itemsSubtotal }),
    }),
  orders: (u: string) => custReq(u, '/customer/orders'),
  cancelOrder: (u: string, id: string, reason?: string) =>
    custReq(u, `/customer/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

/* ── cart (client-side, per store) ── */
export type CartItem = { productId: string; title: string; price: number; image?: string; size?: string; qty: number };

export function getCart(u: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(cartKey(u)) || '[]'); } catch { return []; }
}
export function setCart(u: string, items: CartItem[]) { localStorage.setItem(cartKey(u), JSON.stringify(items)); window.dispatchEvent(new Event('cart-change')); }
export function cartCount(u: string) { return getCart(u).reduce((s, i) => s + i.qty, 0); }
export function addToCart(u: string, item: CartItem) {
  const cart = getCart(u);
  const found = cart.find((c) => c.productId === item.productId && c.size === item.size);
  if (found) found.qty += item.qty; else cart.push(item);
  setCart(u, cart);
}
export function updateQty(u: string, productId: string, size: string | undefined, qty: number) {
  let cart = getCart(u);
  cart = cart.map((c) => (c.productId === productId && c.size === size ? { ...c, qty } : c)).filter((c) => c.qty > 0);
  setCart(u, cart);
}
export function clearCart(u: string) { setCart(u, []); }

/**
 * Apply the items encoded in a seller's checkout link.
 *
 * Sets quantities rather than adding to them, so opening the same link twice
 * doesn't silently double the order. Items already in the cart that aren't part
 * of the link are left alone.
 */
export function applyLinkItems(u: string, items: CartItem[]) {
  const cart = getCart(u).filter((c) => !items.some((i) => i.productId === c.productId && i.size === c.size));
  setCart(u, [...cart, ...items]);
}

/** Parse `?add=<productId>:<qty>,<productId>:<qty>` from a checkout link. */
export function parseLinkItems(param: string): { productId: string; qty: number }[] {
  return param
    .split(',')
    .map((chunk) => {
      const [productId, q] = chunk.split(':');
      if (!productId) return null;
      return { productId, qty: Math.min(99, Math.max(1, Number(q) || 1)) };
    })
    .filter(Boolean) as { productId: string; qty: number }[];
}
