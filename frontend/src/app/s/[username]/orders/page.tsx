'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { custApi, getCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import OrderDetail from '@/components/store/OrderDetail';

export default function TrackOrders() {
  const { username } = useParams<{ username: string }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AccountShell owns the signed-out state, so this only handles the data.
  const load = () => {
    if (!getCust(username)) { setLoading(false); return; }
    setLoading(true);
    custApi.orders(username)
      .then((o: any[]) => setOrders(o || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    window.addEventListener('cust-change', load);
    return () => window.removeEventListener('cust-change', load);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AccountShell username={username} title="My orders">
      {loading ? (
        <p className="py-8 text-center text-[13px] text-faint">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <p className="font-display text-[16px] font-bold text-navy">No orders yet</p>
          <p className="mt-1 text-[13px] text-muted">When you place an order, it&apos;ll show up here.</p>
          <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <OrderDetail order={o} />
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
