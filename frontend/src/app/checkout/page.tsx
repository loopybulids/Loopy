'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { api, rupees } from '@/lib/api';
import { useRequireRole } from '@/lib/useRequireRole';
import StoreNav from '@/components/StoreNav';
import { Check, Lock, ShieldLock, Truck } from '@/components/icons';

const COMMISSION = 0.05;
const SHIPPING = 60;
const METHODS = [
  { id: 'gpay', name: 'Google Pay', emoji: '🟢' },
  { id: 'phonepe', name: 'PhonePe', emoji: '🟣' },
  { id: 'paytm', name: 'Paytm', emoji: '🔵' },
];

export default function CheckoutPage() {
  const { ready, role } = useRequireRole('buyer');
  const { items, subtotal, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState('gpay');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  if (!ready || role !== 'buyer') return <main className="min-h-screen bg-paper" />;
  if (!mounted) return null;

  const sub = subtotal();
  const fee = Math.round(sub * COMMISSION);
  const total = sub + fee + SHIPPING;

  if (items.length === 0) return <main className="grid min-h-screen place-items-center bg-paper text-muted">Your bag is empty.</main>;

  const pay = async () => {
    setBusy(true);
    try {
      const order = await api.checkout({ items: items.map((i) => ({ productId: i.productId, quantity: 1 })), buyerName: 'Aman Sharma', buyerPhone: '9876500210', address: '14, Linking Road, Bandra West, Mumbai 400050' });
      await api.confirmPayment(order.id);
      const prev = JSON.parse(localStorage.getItem('loopy_orders') || '[]');
      localStorage.setItem('loopy_orders', JSON.stringify([order.id, ...prev]));
      clear();
      router.push(`/orders/${order.id}?placed=1`);
    } catch (e: any) { alert(e.message); setBusy(false); }
  };

  const steps = [{ t: 'Ordered', done: true }, { t: 'Seller Ships' }, { t: 'Transit' }, { t: 'Delivered' }];

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav protect={false} />
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px]">
        <div>
          {/* delivery timeline */}
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-navy">Delivery Timeline</h2>
              <span className="chip-green"><Truck size={12} /> EST. 3–5 DAYS</span>
            </div>
            <div className="mt-5 flex items-center">
              {steps.map((s, i) => (
                <div key={s.t} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-9 w-9 place-items-center rounded-full ${s.done ? 'bg-green-600 text-white shadow' : 'border border-line bg-white/70 text-faint backdrop-blur'}`}>{s.done ? <Check size={16} /> : i + 1}</span>
                    <span className="mt-1.5 w-16 text-center text-[10.5px] font-semibold text-muted">{s.t}</span>
                  </div>
                  {i < steps.length - 1 && <div className="mb-5 h-[2px] flex-1 bg-line" />}
                </div>
              ))}
            </div>
          </div>

          <h2 className="mt-7 font-display text-[18px] font-bold text-navy">Choose Payment Method</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`glass-card flex flex-col items-center gap-2 rounded-2xl p-5 transition-all ${method === m.id ? 'ring-2 ring-green-600' : 'hover:-translate-y-0.5'}`}>
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[13px] font-semibold text-navy">{m.name}</span>
              </button>
            ))}
          </div>
          <div className="glass-card mt-3 flex items-center gap-3 rounded-2xl p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-paper">💳</span>
            <div className="flex-1"><div className="text-[13px] font-bold text-navy">Other Methods</div><div className="text-[11px] text-muted">Cards, Netbanking, etc.</div></div>
            <span className="text-muted">›</span>
          </div>

          <div className="glass-card mt-4 flex items-start gap-3 rounded-2xl p-4">
            <ShieldLock size={22} className="mt-0.5 flex-none text-green-600" />
            <div><div className="text-[13.5px] font-bold text-green">Secured Escrow Payment</div><p className="mt-0.5 text-[12.5px] text-green/90">Money will be released to the seller only after you receive the order. Your funds are held safely in Loopy's trust-protected vault until delivery is confirmed.</p></div>
          </div>
        </div>

        {/* summary */}
        <div>
          <div className="glass-card sticky top-24 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-navy">Order Summary</h2>
              <span className="chip-green">PROTECTED</span>
            </div>
            <div className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-muted">Items ({items.length})</span><span className="font-bold text-navy">{rupees(sub)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="font-bold text-green">FREE</span></div>
              <div className="flex justify-between"><span className="text-muted">Loopy Protection Fee</span><span className="font-bold text-navy">{rupees(fee)}</span></div>
            </div>
            <div className="my-4 border-t border-line" />
            <div className="flex items-center justify-between"><span className="font-bold text-navy">Order Total</span><span className="font-display text-[22px] font-extrabold text-navy">{rupees(total)}</span></div>
            <button disabled={busy} onClick={pay} className="btn-green mt-4 w-full disabled:opacity-60"><Lock size={16} /> {busy ? 'Securing…' : 'Pay & Secure Order'}</button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-green"><Check size={13} /> LOOPY VERIFIED INTEGRITY</div>
          </div>
        </div>
      </div>
    </main>
  );
}
