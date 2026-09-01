'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StoreAccountControls from './StoreAccountControls';

/**
 * Header for the storefront's inner pages (cart, wishlist, orders, checkout,
 * account), which don't render the full store header.
 *
 * It shows the store's own logo and name — the same brand mark the storefront
 * header uses — so moving into the account area doesn't feel like leaving the
 * shop. The logo comes from a lightweight brand endpoint rather than `getStore`,
 * which would pull the whole catalogue.
 */
export default function StoreAccountBar({ username, storeName, accent }: {
  username: string; storeName?: string; accent?: string;
}) {
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => {
    let dead = false;
    api.getStoreBrand(username)
      .then((b: any) => { if (!dead) setBrand(b); })
      .catch(() => {});
    return () => { dead = true; };
  }, [username]);

  const name = brand?.storeName || storeName || username;
  const tint = brand?.accent || accent || '#15784A';
  const initial = (name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
      {/* same brand mark as the storefront header */}
      <Link href={`/s/${username}`} className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
        {brand?.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={name}
            className="h-9 w-9 rounded-xl object-cover shadow-card"
            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
          />
        ) : (
          <span
            className="grid h-9 w-9 place-items-center rounded-xl font-display text-[16px] font-extrabold text-white shadow-card"
            style={{ background: tint }}
          >
            {initial}
          </span>
        )}
        <span className="font-display text-[21px] font-extrabold tracking-tight text-navy">{name}</span>
      </Link>

      <nav className="ml-auto hidden items-center gap-4 text-[13px] font-semibold text-muted sm:flex">
        <Link href={`/s/${username}`} className="hover:text-navy">Home</Link>
        <Link href={`/s/${username}/orders`} className="hover:text-navy">Orders</Link>
      </nav>

      <div className="ml-auto sm:ml-3">
        <StoreAccountControls username={username} storeName={name} accent={tint} />
      </div>
    </div>
  );
}
