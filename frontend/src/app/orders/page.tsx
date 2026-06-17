'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, rupees } from '@/lib/api';
import { useRequireRole } from '@/lib/useRequireRole';
import StoreNav from '@/components/StoreNav';

const CHIP: Record<string, string> = {
  Paid: 'chip-amber', Accepted: 'chip-navy', Shipped: 'chip-navy',
  Delivered: 'chip-green', Completed: 'chip-green', Disputed: 'chip-rose',
};

export default function MyOrders() {
  const { ready, role } = useRequireRole('buyer');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('loopy_orders') || '[]');
    Promise.all(ids.map((id) => api.getOrder(id).catch(() => null))).then((l) => { setOrders(l.filter(Boolean)); setLoading(false); });
  }, []);

  if (!ready || role !== 'buyer') return <main className="min-h-screen bg-paper" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[10%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav />
      <div className="mx-auto max-w-xl px-5 py-8">
        <h1 className="font-display text-[28px] font-extrabold text-navy">My <span className="vivid-text">orders</span></h1>
        {loading ? <div className="glass-card mt-5 rounded-3xl p-10 text-center text-muted">Loading…</div>
          : orders.length === 0 ? <div className="glass-card mt-5 rounded-3xl p-10 text-center text-muted">No orders yet.<div className="mt-3"><Link href="/shop" className="btn-green">Browse stores</Link></div></div>
          : <div className="mt-5 space-y-3">{orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="glass-card flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <div className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-paper shadow-card" />
                <div className="flex-1"><div className="text-sm font-bold text-navy">#{o.id.slice(-8).toUpperCase()}</div><div className="text-xs text-muted">{o.items.length} item(s) · {rupees(o.totalAmount)}</div></div>
                <span className={CHIP[o.status] || 'chip-navy'}>{o.status}</span>
              </Link>
            ))}</div>}
      </div>
    </main>
  );
}
