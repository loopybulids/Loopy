'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

/**
 * Frictionless, role-based auth.
 *
 * There are no passwords or OTP screens for the user — they just pick a role and
 * type a name. Under the hood we still obtain a *real* backend JWT (using the
 * built-in master code `0000`) so seller-only endpoints keep working and the
 * "seller posts a product → it shows up on the buyer side" flow stays intact.
 *
 *  - Seller  → authenticates as the seeded demo store (has a sellerId + approved
 *              KYC, so it can publish products).
 *  - Shopper → authenticates as a persistent buyer identity (auto-created on the
 *              backend the first time), so orders/reviews persist for them.
 */

// Seeded demo seller ("The Vintage Loop") — the one store that can publish.
const SELLER_PHONE = '9876500210';
const MASTER_CODE = '0000';

export type Role = 'buyer' | 'seller';

export interface SessionUser {
  id: string;
  name: string;
  role: string;
  sellerId: string | null;
}

interface AuthState {
  ready: boolean;
  role: Role | null;
  user: SessionUser | null;
  name: string;
  busy: boolean;
  hydrate: () => void;
  signIn: (role: Role, name: string) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginWithSupabase: (token: string) => Promise<void>;
  register: (body: { name: string; email: string; password: string; storeName: string }) => Promise<void>;
  signOut: () => void;
}

// Persist a session response (accessToken + user) the same way across flows.
function persistSession(r: any, role: Role, fallbackName: string) {
  const display = r.user?.name?.trim() || fallbackName;
  localStorage.setItem('loopy_token', r.accessToken);
  localStorage.setItem('loopy_user', JSON.stringify(r.user));
  localStorage.setItem('loopy_role', role);
  localStorage.setItem('loopy_name', display);
  return display;
}

// A stable buyer phone so the same shopper keeps their orders between sessions.
function buyerPhone(): string {
  if (typeof window === 'undefined') return '9000000001';
  let p = localStorage.getItem('loopy_buyer_phone');
  if (!p) {
    p = '9' + String(Date.now()).slice(-9);
    localStorage.setItem('loopy_buyer_phone', p);
  }
  return p;
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: false,
  role: null,
  user: null,
  name: '',
  busy: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('loopy_token');
      const role = localStorage.getItem('loopy_role') as Role | null;
      const user = localStorage.getItem('loopy_user');
      const name = localStorage.getItem('loopy_name') || '';
      if (token && role) {
        set({ ready: true, role, name, user: user ? JSON.parse(user) : null });
        return;
      }
    } catch {
      /* ignore corrupt storage */
    }
    set({ ready: true, role: null, user: null, name: '' });
  },

  signIn: async (role, name) => {
    set({ busy: true });
    try {
      const phone = role === 'seller' ? SELLER_PHONE : buyerPhone();
      await api.login(phone).catch(() => null); // primes the OTP; master code works regardless
      const r = await api.verify(phone, MASTER_CODE, name || undefined);
      const display = name?.trim() || r.user?.name || (role === 'seller' ? 'Your Store' : 'Shopper');
      localStorage.setItem('loopy_token', r.accessToken);
      localStorage.setItem('loopy_user', JSON.stringify(r.user));
      localStorage.setItem('loopy_role', role);
      localStorage.setItem('loopy_name', display);
      set({ ready: true, role, user: r.user, name: display, busy: false });
    } catch (e) {
      set({ busy: false });
      throw e;
    }
  },

  loginEmail: async (email, password) => {
    set({ busy: true });
    try {
      const r = await api.loginEmail(email, password);
      const display = persistSession(r, 'seller', 'Your Store');
      set({ ready: true, role: 'seller', user: r.user, name: display, busy: false });
    } catch (e) {
      set({ busy: false });
      throw e;
    }
  },

  // Exchange a verified Supabase session (Google / email OTP) for a Loopy JWT.
  loginWithSupabase: async (token) => {
    set({ busy: true });
    try {
      const r = await api.loginWithSupabase(token);
      const display = persistSession(r, 'seller', 'Your Store');
      set({ ready: true, role: 'seller', user: r.user, name: display, busy: false });
    } catch (e) {
      set({ busy: false });
      throw e;
    }
  },

  register: async (body) => {
    set({ busy: true });
    try {
      const r = await api.registerSeller(body);
      const display = persistSession(r, 'seller', body.storeName || 'Your Store');
      set({ ready: true, role: 'seller', user: r.user, name: display, busy: false });
    } catch (e) {
      set({ busy: false });
      throw e;
    }
  },

  signOut: () => {
    if (typeof window !== 'undefined') {
      ['loopy_token', 'loopy_user', 'loopy_role', 'loopy_name'].forEach((k) =>
        localStorage.removeItem(k),
      );
    }
    set({ role: null, user: null, name: '' });
  },
}));
