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
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const cancel = async (id: string) => {
    setErr('');
    setCancelling(id);
    try {
      const updated = await custApi.cancelOrder(username, id);
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      setConfirming(null);
    } catch (e: any) {
      setErr(e?.message || 'Could not cancel this order.');
    } finally {
      setCancelling(null);
    }
  };

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

              {o.status !== 'Cancelled' && (
                <div className="mt-4 border-t border-line pt-3.5">
                  {confirming === o.id ? (
                    <div className="rounded-xl border border-rose/30 bg-rose-soft/40 p-3.5">
                      <p className="text-[12.5px] font-semibold text-navy">
                        Cancel this order? The seller will be notified straight away.
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => cancel(o.id)}
                          disabled={cancelling === o.id}
                          className="rounded-lg bg-rose px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {cancelling === o.id ? 'Cancelling…' : 'Yes, cancel order'}
                        </button>
                        <button onClick={() => { setConfirming(null); setErr(''); }} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted hover:text-navy">
                          Keep order
                        </button>
                      </div>
                      {err && <p className="mt-2 text-[13px] font-semibold text-rose">{err}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirming(o.id); setErr(''); }}
                      className="text-[12.5px] font-semibold text-rose hover:underline"
                    >
                      Cancel this order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
