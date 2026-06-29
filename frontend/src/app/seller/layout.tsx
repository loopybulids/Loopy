'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import {
  Bag, Bell, Chart, Cog, Grid, Heart, LogOut, Loop, Plus, Share, Store, Tag, Truck, Verified, Wallet,
} from '@/components/icons';

/* ───── sidebar tabs (PRD seller modules) ───── */
const NAV = [
  { href: '/seller', label: 'Dashboard', icon: <Grid size={18} /> },
  { href: '/seller/catalog', label: 'Products', icon: <Tag size={18} /> },
  { href: '/seller/orders', label: 'Orders', icon: <Bag size={18} /> },
  { href: '/seller/customers', label: 'Customers', icon: <Heart size={18} /> },
  { href: '/seller/store-editor', label: 'Store Editor', icon: <Store size={18} /> },
  { href: '/seller/links', label: 'Checkout links', icon: <Share size={18} /> },
  { href: '/seller/shipping', label: 'Shipping', icon: <Truck size={18} /> },
  { href: '/seller/payments', label: 'Payments', icon: <Wallet size={18} /> },
  { href: '/seller/discounts', label: 'Discounts', icon: <Tag size={18} /> },
  { href: '/seller/analytics', label: 'Analytics', icon: <Chart size={18} /> },
  { href: '/seller/profile', label: 'Profile', icon: <Verified size={18} /> },
  { href: '/seller/settings', label: 'Settings', icon: <Cog size={18} /> },
];

// console routes that get the sidebar chrome (NAV tabs + extra nested pages)
const CONSOLE = new Set([...NAV.map((n) => n.href), '/seller/products/new']);

// nested console pages (product edit, manual order) also get the chrome
const CONSOLE_PREFIXES = ['/seller/catalog/', '/seller/orders/'];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConsole = CONSOLE.has(pathname) || CONSOLE_PREFIXES.some((p) => pathname.startsWith(p));

  // Login + any legacy seller pages render without the console chrome.
  if (!isConsole) return <>{children}</>;
  return <Console pathname={pathname}>{children}</Console>;
}

function Console({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const router = useRouter();
  const { user, name, hydrate, signOut } = useAuth();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    hydrate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('loopy_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('loopy_role') : null;
    if (!token || role !== 'seller') {
      router.replace('/seller/login');
      return;
    }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-muted">
        <span className="animate-pulse font-display text-sm font-bold">Loading your console…</span>
      </div>
    );
  }

  const active = NAV.find((n) => n.href === pathname);
  const initial = (name || 'S').trim().charAt(0).toUpperCase();
  const out = () => { signOut(); router.replace('/seller/login'); };

  return (
    <div className="min-h-screen bg-paper text-navy">
      {/* ───── sidebar ───── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-line bg-white px-4 py-6 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 font-display text-[18px] font-extrabold tracking-tight text-navy">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={15} /></span>
          Loopy
          <span className="ml-auto rounded-md bg-green-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green">Seller</span>
        </Link>

        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const on = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`c-nav ${on ? 'c-nav-on' : 'c-nav-off'}`}
              >
                <span className={on ? 'text-green-600' : 'text-faint'}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* user card */}
        <div className="absolute inset-x-4 bottom-6">
          <div className="card flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green text-[14px] font-extrabold text-white">{initial}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[13px] font-bold text-navy">{name || 'Your Store'}</div>
              <div className="truncate text-[11px] text-faint">{user?.role === 'seller' ? 'Verified seller' : 'Seller'}</div>
            </div>
            <button onClick={out} title="Log out" className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-green-soft hover:text-navy">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* mobile overlay */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-navy/30 lg:hidden" />}

      {/* ───── main column ───── */}
      <div className="lg:pl-[248px]">
        {/* topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/80 px-5 py-4 backdrop-blur sm:px-8">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white lg:hidden">
            <Grid size={18} />
          </button>
          <div>
            <h1 className="font-display text-[19px] font-extrabold text-navy">{active?.label || 'Dashboard'}</h1>
            <p className="text-[12px] text-muted">Welcome back, {(name || 'seller').split(' ')[0]} 👋</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/seller/links" className="btn-green hidden px-4 py-2.5 text-[13px] sm:inline-flex"><Plus size={15} /> New checkout link</Link>
            <button className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white"><Bell size={18} /></button>
            <Link href="/shop" title="View storefront" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white"><Store size={18} /></Link>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
