'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cart';
import { Bag, Heart, Search, Loop } from './icons';

export default function StoreNav() {
  const count = useCart((s) => s.items.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="flex h-[34px] items-center justify-center gap-4 bg-[#17131b] px-4 text-[11px] font-medium tracking-wide text-[#d8d0c2]">
        <span className="hidden sm:inline">Free 14-day returns</span>
        <span className="opacity-30">/</span>
        <span>Protected checkout — money held until you confirm delivery</span>
        <span className="hidden opacity-30 sm:inline">/</span>
        <span className="hidden sm:inline">Verified sellers only</span>
      </div>
      <nav className="flex h-[74px] items-center gap-7 border-b border-[#EFE7D9] bg-cream px-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-[22px] font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-2 to-indigo text-white">
            <Loop size={18} />
          </span>
          Loopy
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button className="grid h-10 w-10 place-items-center rounded-xl text-ink"><Search size={19} /></button>
          <button className="grid h-10 w-10 place-items-center rounded-xl text-ink"><Heart size={19} /></button>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink">
            {mounted && count > 0 && (
              <span className="absolute right-1 top-1.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-cream bg-coral px-1 text-[9px] font-extrabold text-white">
                {count}
              </span>
            )}
            <Bag size={19} />
          </Link>
          <Link href="/orders" className="ml-1 rounded-xl px-2.5 text-[12.5px] font-semibold text-ink2">My orders</Link>
        </div>
      </nav>
    </>
  );
}
