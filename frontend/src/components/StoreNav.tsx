'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { Bag, Bell, Loop, Search, Shield } from './icons';

export default function StoreNav({ protect = true }: { protect?: boolean }) {
  const count = useCart((s) => s.items.length);
  const { name, role, hydrate, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    hydrate();
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, [hydrate]);

  const links = [
    { href: '/shop', label: 'Shop' },
    { href: '/verify', label: 'Verify' },
    { href: '/orders', label: 'Orders' },
  ];

  const initial = (name || 'S').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50">
      <nav className={`flex h-[68px] items-center gap-6 px-5 transition-all sm:px-10 ${scrolled ? 'glass-panel border-b border-white/40 shadow-card' : 'bg-paper'}`}>
        <Link href="/" className="flex items-center gap-2 font-display text-[24px] font-extrabold tracking-tight text-navy">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={18} /></span> Loopy
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => {
            const active = path?.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`relative text-[14px] font-semibold transition-colors ${active ? 'text-navy' : 'text-muted hover:text-navy'}`}>
                {l.label}
                {active && <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded bg-green" />}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3.5 py-2 text-[13px] text-faint backdrop-blur sm:flex">
            <Search size={15} /> <span className="w-40">Search curated thrift…</span>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-white/70"><Bell size={18} /></button>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-white/70">
            {mounted && count > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-green px-1 text-[9px] font-extrabold text-white">{count}</span>}
            <Bag size={18} />
          </Link>

          {mounted && role === 'buyer' ? (
            <div className="relative">
              <button onClick={() => setMenu((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-green-mint to-green-600 font-display text-[15px] font-extrabold text-white shadow-card">
                {initial}
              </button>
              {menu && (
                <div className="glass-card absolute right-0 top-12 w-48 rounded-2xl p-2 text-sm">
                  <div className="px-3 py-2 text-[12px] text-muted">Signed in as <b className="text-navy">{name || 'Shopper'}</b></div>
                  <Link href="/orders" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 font-semibold text-navy hover:bg-white/70">My orders</Link>
                  <Link href="/seller/login" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 font-semibold text-navy hover:bg-white/70">Switch to selling</Link>
                  <button onClick={() => { signOut(); setMenu(false); router.push('/'); }} className="block w-full rounded-lg px-3 py-2 text-left font-semibold text-rose hover:bg-white/70">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-navy ml-1 !px-4 !py-2.5 text-[13px]">Sign in</Link>
          )}
        </div>
      </nav>
      {protect && (
        <div className="protect-bar h-9">
          <Shield size={14} /> Loopy Protected: Your money is safe with us until delivery.
        </div>
      )}
    </header>
  );
}
