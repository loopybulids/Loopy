'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { custApi, getCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import { storeHref } from '@/lib/store-url';

export default function WishlistPage() {
  const { username } = useParams<{ username: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AccountShell owns the signed-out state, so this only handles the data.
  const load = () => {
    if (!getCust(username)) { setLoading(false); return; }
    custApi.wishlist(username)
      .then((w: any[]) => setItems(w || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); window.addEventListener('cust-change', load); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id: string) => {
    await custApi.removeWishlist(username, id);
    setItems((it) => it.filter((p) => p.id !== id));
  };

  return (
    <AccountShell username={username} title="Wishlist">
      {loading ? (
        <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <p className="font-display text-[16px] font-bold text-navy">No saved items yet</p>
          <p className="mt-1 text-[13px] text-muted">Tap the heart on any product to save it here.</p>
          <Link href={storeHref(username)} className="btn-green mt-4 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <Link href={storeHref(username, `/product/${p.id}`)} className="block aspect-square bg-green-soft">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="p-3">
                <Link href={storeHref(username, `/product/${p.id}`)} className="block truncate font-display text-[14px] font-bold text-navy hover:text-green-600">{p.title}</Link>
                <div className="mt-0.5 font-display text-[15px] font-bold text-navy">{rupees(p.price)}</div>
                <button onClick={() => remove(p.id)} className="mt-2 text-[12px] font-semibold text-rose hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
