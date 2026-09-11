'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { storeUrl } from '@/lib/store-url';
import { exitImpersonation } from '@/lib/impersonate';
import NotificationsBell from '@/components/NotificationsBell';
import Logo from '@/components/Logo';
import StoreSwitcher from '@/components/StoreSwitcher';
import {
  Bag, Cog, Grid, Heart, LogOut, Loop, MessageDots, Plus, Share, Store, Tag, Truck, Verified, Wallet,
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
  { href: '/seller/reviews', label: 'Reviews', icon: <MessageDots size={18} /> },
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
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setImpersonating(typeof window !== 'undefined' ? localStorage.getItem('loopy_impersonating') : null);
    hydrate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('loopy_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('loopy_role') : null;
    if (!token || role !== 'seller') {
      router.replace('/seller/login');
      return;
    }
    setReady(true);
    // Only the shell's three fields — not the whole Seller row with its
    // base64 media and store config. See getSummary on the backend.
    api.mySummary().then((p) => {
      setUsername(p?.username || '');
      setLogoUrl(p?.logoUrl || null);
      setPublished(!!p?.published);
      // Comes from the server: the stored login payload has no email.
      setEmail(p?.email || null);
    }).catch(() => {});
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
        {/* Brand block: "Seller Console" is the loud part — it says where you are.
            Loopy stays present but recedes to a small mark above it. */}
        <div className="mb-4 rounded-2xl bg-gradient-to-b from-green-soft/70 to-transparent p-3 pb-3.5">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <Link href="/" title="Loopy home" className="transition-opacity hover:opacity-70">
              <Logo height={19} />
            </Link>
            <span className="rounded-full bg-green px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-white">
              Seller
            </span>
          </div>

          <StoreSwitcher
            storeName={name || 'Your Store'}
            username={username}
            logoUrl={logoUrl}
            email={email}
            published={published}
          />
        </div>

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
        {/* admin impersonation banner */}
        {impersonating && (
          <div className="flex items-center justify-center gap-3 bg-navy px-4 py-2 text-center text-[12.5px] font-semibold text-white">
            👁 Viewing {impersonating !== '1' ? <b>{impersonating}</b> : 'this store'} as admin
            <button onClick={exitImpersonation} className="rounded-md bg-white/15 px-3 py-1 text-[12px] font-bold hover:bg-white/25">← Return to admin</button>
          </div>
        )}
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
            <Link href="/seller/links" className="btn-green hidden px-3.5 py-2 text-[12.5px] sm:inline-flex"><Plus size={15} /> New checkout link</Link>
            <NotificationsBell />
            {username
              ? <a href={storeUrl(username)} target="_blank" rel="noreferrer" title="View storefront" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white"><Store size={18} /></a>
              : <Link href="/seller/profile" title="Set a store handle" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white"><Store size={18} /></Link>}
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
