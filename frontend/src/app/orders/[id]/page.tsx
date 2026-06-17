'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { useRequireRole } from '@/lib/useRequireRole';
import StoreNav from '@/components/StoreNav';
import { Bag, Check, Lock, Shield, ShieldLock, Truck } from '@/components/icons';

const STEPS = [
  { key: 'Paid', label: 'Order placed', sub: 'Payment held in escrow' },
  { key: 'Accepted', label: 'Accepted by seller', sub: 'Seller confirmed your order' },
  { key: 'Shipped', label: 'Shipped', sub: 'On the way to you' },
  { key: 'Delivered', label: 'Delivered', sub: 'Confirm to release payment' },
  { key: 'Completed', label: 'Released', sub: 'Seller paid out' },
];
const idx = (s: string) => STEPS.findIndex((x) => x.key === s);
const MINI = [{ key: 'Paid', label: 'PAID', icon: <Lock size={15} /> }, { key: 'Shipped', label: 'SHIPPING', icon: <Truck size={15} /> }, { key: 'Completed', label: 'RELEASED', icon: <Check size={15} /> }];

export default function OrderPage({ params }: { params: { id: string } }) {
  const { ready, role } = useRequireRole('buyer');
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState('');
  const router = useRouter();
  const load = () => api.getOrder(params.id).then(setO).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [params.id]);

  if (!ready || role !== 'buyer') return <main className="min-h-screen bg-paper" />;
  if (err) return <div className="grid min-h-screen place-items-center bg-paper text-muted">{err}</div>;
  if (!o) return <div className="grid min-h-screen place-items-center bg-paper text-muted">Loading…</div>;

  const reached = Math.max(0, idx(o.status));
  const miniReached = o.status === 'Completed' ? 2 : ['Shipped', 'Delivered'].includes(o.status) ? 1 : 0;
  const advance = async () => { await api.deliverOrder(o.id); load(); };
  const report = async () => { await api.disputeOrder(o.id, 'Not as described', 'Item not as described.'); load(); };

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav protect={false} />
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-mint text-green shadow-glow"><div className="grid h-12 w-12 place-items-center rounded-full bg-green text-white"><Check size={26} /></div></div>
          <h1 className="mt-4 font-display text-[30px] font-extrabold text-navy">Your purchase is <span className="vivid-text">protected.</span></h1>
          <p className="mt-1 text-muted">Order #{o.id.slice(-8).toUpperCase()} has been successfully placed.</p>
        </div>

        {/* escrow mini-stepper */}
        <div className="glass-card mt-8 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-green-soft text-green-600"><ShieldLock size={18} /></span>
            <div><div className="font-display text-[16px] font-bold text-navy">Secured with Loopy Escrow</div><p className="mt-1 text-[13px] leading-relaxed text-muted">Your money is safe with Loopy until you confirm delivery. We hold the funds and only release them to the seller once you've inspected your purchase.</p></div>
          </div>
          <div className="mt-6 flex items-center">
            {MINI.map((m, i) => (
              <div key={m.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span className={`grid h-11 w-11 place-items-center rounded-full ${i <= miniReached ? 'bg-green-600 text-white shadow' : 'border border-line bg-white/70 text-faint backdrop-blur'}`}>{m.icon}</span>
                  <span className={`mt-1.5 text-[11px] font-bold uppercase ${i <= miniReached ? 'text-green-600' : 'text-faint'}`}>{m.label}</span>
                </div>
                {i < MINI.length - 1 && <div className={`mb-5 h-[2px] flex-1 ${i < miniReached ? 'bg-green-600' : 'bg-line'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* detail timeline */}
        <div className="glass-card mt-5 rounded-3xl p-6">
          <h2 className="font-display text-[16px] font-bold text-navy">Tracking History</h2>
          <div className="mt-4">
            {STEPS.map((s, i) => {
              const done = i <= reached && o.status !== 'Disputed';
              const now = i === reached && o.status !== 'Disputed';
              return (
                <div key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < STEPS.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? 'bg-green-600' : 'bg-line'}`} />}
                  <span className={`z-10 grid h-[23px] w-[23px] flex-none place-items-center rounded-full ${done ? 'bg-green-600 text-white' : now ? 'bg-navy text-white' : 'border-2 border-line bg-white'}`}>{done && <Check size={13} />}</span>
                  <div><div className={`text-[13.5px] font-bold ${!done && !now ? 'text-faint' : 'text-navy'}`}>{s.label}</div><div className="text-[11.5px] text-muted">{s.sub}</div></div>
                </div>
              );
            })}
          </div>
          {o.awbNumber && <div className="mt-2 flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-[12px]"><span className="text-muted">TRK: <b className="text-navy">{o.awbNumber}</b></span><span className="font-semibold text-green-600">Copy</span></div>}
        </div>

        {/* summary */}
        <div className="glass-card mt-5 rounded-3xl p-5">
          <h2 className="font-display text-[15px] font-bold text-navy">Order Summary</h2>
          <div className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><span className="text-muted">Items ({o.items.length})</span><span className="font-bold text-navy">{rupees(o.itemsAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="font-bold text-navy">{rupees(o.shippingCharge)}</span></div>
            <div className="flex justify-between"><span className="text-green">Protection Fee</span><span className="font-bold text-navy">{rupees(o.commissionAmount)}</span></div>
            <div className="my-2 border-t border-line" />
            <div className="flex justify-between"><span className="font-bold text-navy">Total Held</span><span className="font-display text-[17px] font-extrabold text-navy">{rupees(o.totalAmount)}</span></div>
          </div>
        </div>

        {/* actions */}
        <div className="mt-5 space-y-2">
          {['Paid', 'Accepted'].includes(o.status) && <p className="text-center text-xs text-muted">Waiting for the seller to ship. (Demo: ship from the seller dashboard.)</p>}
          {o.status === 'Shipped' && <button onClick={advance} className="btn-navy w-full">Mark as delivered (demo)</button>}
          {o.status === 'Delivered' && (<><Link href={`/orders/${o.id}/review`} className="btn-green w-full">Mark as Received & Rate</Link><button onClick={report} className="btn-ghost w-full !text-rose">⚠ Report Issue</button></>)}
          {o.status === 'Completed' && <div className="glass-card rounded-2xl p-4 text-center text-sm font-semibold text-green"><Check size={16} className="mr-1 inline" /> Delivery confirmed — payment released to the seller.</div>}
          {o.status === 'Disputed' && <div className="glass-card rounded-2xl border-rose/30 p-4 text-center text-sm text-rose">⚠ A dispute is open. Loopy ops will resolve it shortly.</div>}
          <div className="flex gap-2"><Link href="/orders" className="btn-ghost flex-1">My orders</Link><Link href="/shop" className="btn-ghost flex-1">Continue shopping</Link></div>
        </div>
      </div>
    </main>
  );
}
