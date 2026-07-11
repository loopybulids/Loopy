'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { custApi, getCust } from '@/lib/customer';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import CustomerAuth from '@/components/store/CustomerAuth';
import { Heart } from '@/components/icons';

export default function WishlistPage() {
  const { username } = useParams<{ username: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const load = () => {
    if (!getCust(username)) { setSignedIn(false); setLoading(false); return; }
    setSignedIn(true);
    custApi.wishlist(username).then((w) => { setItems(w || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); window.addEventListener('cust-change', load); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id: string) => { await custApi.removeWishlist(username, id); setItems((it) => it.filter((p) => p.id !== id)); };

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[24px] font-extrabold text-navy">Wishlist</h1>

        {!signedIn ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-soft text-rose"><Heart size={24} /></span>
            <p className="mt-3 font-display text-[16px] font-bold text-navy">Sign in to see your wishlist</p>
            <button onClick={() => setAuthOpen(true)} className="btn-green mt-4 inline-flex">Sign in</button>
          </div>
        ) : loading ? <p className="mt-8 text-center text-muted">Loading…</p>
          : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
              <p className="font-display text-[16px] font-bold text-navy">No saved items yet</p>
              <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
                  <Link href={`/s/${username}/product/${p.id}`} className="block aspect-square bg-green-soft">{p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</Link>
                  <div className="p-3">
                    <Link href={`/s/${username}/product/${p.id}`} className="truncate block font-display text-[14px] font-bold text-navy hover:text-green-600">{p.title}</Link>
                    <div className="mt-0.5 font-display text-[15px] font-extrabold text-navy">{rupees(p.price)}</div>
                    <button onClick={() => remove(p.id)} className="mt-2 text-[12px] font-semibold text-rose hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      {authOpen && <CustomerAuth username={username} onClose={() => setAuthOpen(false)} onAuthed={() => { setAuthOpen(false); load(); }} />}
    </main>
  );
}
