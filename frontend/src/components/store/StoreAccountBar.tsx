'use client';
import Link from 'next/link';
import StoreAccountControls from './StoreAccountControls';
import { Back } from '@/components/icons';

/**
 * Header for the storefront's inner pages (cart, wishlist, orders, checkout),
 * which don't render the full store header.
 *
 * This used to be a coloured strip carrying wishlist/cart/account above the
 * header — but the header already had wishlist and cart icons, so everything
 * appeared twice. The strip is gone; the controls now live in one place
 * (StoreAccountControls) and are shared with the real header.
 */
export default function StoreAccountBar({ username, storeName, accent }: {
  username: string; storeName?: string; accent?: string;
}) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
      <Link href={`/s/${username}`} className="flex items-center gap-1.5 font-display text-[15px] font-extrabold text-navy transition-opacity hover:opacity-70">
        <Back size={16} /> {storeName || 'Back to store'}
      </Link>

      <nav className="ml-auto hidden items-center gap-4 text-[13px] font-semibold text-muted sm:flex">
        <Link href={`/s/${username}`} className="hover:text-navy">Home</Link>
        <Link href={`/s/${username}/orders`} className="hover:text-navy">Orders</Link>
      </nav>

      <div className="ml-auto sm:ml-3">
        <StoreAccountControls username={username} storeName={storeName} accent={accent} />
      </div>
    </div>
  );
}
