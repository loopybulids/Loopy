'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/admin/AdminKit';
import Logo from '@/components/Logo';
import { Loop } from '@/components/icons';
import { clearApiDataCache } from '@/lib/use-api-data';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' as const },
  { href: '/admin/orders', label: 'Orders', icon: 'bag' as const },
  { href: '/admin/sellers', label: 'Sellers', icon: 'store' as const },
  { href: '/admin/customers', label: 'Customers', icon: 'users' as const },
  { href: '/admin/finance', label: 'Finance', icon: 'wallet' as const },
  { href: '/admin/payouts', label: 'Payouts', icon: 'rupee' as const },
  { href: '/admin/reviews', label: 'Reviews', icon: 'star' as const },
  { href: '/admin/support', label: 'Support', icon: 'headset' as const },
  { href: '/admin/analytics', label: 'Analytics', icon: 'chart' as const },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (isLogin) return;
    const token = localStorage.getItem('loopy_token');
    const role = localStorage.getItem('loopy_role');
    if (!token || role !== 'admin') { router.replace('/admin/login'); return; }
    setOk(true);
  }, [isLogin, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLogin) return <>{children}</>;
  if (!ok) return <main className="grid min-h-screen place-items-center bg-cool text-dim"><span className="animate-pulse font-display text-sm font-bold">Loading command center…</span></main>;

  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-cool">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hair bg-slateink text-slate lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          {/* light sidebar → the standard wordmark */}
          <div className="leading-tight">
            <Logo height={24} />
            <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-pale">Admin</div>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${active(n.href) ? 'bg-accent-soft font-semibold text-accent' : 'font-medium text-dim hover:bg-cool hover:text-slate'}`}>
              <span className={active(n.href) ? 'text-accent' : 'text-pale'}><Icon name={n.icon} size={18} /></span>
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => { ['loopy_token', 'loopy_role', 'loopy_user', 'loopy_name', 'loopy_admin_command'].forEach((k) => localStorage.removeItem(k)); clearApiDataCache(); router.push('/seller/login'); }}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-dim transition-colors hover:bg-cool hover:text-slate"
        >
          <Icon name="logout" size={18} /> Sign out
        </button>
      </aside>

      {/* top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hair bg-white px-5 lg:pl-[16.5rem]">
        <Link href="/admin/search" className="flex flex-1 items-center gap-2 rounded-lg border border-hair bg-cool px-3.5 py-2 text-[13px] text-pale transition-colors hover:border-accent/40">
          <Icon name="search" size={16} /> Search orders, sellers, customers, payments…
          <kbd className="ml-auto hidden rounded border border-hair bg-white px-1.5 py-0.5 text-[10px] font-bold text-dim sm:block">⌘K</kbd>
        </Link>
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-hair bg-white text-slate"><Icon name="bell" size={16} /></span>
        <span className="flex items-center gap-2 rounded-xl border border-hair bg-white py-1.5 pl-1.5 pr-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hair bg-cool text-[10.5px] font-bold text-dim">SA</span>
          <span className="hidden text-left leading-tight sm:block"><span className="block text-[12.5px] font-bold text-slate">Super Admin</span><span className="block text-[10px] text-pale">admin@loopy.in</span></span>
        </span>
      </header>

      {/* mobile nav */}
      <nav className="sticky top-16 z-10 flex gap-1 overflow-x-auto border-b border-hair bg-white px-3 py-2 lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${active(n.href) ? 'bg-slate text-white' : 'text-dim hover:text-slate'}`}>
            <Icon name={n.icon} size={14} /> {n.label}
          </Link>
        ))}
      </nav>

      <main className="px-4 py-6 sm:px-6 lg:pl-[16.5rem] lg:pr-6">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
