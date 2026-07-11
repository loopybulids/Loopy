'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCust, clearCust, cartCount, setCust, custApi, type Cust } from '@/lib/customer';
import { supabase } from '@/lib/supabase';
import CustomerAuth from './CustomerAuth';
import { Heart, Bag, Users } from '@/components/icons';

export default function StoreAccountBar({ username, storeName }: { username: string; storeName?: string }) {
  const [cust, setCustState] = useState<Cust | null>(null);
  const [count, setCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const sync = () => { setCustState(getCust(username)); setCount(cartCount(username)); };
    sync();
    window.addEventListener('cust-change', sync);
    window.addEventListener('cart-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('cust-change', sync); window.removeEventListener('cart-change', sync); window.removeEventListener('storage', sync); };
  }, [username]);

  // Complete a Google login that redirected back to the store.
  useEffect(() => {
    if (!supabase) return;
    if (sessionStorage.getItem('loopy_cust_oauth') !== username) return;
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token;
      if (!t) return;
      sessionStorage.removeItem('loopy_cust_oauth');
      sessionStorage.removeItem('loopy_cust_return');
      try { const r = await custApi.authSupabase(username, t); setCust(username, r); } catch { /* ignore */ }
    });
  }, [username]);

  return (
    <>
      <div className="flex h-9 items-center justify-end gap-4 bg-navy px-5 text-[12px] font-semibold text-white/85 sm:px-8">
        <Link href={`/s/${username}/wishlist`} className="flex items-center gap-1.5 hover:text-white"><Heart size={13} /> Wishlist</Link>
        <Link href={`/s/${username}/cart`} className="flex items-center gap-1.5 hover:text-white">
          <Bag size={13} /> Cart{count > 0 && <span className="rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">{count}</span>}
        </Link>
        {cust ? (
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1.5"><Users size={13} /> {cust.customer.name || 'Account'}</span>
            <button onClick={() => clearCust(username)} className="text-white/60 hover:text-white">Sign out</button>
          </span>
        ) : (
          <button onClick={() => setAuthOpen(true)} className="flex items-center gap-1.5 hover:text-white"><Users size={13} /> Sign in</button>
        )}
      </div>
      {authOpen && <CustomerAuth username={username} storeName={storeName} onClose={() => setAuthOpen(false)} onAuthed={() => setAuthOpen(false)} />}
    </>
  );
}
