'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cart';
import { rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import { Shield } from '@/components/icons';

const COMMISSION = 0.05;
const SHIPPING = 60;

export default function CartPage() {
  const { items, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const sub = subtotal();
  const fee = Math.round(sub * COMMISSION);
  const total = sub + fee + (items.length ? SHIPPING : 0);

  return (
    <main className="min-h-screen bg-cream pb-28">
      <StoreNav />
      <div className="mx-auto max-w-xl px-5 py-6">
        <h1 className="font-serif text-[24px] font-semibold">Your bag</h1>

        {items.length === 0 ? (
          <div className="card mt-6 p-8 text-center text-muted">
            Your bag is empty.
            <div className="mt-4"><Link href="/s/riyathrifts" className="btn-pri">Browse the store</Link></div>
          </div>
        ) : (
          <>
            <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">From {items[0].storeName}</div>
            <div className="card mt-2 p-3">
              {items.map((i) => (
                <div key={i.productId} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <div className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-[#eee]">
                    {i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">{i.title}</div>
                    <div className="text-xs text-muted">{i.size} · {i.condition}</div>
                    <div className="mt-1 font-bold">{rupees(i.price)}</div>
                  </div>
                  <button onClick={() => remove(i.productId)} className="text-xs font-semibold text-coral">Remove</button>
                </div>
              ))}
            </div>

            <div className="card mt-4 p-4">
              <Row k="Subtotal" v={rupees(sub)} />
              <Row k="Shipping" v={rupees(SHIPPING)} />
              <Row k="Loopy fee (5%)" v={rupees(fee)} />
              <div className="my-3 border-t border-dashed border-line" />
              <div className="flex items-center justify-between"><span className="font-bold">Total</span><span className="font-serif text-[21px] font-semibold">{rupees(total)}</span></div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#D9D3F7] bg-indigo-soft px-3.5 py-3">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-white text-indigo"><Shield size={16} /></span>
              <p className="text-[11.5px] text-[#352c8f]">One-of-one items — held just for you for 10 min at checkout.</p>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white px-5 py-3">
          <div className="mx-auto max-w-xl">
            <Link href="/checkout" className="btn-pri w-full">Checkout · {rupees(total)}</Link>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between py-1 text-[13px]"><span className="text-muted">{k}</span><span className="font-bold">{v}</span></div>;
}
