const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('loopy_token');
}

function authHeader(): Record<string, string> {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    // Session expired / invalid token on an authenticated request → send to login.
    if (res.status === 401 && typeof window !== 'undefined' && localStorage.getItem('loopy_token')) {
      const role = localStorage.getItem('loopy_role');
      localStorage.removeItem('loopy_token');
      clearApiCache();
      const dest = role === 'admin' ? '/admin/login' : '/seller/login';
      if (!location.pathname.includes('/login')) location.href = dest;
      throw new Error('Your session expired — please sign in again.');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch a file with the session attached, as a Blob. A plain download link
 * cannot carry the token — it lives in localStorage, not a cookie.
 */
async function download(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeader(), cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Download failed (${res.status})`);
  }
  return res.blob();
}

/* ───────────────────────── read cache ─────────────────────────
 * Every console page is a client component that fetches on mount, so bouncing
 * Dashboard → Orders → Dashboard used to mean three full round trips and three
 * "Loading…" flashes. GETs are now cached for a few seconds and de-duplicated
 * while in flight, so re-entering a page you just left paints instantly. Any
 * write (POST/PUT/DELETE) drops the cache so the next read is fresh.
 */
const TTL = 15_000;
const cache = new Map<string, { at: number; data: any }>();
const inflight = new Map<string, Promise<any>>();

export function clearApiCache() {
  cache.clear();
  inflight.clear();
}

// Hand out a copy — callers keep the result in component state and some of them
// edit it in place (store editor, variant editor), which would poison the cache.
function clone<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
}

/** `noInvalidate` — for fire-and-forget writes (visit pings) that change nothing we read. */
async function req<T>(path: string, init?: RequestInit & { noInvalidate?: boolean }): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    const { noInvalidate, ...rest } = init || {};
    const out = await send<T>(path, rest);
    if (!noInvalidate) clearApiCache();
    return out;
  }

  const key = `${path}|${token() || ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return clone(hit.data);

  const pending = inflight.get(key);
  if (pending) return pending.then(clone);

  const p = send<T>(path, init).then(
    (data) => {
      cache.set(key, { at: Date.now(), data });
      inflight.delete(key);
      return data;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    },
  );
  inflight.set(key, p);
  return p.then(clone);
}

export const api = {
  /** Drop cached reads — call before a manual refresh to force a round trip. */
  invalidate: clearApiCache,

  // storefront / products
  getStore: (username: string) => req<any>(`/sellers/${username}`),
  /** Name, logo and accent only — for storefront sub-pages that don't need the catalogue. */
  getStoreBrand: (username: string) => req<any>(`/sellers/${username}/brand`),
  getProduct: (id: string) => req<any>(`/products/${id}`),

  // orders
  checkout: (body: any) =>
    req<any>(`/orders/checkout`, { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (id: string) => req<any>(`/orders/${id}/confirm`, { method: 'POST' }),
  getOrder: (id: string) => req<any>(`/orders/${id}`),

  // auth
  login: (phone: string) =>
    req<any>(`/auth/login`, { method: 'POST', body: JSON.stringify({ phone }) }),
  verify: (phone: string, code: string, name?: string) =>
    req<any>(`/auth/verify`, { method: 'POST', body: JSON.stringify({ phone, code, ...(name ? { name } : {}) }) }),

  // email/password seller auth
  registerSeller: (body: { name: string; email: string; password: string; storeName: string }) =>
    req<any>(`/auth/register`, { method: 'POST', body: JSON.stringify(body) }),
  loginEmail: (email: string, password: string) =>
    req<any>(`/auth/login-email`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginWithGoogle: (token: string) =>
    req<any>(`/auth/google`, { method: 'POST', body: JSON.stringify({ token }) }),

  // order actions
  deliverOrder: (id: string) => req<any>(`/orders/${id}/deliver`, { method: 'POST' }),
  reviewOrder: (id: string, rating: number, comment: string) =>
    req<any>(`/orders/${id}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  disputeOrder: (id: string, issueType: string, description: string) =>
    req<any>(`/orders/${id}/dispute`, { method: 'POST', body: JSON.stringify({ issueType, description }) }),

  changePassword: (password: string) =>
    req<any>(`/auth/change-password`, { method: 'POST', body: JSON.stringify({ password }) }),

  // seller (auth required)
  myProfile: () => req<any>(`/sellers/me/profile`),
  updateStoreConfig: (config: any) =>
    req<any>(`/sellers/me/store-config`, { method: 'PUT', body: JSON.stringify({ config }) }),
  myOrders: () => req<any[]>(`/sellers/me/orders`),
  /** Your own data as a CSV file (`range` from lib/admin-range), as a Blob. */
  myExport: (dataset: string, range: string) => download(`/sellers/me/export/${dataset}?${range}`),
  myProducts: () => req<any[]>(`/sellers/me/products`),
  myWallet: () => req<any>(`/sellers/me/wallet`),

  /** Orders + wallet + analytics + onboarding in a single request. */
  myDashboard: () => req<any>(`/sellers/me/dashboard`),

  /** Just handle/logo/published — for the console shell, not a full profile. */
  mySummary: () => req<any>(`/sellers/me/summary`),
  myAnalytics: () => req<any>(`/sellers/me/analytics`),
  myOnboarding: () => req<any>(`/sellers/me/onboarding`),
  myReviews: () => req<any[]>(`/sellers/me/reviews`),
  respondReview: (id: string, response: string) =>
    req<any>(`/sellers/me/reviews/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) }),
  myNotifications: () => req<any>(`/sellers/me/notifications`),
  readNotifications: () => req<any>(`/sellers/me/notifications/read`, { method: 'POST' }),
  myCustomers: () => req<any[]>(`/sellers/me/customers`),
  // ── collections ──
  myCollections: () => req<any[]>(`/sellers/me/collections`),
  createCollection: (body: any) =>
    req<any>(`/sellers/me/collections`, { method: 'POST', body: JSON.stringify(body) }),
  updateCollection: (id: string, body: any) =>
    req<any>(`/sellers/me/collections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCollection: (id: string) =>
    req<any>(`/sellers/me/collections/${id}`, { method: 'DELETE' }),

  myCoupons: () => req<any[]>(`/sellers/me/coupons`),
  createCoupon: (body: any) => req<any>(`/sellers/me/coupons`, { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (id: string, body: any) => req<any>(`/sellers/me/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoupon: (id: string) => req<any>(`/sellers/me/coupons/${id}`, { method: 'DELETE' }),
  recordVisit: (username: string, session: string, source?: string, referrer?: string) =>
    req<any>(`/sellers/${username}/visit`, { method: 'POST', noInvalidate: true, body: JSON.stringify({ session, source, referrer }) }),
  requestPayout: () => req<any>(`/sellers/me/payouts`, { method: 'POST' }),
  createProduct: (body: any) =>
    req<any>(`/products`, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: any) =>
    req<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  createManualOrder: (body: any) =>
    req<any>(`/orders/manual`, { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (body: any) =>
    req<any>(`/sellers/me/profile`, { method: 'PUT', body: JSON.stringify(body) }),
  acceptOrder: (id: string) => req<any>(`/orders/${id}/accept`, { method: 'POST' }),
  rejectOrder: (id: string, reason?: string) =>
    req<any>(`/orders/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  /** Step an order back one stage (Shipped → Accepted, etc). */
  revertOrder: (id: string) => req<any>(`/orders/${id}/revert`, { method: 'POST' }),
  /** Mark shipped. `awbNumber` is the seller's own tracking number, when they have one. */
  shipOrder: (id: string, courier: string, awbNumber?: string) =>
    req<any>(`/orders/${id}/ship`, { method: 'POST', body: JSON.stringify({ courier, awbNumber }) }),

  // admin (auth required, role=admin)
  adminStats: () => req<any>(`/admin/stats`),
  adminOverview: () => req<any>(`/admin/overview`),
  adminCommand: (range?: string) => req<any>(`/admin/command${range ? `?${range}` : ''}`),
  adminSellers: () => req<any[]>(`/admin/sellers`),
  adminSellerDetail: (id: string) => req<any>(`/admin/sellers/${id}/detail`),
  adminImpersonate: (id: string) => req<any>(`/admin/sellers/${id}/impersonate`, { method: 'POST' }),
  adminOrders: (q?: string, status?: string, range?: string) => {
    const qs = new URLSearchParams(range || '');
    if (q) qs.set('q', q);
    if (status && status !== 'all') qs.set('status', status);
    const s = qs.toString();
    return req<any[]>(`/admin/orders${s ? `?${s}` : ''}`);
  },
  adminOrderDetail: (id: string) => req<any>(`/admin/orders/${id}`),
  /**
   * Apply an admin action to an order.
   *
   * `expectedVersion` is the version the operator was shown; the server
   * rejects the call if the order has moved since. The idempotency key is
   * generated per attempt so a retry of the *same* click is a no-op, while a
   * deliberate second action is a new key. See backend common/money-actions.
   */
  adminOrderAction: (id: string, action: string, expectedVersion: number, idempotencyKey: string) =>
    req<any>(`/admin/orders/${id}/action/${action}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion }),
    }),

  adminSetRefundState: (id: string, to: string, expectedVersion: number, idempotencyKey: string) =>
    req<any>(`/admin/orders/${id}/refund-state`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ to, expectedVersion }),
    }),

  /**
   * Release an order's money to the seller, or put it back on hold. Carries the
   * version the screen showed and a per-click key, like the other money actions.
   */
  adminSetFunds: (id: string, action: 'release' | 'hold', expectedVersion: number, idempotencyKey: string) =>
    req<any>(`/admin/orders/${id}/funds/${action}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion }),
    }),
  adminOrderAudit: (id: string) => req<any[]>(`/admin/orders/${id}/audit`),

  /**
   * Hide or unhide one of the seller's own reviews.
   *
   * Hiding takes it off the storefront and out of the public rating. It is not
   * a delete — Loopy admins still see it, along with the reason.
   */
  hideReview: (id: string, hidden: boolean, reason?: string) =>
    req<any>(`/sellers/me/reviews/${id}/hide`, {
      method: 'POST',
      body: JSON.stringify({ hidden, reason }),
    }),

  /** Every review on the platform, hidden ones included. Admin only. */
  adminReviews: (filter?: string) =>
    req<any>(`/admin/reviews${filter ? `?filter=${encodeURIComponent(filter)}` : ''}`),

  /** The withdrawal queue: requests waiting on a decision, plus history. */
  adminPayouts: () => req<any>(`/admin/payouts`),

  /** Approve or reject a seller withdrawal. Pays real money — see payoutAction. */
  adminPayoutAction: (
    id: string,
    action: 'approve' | 'reject',
    expectedVersion: number,
    idempotencyKey: string,
    note?: string,
  ) =>
    req<any>(`/admin/payouts/${id}/${action}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion, note }),
    }),
  adminCustomers: (q?: string) => req<any[]>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminCustomerDetail: (key: string) => req<any>(`/admin/customers/${encodeURIComponent(key)}`),
  adminFinance: (range?: string) => req<any>(`/admin/finance${range ? `?${range}` : ''}`),
  adminAnalytics: (range?: string) => req<any>(`/admin/analytics${range ? `?${range}` : ''}`),
  /** The bell — derived from live admin state, see AdminService.notifications. */
  adminNotifications: () => req<any>(`/admin/notifications`),
  /** A CSV export for a period (`range` from lib/admin-range), as a Blob. */
  adminExport: (dataset: string, range: string) => download(`/admin/export/${dataset}?${range}`),
  approveSeller: (id: string) => req<any>(`/admin/sellers/${id}/approve`, { method: 'POST' }),
  rejectSeller: (id: string) => req<any>(`/admin/sellers/${id}/reject`, { method: 'POST' }),
  adminDisputes: () => req<any[]>(`/admin/disputes`),
  resolveDispute: (id: string, resolution: 'refunded' | 'released') =>
    req<any>(`/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),
};

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
