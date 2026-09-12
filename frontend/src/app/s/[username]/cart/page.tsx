'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { getCart, updateQty, applyLinkItems, parseLinkItems, type CartItem } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import { Bag, ArrowRight } from '@/components/icons';

export default function CartPage() {
  const { username } = useParams<{ username: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filling, setFilling] = useState(false);

  const sync = () => setCart(getCart(username));
  useEffect(() => { sync(); window.addEventListener('cart-change', sync); return () => window.removeEventListener('cart-change', sync); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * A seller's checkout link lands here as `?add=<productId>:<qty>,…`.
   * Resolve those ids against the live catalogue (never trust prices from a URL),
   * fill the cart, then strip the param so a refresh can't re-apply it.
   */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('add');
    if (!param) return;
    const wanted = parseLinkItems(param);
    if (!wanted.length) return;

    let cancelled = false;
    setFilling(true);
    api.getStore(username)
      .then((store: any) => {
        if (cancelled) return;
        const byId = new Map<string, any>((store?.products || []).map((p: any) => [p.id, p]));
        const items: CartItem[] = wanted.flatMap(({ productId, qty }) => {
          const p = byId.get(productId);
          if (!p) return [];
          const imgs = Array.isArray(p.images) ? p.images : (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })();
          return [{ productId: p.id, title: p.title, price: p.price, image: imgs[0], qty }];
        });
        if (items.length) applyLinkItems(username, items);
      })
      .catch(() => { /* bad link — just show whatever's already in the cart */ })
      .finally(() => {
        if (cancelled) return;
        setFilling(false);
        window.history.replaceState({}, '', `/s/${username}/cart`);
      });

    return () => { cancelled = true; };
  }, [username]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <AccountShell username={username} title="Your cart" requireAuth={false}>

        {filling ? (
          <p className="text-center text-[13px] text-faint">Adding the items from your link…</p>
        ) : cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-soft text-green-600"><Bag size={24} /></span>
            <p className="mt-3 font-display text-[16px] font-bold text-navy">Your cart is empty</p>
            <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((i) => (
                /*
                 * Two shapes for one row. On a phone the thumbnail, the stepper
                 * and "Remove" take ~270px between them, which left the product
                 * title about 80px — truncated to nothing on the one page where
                 * the shopper needs to see what they are buying. So below `sm`
                 * the controls drop to their own line under the title, and from
                 * `sm` up the original single row returns.
                 */
                <div key={i.productId + (i.size || '')} className="flex flex-wrap items-center gap-x-3 gap-y-3 rounded-xl border border-line bg-white p-3 sm:flex-nowrap">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-green-soft">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[14px] font-bold text-navy sm:truncate">{i.title}</div>
                    {i.size && <div className="text-[12px] text-muted">Size: {i.size}</div>}
                    <div className="text-[13px] font-bold text-navy">{rupees(i.price)}</div>
                  </div>
                  {/* Full width on its own line, so the two groups sit at the
                      outer edges instead of bunching in the middle. */}
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-1">
                      <button aria-label="Decrease quantity" onClick={() => updateQty(username, i.productId, i.size, i.qty - 1)} className="px-2 text-muted">−</button>
                      <span className="w-5 text-center text-[13px] font-bold">{i.qty}</span>
                      <button aria-label="Increase quantity" onClick={() => updateQty(username, i.productId, i.size, i.qty + 1)} className="px-2 text-muted">+</button>
                    </div>
                    <button onClick={() => updateQty(username, i.productId, i.size, 0)} className="px-1 text-[12px] font-semibold text-rose">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between text-[14px]"><span className="text-muted">Subtotal</span><span className="font-bold text-navy">{rupees(subtotal)}</span></div>
              <p className="mt-1 text-[12px] text-faint">Shipping calculated at checkout.</p>
              <Link href={`/s/${username}/checkout`} className="btn-green mt-4 w-full justify-center">Checkout <ArrowRight size={16} /></Link>
            </div>
          </>
        )}
    </AccountShell>
  );
}
