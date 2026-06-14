'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';

const STATUS_CHIP: Record<string, string> = {
  PendingPayment: 'bg-[#F0EEF4] text-muted',
  Paid: 'bg-amber-soft text-[#9a6406]',
  Accepted: 'bg-indigo-soft text-indigo',
  Shipped: 'bg-trust-soft text-[#157a4b]',
  Delivered: 'bg-trust-soft text-[#157a4b]',
};

export default function SellerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = () => {
    setLoading(true);
    api.myOrders().then((o) => { setOrders(o); setLoading(false); })
      .catch((e) => {
        if (String(e.message).includes('401')) router.push('/seller/login');
        else { setErr(e.message); setLoading(false); }
      });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('loopy_token')) {
      router.push('/seller/login');
      return;
    }
    load();
  }, []);

  const act = async (id: string, kind: 'accept' | 'ship') => {
    try {
      kind === 'accept' ? await api.acceptOrder(id) : await api.shipOrder(id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const paidOrders = orders.filter((o) => o.status !== 'PendingPayment');
  const held = paidOrders.filter((o) => ['Paid', 'Accepted', 'Shipped'].includes(o.status))
    .reduce((s, o) => s + o.itemsAmount, 0);
  const toAccept = orders.filter((o) => o.status === 'Paid').length;

  return (
    <main className="min-h-screen bg-paper">
      <SellerNav />

      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="font-serif text-[24px] font-semibold">Hey, Riya 👋</h1>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5246C9] via-indigo-2 to-[#8a6cf0] p-4 text-white sm:col-span-1">
            <div className="text-[11px] opacity-85">Held in escrow</div>
            <div className="font-serif text-[26px] font-semibold">{rupees(held)}</div>
          </div>
          <div className="card p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-muted">Paid orders</div><div className="font-serif text-[26px] font-semibold">{paidOrders.length}</div></div>
          <div className="card p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-muted">To accept</div><div className="font-serif text-[26px] font-semibold text-amber">{toAccept}</div></div>
        </div>

        <div className="mt-6 flex items-center"><h2 className="font-bold">Orders</h2>
          <Link href="/s/riyathrifts" className="ml-auto text-sm font-semibold text-indigo">View store →</Link>
        </div>

        {loading ? (
          <div className="card mt-3 p-8 text-center text-muted">Loading orders…</div>
        ) : err ? (
          <div className="card mt-3 p-6 text-center text-coral">{err}</div>
        ) : orders.length === 0 ? (
          <div className="card mt-3 p-8 text-center text-muted">
            No orders yet. Place one as a buyer first —
            <Link href="/s/riyathrifts" className="font-semibold text-indigo"> open the store</Link>, add an item, and check out.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">#{o.id.slice(-6).toUpperCase()}</span>
                  <span className={`chip ${STATUS_CHIP[o.status] || 'bg-[#F0EEF4] text-muted'}`}>{o.status}</span>
                </div>
                <div className="mt-2 text-xs text-muted">{o.buyerName || 'Buyer'} · {o.items.length} item(s) · {rupees(o.totalAmount)}</div>
                <div className="mt-1 text-[13px] font-semibold">{o.items.map((i: any) => i.title).join(', ')}</div>
                {o.awbNumber && <div className="mt-1 text-xs text-muted">AWB {o.awbNumber}</div>}

                {o.status === 'Paid' && (
                  <button onClick={() => act(o.id, 'accept')} className="btn-pri mt-3 w-full !py-2.5 !text-[13px]">Accept order</button>
                )}
                {o.status === 'Accepted' && (
                  <button onClick={() => act(o.id, 'ship')} className="btn-grn mt-3 w-full !py-2.5 !text-[13px]">📦 Create shipment & print label</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
