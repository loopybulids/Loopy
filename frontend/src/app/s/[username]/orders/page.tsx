'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { custApi, getCust } from '@/lib/customer';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import CustomerAuth from '@/components/store/CustomerAuth';
import OrderDetail from '@/components/store/OrderDetail';
import { ShieldLock } from '@/components/icons';

export default function TrackOrders() {
  const { username } = useParams<{ username: string }>();
  const [signedIn, setSignedIn] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const load = () => {
    if (!getCust(username)) { setSignedIn(false); setLoading(false); return; }
    setSignedIn(true);
    setLoading(true);
    custApi.orders(username).then((o) => { setOrders(o || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => {
    load();
    window.addEventListener('cust-change', load);
    return () => window.removeEventListener('cust-change', load);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[24px] font-extrabold text-navy">Track your orders</h1>

        {!signedIn ? (
          /* login prompt card */
          <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-soft text-green-600"><ShieldLock size={26} /></span>
            <h2 className="mt-4 font-display text-[18px] font-extrabold text-navy">Sign in to view your orders</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-muted">Sign in to track your orders, see delivery status and view your order history for this store.</p>
            <button onClick={() => setAuthOpen(true)} className="btn-green mt-5 inline-flex">Sign in to continue</button>
            <p className="mt-4 text-[12.5px] text-muted">Want to keep shopping? <Link href={`/s/${username}`} className="font-bold text-green-600 hover:underline">Back to store</Link></p>
          </div>
        ) : loading ? (
          <p className="mt-8 text-center text-[13px] text-faint">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <p className="font-display text-[16px] font-bold text-navy">No orders yet</p>
            <p className="mt-1 text-[13px] text-muted">When you place an order, it’ll show up here.</p>
            <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <OrderDetail order={o} />
              </div>
            ))}
          </div>
        )}
      </div>
      {authOpen && <CustomerAuth username={username} onClose={() => setAuthOpen(false)} onAuthed={() => { setAuthOpen(false); load(); }} />}
    </main>
  );
}
