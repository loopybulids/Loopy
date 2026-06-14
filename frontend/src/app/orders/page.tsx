'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';

const CHIP: Record<string, string> = {
  Paid: 'bg-amber-soft text-[#9a6406]', Accepted: 'bg-indigo-soft text-indigo',
  Shipped: 'bg-indigo-soft text-indigo', Delivered: 'bg-trust-soft text-[#157a4b]',
  Completed: 'bg-trust-soft text-[#157a4b]', Disputed: 'bg-coral-soft text-[#c8463a]',
};

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('loopy_orders') || '[]');
    Promise.all(ids.map((id) => api.getOrder(id).catch(() => null)))
      .then((list) => { setOrders(list.filter(Boolean)); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-cream">
      <StoreNav />
      <div className="mx-auto max-w-xl px-5 py-6">
        <h1 className="font-serif text-[24px] font-semibold">My orders</h1>
        {loading ? (
          <div className="card mt-4 p-8 text-center text-muted">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-muted">
            No orders yet.<div className="mt-3"><Link href="/s/riyathrifts" className="btn-pri">Browse the store</Link></div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center gap-3 p-4">
                <div className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-paper" />
                <div className="flex-1">
                  <div className="text-sm font-bold">#{o.id.slice(-6).toUpperCase()}</div>
                  <div className="text-xs text-muted">{o.items.length} item(s) · {rupees(o.totalAmount)}</div>
                </div>
                <span className={`chip ${CHIP[o.status] || 'bg-[#F0EEF4] text-muted'}`}>{o.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
