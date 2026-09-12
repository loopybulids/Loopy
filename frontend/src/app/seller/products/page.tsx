'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';
import { useRequireRole } from '@/lib/useRequireRole';
import { Plus, Shield } from '@/components/icons';

export default function SellerProducts() {
  const { ready, role } = useRequireRole('seller');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!ready || role !== 'seller') return;
    api.myProducts().then((p) => { setProducts(p); setLoading(false); }).catch(() => router.push('/seller/login'));
  }, [ready, role]);

  if (!ready || role !== 'seller') return <main className="seller-bg min-h-screen" />;

  return (
    <main className="seller-bg min-h-screen pb-12">
      <SellerNav />
      <div className="relative">
        <div className="seller-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <div className="flex items-center justify-between animate-riseIn">
            <div>
              <h1 className="font-display text-[26px] font-bold tracking-tight text-white">Products</h1>
              <p className="text-[14px] s-muted">Your live catalogue.</p>
            </div>
            <Link href="/seller/list" className="s-btn !px-4 !py-2.5 text-[13px]"><Plus size={15} /> List Item</Link>
          </div>
          {loading ? <div className="s-card mt-6 p-10 text-center text-[13px] s-muted">Loading…</div>
            : products.length === 0 ? <div className="s-card mt-6 p-10 text-center text-[13px] s-muted">No products yet. <Link href="/seller/list" className="font-semibold text-green-500">List your first item</Link>.</div>
            : <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <div key={p.id} className="s-card overflow-hidden">
                    <div className="relative aspect-[4/5] bg-[#0E2236]">
                      {p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-green-500/90 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-[#07140A]"><Shield size={10} /> Protected</span>
                      {p.quantity < 1 && <span className="absolute inset-0 grid place-items-center bg-[#0A1828]/70 text-[10px] font-bold uppercase tracking-widest text-white">Sold</span>}
                    </div>
                    <div className="p-3"><div className="text-[13px] font-bold text-white">{p.title}</div><div className="mt-0.5 flex items-center justify-between text-xs"><span className="font-display font-bold text-white">{rupees(p.price)}</span><span className="text-[#8A98AD]">{p.quantity} in stock</span></div></div>
                  </div>
                ))}
              </div>}
        </div>
      </div>
    </main>
  );
}
