const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('loopy_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
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
      const dest = role === 'admin' ? '/admin/login' : '/seller/login';
      if (!location.pathname.includes('/login')) location.href = dest;
      throw new Error('Your session expired — please sign in again.');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // storefront / products
  getStore: (username: string) => req<any>(`/sellers/${username}`),
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
  loginWithSupabase: (token: string) =>
    req<any>(`/auth/supabase`, { method: 'POST', body: JSON.stringify({ token }) }),

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
  myProducts: () => req<any[]>(`/sellers/me/products`),
  myWallet: () => req<any>(`/sellers/me/wallet`),
  myAnalytics: () => req<any>(`/sellers/me/analytics`),
  myOnboarding: () => req<any>(`/sellers/me/onboarding`),
  myReviews: () => req<any[]>(`/sellers/me/reviews`),
  respondReview: (id: string, response: string) =>
    req<any>(`/sellers/me/reviews/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) }),
  myNotifications: () => req<any>(`/sellers/me/notifications`),
  readNotifications: () => req<any>(`/sellers/me/notifications/read`, { method: 'POST' }),
  myCustomers: () => req<any[]>(`/sellers/me/customers`),
  myCoupons: () => req<any[]>(`/sellers/me/coupons`),
  createCoupon: (body: any) => req<any>(`/sellers/me/coupons`, { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (id: string, body: any) => req<any>(`/sellers/me/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoupon: (id: string) => req<any>(`/sellers/me/coupons/${id}`, { method: 'DELETE' }),
  recordVisit: (username: string, session: string, source?: string, referrer?: string) =>
    req<any>(`/sellers/${username}/visit`, { method: 'POST', body: JSON.stringify({ session, source, referrer }) }),
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
  shipOrder: (id: string) => req<any>(`/orders/${id}/ship`, { method: 'POST' }),

  // admin (auth required, role=admin)
  adminStats: () => req<any>(`/admin/stats`),
  adminOverview: () => req<any>(`/admin/overview`),
  adminCommand: () => req<any>(`/admin/command`),
  adminSellers: () => req<any[]>(`/admin/sellers`),
  adminSellerDetail: (id: string) => req<any>(`/admin/sellers/${id}/detail`),
  adminImpersonate: (id: string) => req<any>(`/admin/sellers/${id}/impersonate`, { method: 'POST' }),
  adminOrders: (q?: string, status?: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (status && status !== 'all') qs.set('status', status);
    const s = qs.toString();
    return req<any[]>(`/admin/orders${s ? `?${s}` : ''}`);
  },
  adminOrderDetail: (id: string) => req<any>(`/admin/orders/${id}`),
  adminOrderAction: (id: string, action: string) => req<any>(`/admin/orders/${id}/${action}`, { method: 'POST' }),
  adminCustomers: (q?: string) => req<any[]>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminCustomerDetail: (key: string) => req<any>(`/admin/customers/${encodeURIComponent(key)}`),
  adminFinance: () => req<any>(`/admin/finance`),
  adminAnalytics: () => req<any>(`/admin/analytics`),
  approveSeller: (id: string) => req<any>(`/admin/sellers/${id}/approve`, { method: 'POST' }),
  rejectSeller: (id: string) => req<any>(`/admin/sellers/${id}/reject`, { method: 'POST' }),
  adminDisputes: () => req<any[]>(`/admin/disputes`),
  resolveDispute: (id: string, resolution: 'refunded' | 'released') =>
    req<any>(`/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),
};

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
