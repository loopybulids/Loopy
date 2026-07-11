'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** On the marketing landing, bounce logged-in sellers/admins to their console
 *  so they never see the seller-acquisition page after signing in. */
export default function RedirectAuthed() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('loopy_token');
    const role = localStorage.getItem('loopy_role');
    if (!token) return;
    if (role === 'seller') router.replace('/seller');
    else if (role === 'admin') router.replace('/admin');
  }, [router]);
  return null;
}
