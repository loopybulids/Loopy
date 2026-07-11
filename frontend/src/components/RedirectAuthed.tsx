'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** On the marketing landing: (1) if a customer Google login was redirected here,
 *  send them back to their store to finish; (2) bounce logged-in sellers/admins
 *  to their console so they never see the seller-acquisition page. */
export default function RedirectAuthed() {
  const router = useRouter();
  useEffect(() => {
    const pending = sessionStorage.getItem('loopy_cust_oauth');
    const ret = sessionStorage.getItem('loopy_cust_return');
    if (pending && ret) {
      // let the supabase client consume the session from the URL first, then return
      if (supabase) supabase.auth.getSession().finally(() => { window.location.href = ret; });
      else window.location.href = ret;
      return;
    }
    const token = localStorage.getItem('loopy_token');
    const role = localStorage.getItem('loopy_role');
    if (!token) return;
    if (role === 'seller') router.replace('/seller');
    else if (role === 'admin') router.replace('/admin');
  }, [router]);
  return null;
}
