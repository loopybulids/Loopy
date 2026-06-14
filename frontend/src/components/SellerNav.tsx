'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loop } from './icons';

const LINKS = [
  { href: '/seller/dashboard', label: 'Home' },
  { href: '/seller/products', label: 'Products' },
  { href: '/seller/wallet', label: 'Wallet' },
  { href: '/seller/kyc', label: 'KYC' },
];

export default function SellerNav() {
  const path = usePathname();
  const router = useRouter();
  return (
    <nav className="flex h-16 items-center gap-4 border-b border-line bg-white px-5">
      <Link href="/seller/dashboard" className="flex items-center gap-2 font-serif text-lg font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-2 to-indigo text-white"><Loop size={18} /></span>
        Loopy <span className="chip bg-indigo-soft text-indigo">Seller</span>
      </Link>
      <div className="ml-4 hidden gap-1 sm:flex">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${path === l.href ? 'bg-indigo-soft text-indigo' : 'text-ink2'}`}>{l.label}</Link>
        ))}
      </div>
      <button onClick={() => { localStorage.removeItem('loopy_token'); router.push('/seller/login'); }} className="ml-auto text-sm font-semibold text-muted">Sign out</button>
    </nav>
  );
}
