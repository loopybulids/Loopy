'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const sessKey = (u: string) => `loopy_cust_${u}`;
const cartKey = (u: string) => `loopy_cart_${u}`;

export type Cust = { token: string; customer: { id: string; name?: string; email?: string } };

export function getCust(u: string): Cust | null {
  if (typeof window === 'undefined') return null;
  try { const s = localStorage.getItem(sessKey(u)); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function setCust(u: string, c: Cust) { localStorage.setItem(sessKey(u), JSON.stringify(c)); window.dispatchEvent(new Event('cust-change')); }
export function clearCust(u: string) { localStorage.removeItem(sessKey(u)); window.dispatchEvent(new Event('cust-change')); }

async function custReq(u: string, path: string, init?: RequestInit) {
  const c = getCust(u);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(c ? { Authorization: `Bearer ${c.token}` } : {}), ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.message || `Request failed (${res.status})`); }
  return res.json();
}

export const custApi = {
  authSupabase: async (u: string, token: string) => {
    const r = await fetch(`${BASE}/stores/${u}/customer-auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({} as any)))?.message || 'Sign-in failed');
    return r.json();
  },
  me: (u: string) => custReq(u, '/customer/me'),
  wishlist: (u: string) => custReq(u, '/customer/wishlist'),
  wishlistIds: (u: string) => custReq(u, '/customer/wishlist/ids'),
  addWishlist: (u: string, pid: string) => custReq(u, `/customer/wishlist/${pid}`, { method: 'POST' }),
  removeWishlist: (u: string, pid: string) => custReq(u, `/customer/wishlist/${pid}`, { method: 'DELETE' }),
  addresses: (u: string) => custReq(u, '/customer/addresses'),
  addAddress: (u: string, body: any) => custReq(u, '/customer/addresses', { method: 'POST', body: JSON.stringify(body) }),
  checkout: (u: string, body: any) => custReq(u, '/customer/checkout', { method: 'POST', body: JSON.stringify(body) }),
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
