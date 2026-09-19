'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getCust, clearCust, cartCount, custApi, type Cust } from '@/lib/customer';
import CustomerAuth from './CustomerAuth';
import { Heart, Bag, Users, LogOut } from '@/components/icons';
import { storeHref } from '@/lib/store-url';

/**
 * Wishlist / account / cart controls for the storefront header.
 *
 * Icon row with counts, and the account icon opens a menu showing who's signed
 * in — rather than spending header width on a name and a separate sign-out
 * button.
 *
 * With no `username` (the store-editor preview) the links are inert — there's
 * no real storefront to navigate to.
 */
export default function StoreAccountControls({ username, storeName, accent }: {
  username?: string; storeName?: string; accent?: string;
}) {
  const [cust, setCust] = useState<Cust | null>(null);
  const [cart, setCart] = useState(0);
  const [wish, setWish] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;
    const sync = () => { setCust(getCust(username)); setCart(cartCount(username)); };
    sync();
    window.addEventListener('cust-change', sync);
    window.addEventListener('cart-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cust-change', sync);
      window.removeEventListener('cart-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, [username]);

  // Wishlist lives server-side, so it needs a fetch — only when signed in.
  useEffect(() => {
    if (!username || !cust) { setWish(0); return; }
    let dead = false;
    const load = () => custApi.wishlistIds(username)
      .then((ids: string[]) => { if (!dead) setWish(ids?.length || 0); })
      .catch(() => {});
    load();
    window.addEventListener('wishlist-change', load);
    return () => { dead = true; window.removeEventListener('wishlist-change', load); };
  }, [username, cust]);

  // close the account menu on outside click / Escape
  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setMenu(false); };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [menu]);

  const pill = 'relative grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-navy/[0.06] hover:text-navy';
  const badge = 'absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white';
  const dot = accent || '#15784A';

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Link href={username ? storeHref(username, '/wishlist') : '#'} title="Wishlist" aria-label={wish ? `Wishlist, ${wish} items` : 'Wishlist'} className={pill}>
          <Heart size={18} />
          {wish > 0 && <span className={badge} style={{ background: dot }}>{wish > 99 ? '99+' : wish}</span>}
        </Link>

        {/* account */}
        <div className="relative" ref={box}>
          <button
            onClick={() => (cust ? setMenu((m) => !m) : setAuthOpen(true))}
            title={cust ? 'Account' : 'Sign in'}
            aria-label={cust ? 'Account menu' : 'Sign in'}
            aria-expanded={menu}
            className={pill}
          >
            <Users size={18} />
          </button>

          {menu && cust && (
            <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-lift">
              <div className="px-4 py-3">
                <div className="truncate text-[14px] font-bold text-navy">{cust.customer?.name || 'Account'}</div>
                {cust.customer?.email && <div className="truncate text-[12px] text-muted">{cust.customer.email}</div>}
              </div>
              <div className="h-px bg-line" />
              <Link
                href={username ? storeHref(username, '/account') : '#'}
                onClick={() => setMenu(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-[13.5px] font-semibold text-navy transition-colors hover:bg-paper"
              >
                <Users size={16} /> My Account
              </Link>
              <button
                onClick={() => { setMenu(false); if (username) clearCust(username); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-semibold text-navy transition-colors hover:bg-paper"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>

        <Link href={username ? storeHref(username, '/cart') : '#'} title="Cart" aria-label={cart ? `Cart, ${cart} items` : 'Cart'} className={pill}>
          <Bag size={18} />
          {cart > 0 && <span className={badge} style={{ background: dot }}>{cart > 99 ? '99+' : cart}</span>}
        </Link>
      </div>

      {authOpen && username && (
        <CustomerAuth username={username} storeName={storeName} onClose={() => setAuthOpen(false)} onAuthed={() => setAuthOpen(false)} />
      )}
    </>
  );
}
