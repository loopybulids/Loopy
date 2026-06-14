'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('loopy_token')) { router.push('/seller/login'); return; }
    api.myProducts().then((p) => { setProducts(p); setLoading(false); })
      .catch(() => { router.push('/seller/login'); });
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <SellerNav />
      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="flex items-center">
          <h1 className="font-serif text-[24px] font-semibold">Products</h1>
          <Link href="/seller/products/new" className="btn-pri ml-auto !px-4 !py-2.5 !text-sm">+ Add product</Link>
        </div>
        {loading ? (
          <div className="card mt-4 p-8 text-center text-muted">Loading…</div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <div className="relative aspect-[4/5] bg-gradient-to-br from-[#C9BCFF] to-[#7B61FF]">
                  {p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  {p.quantity < 1 && <span className="absolute inset-0 grid place-items-center bg-black/40 text-xs font-bold uppercase tracking-widest text-white">Sold</span>}
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-bold">{p.title}</div>
                  <div className="mt-0.5 flex items-center justify-between text-xs">
                    <span className="font-bold">{rupees(p.price)}</span>
                    <span className="text-muted">{p.quantity} in stock</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
