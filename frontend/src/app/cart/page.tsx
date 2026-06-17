'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cart';
import { rupees } from '@/lib/api';
import { useRequireRole } from '@/lib/useRequireRole';
import StoreNav from '@/components/StoreNav';
import { ShieldLock } from '@/components/icons';
import { Reveal } from '@/components/motion';

const COMMISSION = 0.05;
const SHIPPING = 60;

export default function CartPage() {
  const { ready, role } = useRequireRole('buyer');
  const { items, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!ready || role !== 'buyer') return <main className="min-h-screen bg-paper" />;
  if (!mounted) return null;

  const sub = subtotal();
  const fee = Math.round(sub * COMMISSION);
  const total = sub + fee + (items.length ? SHIPPING : 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[10%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav />
      <div className="mx-auto max-w-xl px-5 py-8">
        <h1 className="font-display text-[28px] font-extrabold text-navy">Your <span className="vivid-text">bag</span></h1>
        {items.length === 0 ? (
          <div className="glass-card mt-6 rounded-3xl p-10 text-center text-muted">Your bag is empty.<div className="mt-4"><Link href="/shop" className="btn-green">Browse stores</Link></div></div>
        ) : (
          <Reveal>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">From {items[0].storeName}</div>
            <div className="glass-card mt-2 rounded-3xl p-3">
              {items.map((i) => (
                <div key={i.productId} className="flex items-center gap-3 border-b border-white/40 py-3 last:border-0">
                  <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-paper shadow-card">
                    {i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-navy">{i.title}</div>
                    <div className="text-xs text-muted">{i.size} · {i.condition}</div>
                    <div className="mt-1 font-bold text-navy">{rupees(i.price)}</div>
                  </div>
                  <button onClick={() => remove(i.productId)} className="text-xs font-semibold text-rose transition-colors hover:brightness-110">Remove</button>
                </div>
              ))}
            </div>
            <div className="glass-card mt-4 rounded-3xl p-5">
              <Row k="Items subtotal" v={rupees(sub)} />
              <Row k="Delivery" v={rupees(SHIPPING)} />
              <Row k="Loopy Protection Fee" v={rupees(fee)} accent />
              <div className="my-3 border-t border-dashed border-line" />
              <div className="flex items-center justify-between"><span className="font-bold text-navy">Order Total</span><span className="font-display text-[22px] font-extrabold text-navy">{rupees(total)}</span></div>
            </div>
            <div className="glass-card mt-4 flex items-start gap-3 rounded-2xl p-4">
              <ShieldLock size={20} className="mt-0.5 flex-none text-green-600" />
              <p className="text-[12.5px] text-green"><b>Secured Escrow Payment.</b> Money is released to the seller only after you receive the order. Funds are held in Loopy's trust-protected vault until delivery is confirmed.</p>
            </div>
          </Reveal>
        )}
      </div>
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-white/40 bg-white/70 px-5 py-3 backdrop-blur-xl">
          <div className="mx-auto max-w-xl"><Link href="/checkout" className="btn-green w-full">Proceed to secure checkout · {rupees(total)}</Link></div>
        </div>
      )}
    </main>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return <div className="flex items-center justify-between py-1 text-[13px]"><span className={accent ? 'text-green font-semibold' : 'text-muted'}>{k}</span><span className="font-bold text-navy">{v}</span></div>;
}
