'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHead, Panel, money } from '@/components/seller-ui';
import { Plus } from '@/components/icons';

type Line = { productId: string; quantity: number };

export default function ManualOrder() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [cust, setCust] = useState({ buyerName: '', buyerPhone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.myProducts().then((p) => {
      setProducts(p || []);
      if (p?.[0]) setLines([{ productId: p[0].id, quantity: 1 }]);
    }).catch(() => {});
  }, []);

  const priceOf = (id: string) => products.find((p) => p.id === id)?.price || 0;
  const itemsTotal = lines.reduce((s, l) => s + priceOf(l.productId) * l.quantity, 0);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLine = () => products[0] && setLines((ls) => [...ls, { productId: products[0].id, quantity: 1 }]);
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, j) => j !== i));

  const submit = async () => {
    setErr('');
    if (!lines.length) return setErr('Add at least one item.');
    if (!cust.buyerName) return setErr('Enter the customer name.');
    setBusy(true);
    try {
      await api.createManualOrder({ items: lines, ...cust });
      router.push('/seller/orders');
    } catch (e: any) { setErr(e?.message || 'Could not create order.'); setBusy(false); }
  };

  if (!products.length) {
    return (
      <div>
        <PageHead title="New order" sub="Record a sale manually." />
        <Panel><p className="py-8 text-center text-[13px] text-muted">Add a product first — <Link href="/seller/products/new" className="font-bold text-green-600 hover:underline">add product</Link>.</p></Panel>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHead title="New order" sub="Record a sale (e.g. from a DM). Stock updates automatically." action={<Link href="/seller/orders" className="btn-ghost px-3 py-2 text-[13px]">← Back</Link>} />

      <Panel title="Items" className="mb-6">
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value })} className="c-input flex-1">
                {products.map((p) => <option key={p.id} value={p.id}>{p.title} — {money(p.price)} ({p.quantity ?? 0} left)</option>)}
              </select>
              <input type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="c-input w-20 text-center" />
              {lines.length > 1 && <button onClick={() => removeLine(i)} className="px-2 text-rose">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addLine} className="btn-ghost mt-3 py-2 text-[13px]"><Plus size={14} /> Add item</button>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-green-soft px-4 py-3">
          <span className="text-[13px] font-semibold text-navy/80">Items total</span>
          <span className="font-display text-[18px] font-extrabold text-green-600">{money(itemsTotal)}</span>
        </div>
      </Panel>

      <Panel title="Customer">
        <Field label="Name" value={cust.buyerName} onChange={(v) => setCust((c) => ({ ...c, buyerName: v }))} />
        <Field label="Phone" value={cust.buyerPhone} onChange={(v) => setCust((c) => ({ ...c, buyerPhone: v }))} />
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Delivery address</label>
          <textarea value={cust.address} onChange={(e) => setCust((c) => ({ ...c, address: e.target.value }))} rows={2} className="c-input mt-1.5" />
        </div>
        {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
        <button onClick={submit} disabled={busy} className="btn-green mt-5 w-full justify-center disabled:opacity-60">{busy ? 'Creating…' : 'Create order'}</button>
      </Panel>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="c-input mt-1.5" />
    </div>
  );
}
