'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { getCart, updateQty, type CartItem } from '@/lib/customer';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import { Bag, ArrowRight } from '@/components/icons';

export default function CartPage() {
  const { username } = useParams<{ username: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);

  const sync = () => setCart(getCart(username));
  useEffect(() => { sync(); window.addEventListener('cart-change', sync); return () => window.removeEventListener('cart-change', sync); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[24px] font-extrabold text-navy">Your cart</h1>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-soft text-green-600"><Bag size={24} /></span>
            <p className="mt-3 font-display text-[16px] font-bold text-navy">Your cart is empty</p>
            <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {cart.map((i) => (
                <div key={i.productId + (i.size || '')} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-green-soft">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14px] font-bold text-navy">{i.title}</div>
                    {i.size && <div className="text-[12px] text-muted">Size: {i.size}</div>}
                    <div className="text-[13px] font-bold text-navy">{rupees(i.price)}</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-1">
                    <button onClick={() => updateQty(username, i.productId, i.size, i.qty - 1)} className="px-1.5 text-muted">−</button>
                    <span className="w-5 text-center text-[13px] font-bold">{i.qty}</span>
                    <button onClick={() => updateQty(username, i.productId, i.size, i.qty + 1)} className="px-1.5 text-muted">+</button>
                  </div>
                  <button onClick={() => updateQty(username, i.productId, i.size, 0)} className="px-1 text-[12px] font-semibold text-rose">Remove</button>
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
      </div>
    </main>
  );
}
