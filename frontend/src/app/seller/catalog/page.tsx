'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Plus, Tag } from '@/components/icons';

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myProducts().then((p) => { setProducts(p || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHead
        title="Products"
        sub="Your catalog — everything you can drop into a checkout link."
        action={<Link href="/seller/products/new" className="btn-green"><Plus size={15} /> Add product</Link>}
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : products.length === 0 ? (
          <Empty
            icon={<Tag size={24} />}
            title="No products yet"
            hint="Add your first product and it goes live on your storefront instantly."
            action={<Link href="/seller/products/new" className="btn-green"><Plus size={15} /> Add your first product</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-faint">
                  <th className="pb-3 font-bold">Product</th>
                  <th className="pb-3 font-bold">Price</th>
                  <th className="pb-3 font-bold">Stock</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const qty = p.quantity ?? 0;
                  const low = qty > 0 && qty <= 5;
                  return (
                    <tr key={p.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-green-soft">
                            {firstImage(p) && <img src={firstImage(p)!} alt="" className="h-full w-full object-cover" />}
                          </span>
                          <span className="font-display font-bold text-navy">{p.title || p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-navy">{money(p.price)}</td>
                      <td className="py-3">
                        {qty <= 0
                          ? <span className="chip-rose">Out of stock</span>
                          : <span className={low ? 'font-semibold text-amber' : 'text-muted'}>{low ? `🔥 ${qty} left` : `${qty} in stock`}</span>}
                      </td>
                      <td className="py-3"><span className={qty > 0 ? 'chip-green' : 'chip-navy'}>{qty > 0 ? 'Live' : 'Sold out'}</span></td>
                      <td className="py-3 text-right">
                        <Link href={`/seller/catalog/${p.id}/edit`} className="text-[13px] font-bold text-green-600 hover:underline">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function firstImage(p: any): string | null {
  try {
    if (Array.isArray(p.images)) return p.images[0] || null;
    if (typeof p.images === 'string') return JSON.parse(p.images)[0] || null;
  } catch { /* ignore */ }
  return p.image || null;
}
