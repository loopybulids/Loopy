'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { Back, Check } from '@/components/icons';

const STEPS = [
  { key: 'Paid', label: 'Order placed', sub: 'Payment held in escrow' },
  { key: 'Accepted', label: 'Accepted by seller', sub: 'Seller confirmed your order' },
  { key: 'Shipped', label: 'Shipped', sub: 'On the way to you' },
  { key: 'Delivered', label: 'Delivered', sub: 'Confirm to release payment' },
  { key: 'Completed', label: 'Completed', sub: 'Seller paid out' },
];
const order_index = (s: string) => STEPS.findIndex((x) => x.key === s);

export default function OrderPage({ params }: { params: { id: string } }) {
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState('');
  const router = useRouter();

  const load = () => api.getOrder(params.id).then(setO).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [params.id]);

  if (err) return <div className="grid min-h-screen place-items-center text-muted">{err}</div>;
  if (!o) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;

  const reached = Math.max(0, order_index(o.status));
  const disputed = o.status === 'Disputed';

  const advance = async () => { await api.deliverOrder(o.id); load(); };
  const report = async () => {
    await api.disputeOrder(o.id, 'Not as described', 'Item not as described.');
    load();
  };

  return (
    <main className="min-h-screen bg-cream px-5 py-6">
      <div className="mx-auto max-w-md">
        <button onClick={() => router.push('/orders')} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted"><Back size={16} /> My orders</button>

        {/* success banner */}
        <div className="card p-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-[#27ad6f] to-[#1e9e63] text-white shadow-[0_0_0_10px_#E4F5EC]"><Check size={30} /></div>
          <h1 className="mt-3 font-serif text-[21px] font-semibold">Order #{o.id.slice(-6).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted">{o.items.length} item(s) · {rupees(o.totalAmount)} held in escrow</p>
          {o.awbNumber && <p className="mt-1 text-xs text-muted">AWB {o.awbNumber}</p>}
        </div>

        {/* timeline */}
        <div className="card mt-4 p-5">
          {STEPS.map((s, i) => {
            const done = i <= reached && !disputed;
            const now = i === reached && !disputed;
            return (
              <div key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STEPS.length - 1 && <span className={`absolute left-[10px] top-6 h-full w-0.5 ${done ? 'bg-trust' : 'bg-line'}`} />}
                <span className={`z-10 grid h-[22px] w-[22px] flex-none place-items-center rounded-full ${done ? 'bg-trust text-white' : now ? 'bg-indigo text-white ring-4 ring-indigo-soft' : 'border-2 border-line bg-white'}`}>
                  {done && <Check size={12} />}
                </span>
                <div>
                  <div className={`text-[13px] font-bold ${!done && !now ? 'text-faint' : ''}`}>{s.label}</div>
                  <div className="text-[11px] text-muted">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {disputed && (
          <div className="card mt-4 border-coral/40 p-4 text-center text-sm text-coral">⚠️ A dispute is open. Our ops team will resolve it shortly.</div>
        )}

        {/* contextual actions */}
        <div className="mt-4 space-y-2">
          {['Paid', 'Accepted'].includes(o.status) && (
            <p className="text-center text-xs text-muted">Waiting for the seller to ship. (Demo: the seller ships from their dashboard.)</p>
          )}
          {o.status === 'Shipped' && (
            <button onClick={advance} className="btn-pri w-full">Mark as delivered (demo)</button>
          )}
          {o.status === 'Delivered' && (
            <>
              <Link href={`/orders/${o.id}/review`} className="btn-grn w-full">★ Confirm delivery &amp; rate</Link>
              <button onClick={report} className="btn-gh w-full">⚠️ Report a problem</button>
            </>
          )}
          {o.status === 'Completed' && (
            <div className="card p-4 text-center text-sm text-trust">✓ Delivery confirmed — payment released to the seller.</div>
          )}
          <Link href="/s/riyathrifts" className="btn-gh w-full">Keep shopping</Link>
        </div>
      </div>
    </main>
  );
}
