'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCust, cartCount, type Cust } from '@/lib/customer';
import StoreAccountBar from './StoreAccountBar';
import CustomerAuth from './CustomerAuth';
import { Bag, Heart, Users, Back, Truck, ShieldLock } from '@/components/icons';

/**
 * Shared chrome for every customer account page — heading, greeting and the tab
 * strip — so Orders / Profile / Addresses / Wishlist / Cart read as one section
 * instead of five unrelated pages.
 *
 * Also owns the signed-out state, since all of these require an account: rather
 * than each page reimplementing its own prompt, an unauthenticated visitor gets
 * one consistent sign-in card.
 */

const TABS = [
  { seg: 'orders', label: 'My Orders', icon: <Bag size={15} /> },
  { seg: 'account', label: 'Profile', icon: <Users size={15} /> },
  { seg: 'addresses', label: 'Addresses', icon: <Truck size={15} /> },
  { seg: 'wishlist', label: 'Wishlist', icon: <Heart size={15} /> },
  { seg: 'cart', label: 'Cart', icon: <Bag size={15} /> },
];

export default function AccountShell({ username, title, children, requireAuth = true }: {
  username: string;
  /** Falls back to the tab's own label. */
  title?: string;
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const pathname = usePathname();
  const [cust, setCust] = useState<Cust | null>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const sync = () => { setCust(getCust(username)); setCount(cartCount(username)); setReady(true); };
    sync();
    window.addEventListener('cust-change', sync);
    window.addEventListener('cart-change', sync);
    return () => { window.removeEventListener('cust-change', sync); window.removeEventListener('cart-change', sync); };
  }, [username]);

  const active = (seg: string) => pathname === `/s/${username}/${seg}`;
  const firstName = (cust?.customer?.name || '').trim().split(' ')[0];

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />

      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-4xl px-5 pt-6 sm:px-8">
          <Link href={`/s/${username}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-navy">
            <Back size={13} /> Back to {username}
          </Link>

          <h1 className="mt-2 font-display text-[27px] font-extrabold tracking-tight text-navy">My Account</h1>
          <p className="mt-0.5 text-[13.5px] text-muted">
            {firstName ? `Hi ${firstName}, manage your orders and details below.` : 'Manage your orders and details below.'}
          </p>

          {/* tabs — horizontally scrollable rather than wrapping on small screens */}
          <nav className="no-sb mt-4 flex gap-1.5 overflow-x-auto pb-3">
            {TABS.map((t) => {
              const on = active(t.seg);
              return (
                <Link
                  key={t.seg}
                  href={`/s/${username}/${t.seg}`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                    on ? 'bg-green text-white shadow-card' : 'text-muted hover:bg-paper hover:text-navy'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.seg === 'cart' && count > 0 && (
                    <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${on ? 'bg-white/25' : 'bg-green-soft text-green-600'}`}>{count}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8">
        {title && <h2 className="mb-4 font-display text-[19px] font-extrabold text-navy">{title}</h2>}

        {!ready ? null : requireAuth && !cust ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-soft text-green-600"><ShieldLock size={26} /></span>
            <h3 className="mt-4 font-display text-[18px] font-extrabold text-navy">Sign in to continue</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-muted">
              Sign in to track orders, save favourites and manage your delivery addresses for this store.
            </p>
            <button onClick={() => setAuthOpen(true)} className="btn-green mt-5 inline-flex">Sign in</button>
          </div>
        ) : (
          children
        )}
      </div>

      {authOpen && (
        <CustomerAuth username={username} onClose={() => setAuthOpen(false)} onAuthed={() => setAuthOpen(false)} />
      )}
    </main>
  );
}
