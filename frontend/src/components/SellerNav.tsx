'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { Bell, Loop } from './icons';

const LINKS = [
  { href: '/seller/dashboard', label: 'Dashboard' },
  { href: '/seller/products', label: 'Products' },
  { href: '/seller/list', label: 'List Item' },
  { href: '/seller/wallet', label: 'Earnings' },
  { href: '/seller/kyc', label: 'KYC' },
];

export default function SellerNav() {
  const path = usePathname();
  const router = useRouter();
  const { name, hydrate, signOut } = useAuth();
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <nav className="sticky top-0 z-50 flex h-[64px] items-center gap-5 border-b border-white/10 bg-[#0A1828]/90 px-5 backdrop-blur-md sm:px-8">
      <Link href="/seller/dashboard" className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Loop size={18} /></span> Loopy
        <span className="ml-0.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A98AD]">Seller</span>
      </Link>
      <div className="ml-2 hidden items-center gap-1 md:flex">
        {LINKS.map((l) => {
          const active = path === l.href;
          return (
            <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${active ? 'bg-white/[0.06] text-white' : 'text-[#8A98AD] hover:text-white'}`}>
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="grid h-9 w-9 place-items-center rounded-full text-[#8A98AD] hover:bg-white/[0.06] hover:text-white"><Bell size={18} /></button>
        <span className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[13px] font-semibold text-white sm:flex">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-[11px] font-extrabold text-[#07140A]">{(name || 'S').trim().charAt(0).toUpperCase()}</span>
          {name || 'Store'}
        </span>
        <button onClick={() => { signOut(); router.push('/seller/login'); }} className="text-sm font-semibold text-[#8A98AD] hover:text-white">Sign out</button>
      </div>
    </nav>
  );
}
