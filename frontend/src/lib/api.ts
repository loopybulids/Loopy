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

  // order actions
  deliverOrder: (id: string) => req<any>(`/orders/${id}/deliver`, { method: 'POST' }),
  reviewOrder: (id: string, rating: number, comment: string) =>
    req<any>(`/orders/${id}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  disputeOrder: (id: string, issueType: string, description: string) =>
    req<any>(`/orders/${id}/dispute`, { method: 'POST', body: JSON.stringify({ issueType, description }) }),

  // seller (auth required)
  myOrders: () => req<any[]>(`/sellers/me/orders`),
  myProducts: () => req<any[]>(`/sellers/me/products`),
  myWallet: () => req<any>(`/sellers/me/wallet`),
  requestPayout: () => req<any>(`/sellers/me/payouts`, { method: 'POST' }),
  createProduct: (body: any) =>
    req<any>(`/products`, { method: 'POST', body: JSON.stringify(body) }),
  acceptOrder: (id: string) => req<any>(`/orders/${id}/accept`, { method: 'POST' }),
  shipOrder: (id: string) => req<any>(`/orders/${id}/ship`, { method: 'POST' }),

  // admin (auth required, role=admin)
  adminStats: () => req<any>(`/admin/stats`),
  adminSellers: () => req<any[]>(`/admin/sellers`),
  approveSeller: (id: string) => req<any>(`/admin/sellers/${id}/approve`, { method: 'POST' }),
  rejectSeller: (id: string) => req<any>(`/admin/sellers/${id}/reject`, { method: 'POST' }),
  adminDisputes: () => req<any[]>(`/admin/disputes`),
  resolveDispute: (id: string, resolution: 'refunded' | 'released') =>
    req<any>(`/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),
};

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
