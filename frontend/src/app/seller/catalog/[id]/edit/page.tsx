'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel } from '@/components/seller-ui';
import MediaInput from '@/components/MediaInput';

const CONDITIONS = ['Brand New', 'Like new', 'Good', 'Fair'];

function firstImage(p: any): string {
  try {
    if (Array.isArray(p.images)) return p.images[0] || '';
    if (typeof p.images === 'string') return JSON.parse(p.images)[0] || '';
  } catch { /* ignore */ }
  return '';
}

export default function EditProduct() {
  const id = useParams().id as string;
  const router = useRouter();
  const [f, setF] = useState({ title: '', price: '', condition: 'Good', category: '', description: '', image: '', quantity: '1' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    api.getProduct(id).then((p) => {
      setF({
        title: p.title || '', price: String(p.price ?? ''), condition: p.condition || 'Good',
        category: p.category || '', description: p.description || '', image: firstImage(p),
        quantity: String(p.quantity ?? 1),
      });
      setLoading(false);
    }).catch(() => { setErr('Could not load product.'); setLoading(false); });
  }, [id]);

  const save = async () => {
    setErr('');
    if (!f.title || !f.price) { setErr('Add a title and price.'); return; }
    setBusy(true);
    try {
      await api.updateProduct(id, {
        title: f.title, price: Number(f.price), condition: f.condition, category: f.category,
        description: f.description, images: f.image ? [f.image] : [], quantity: Number(f.quantity),
      });
      router.push('/seller/catalog');
    } catch (e: any) { setErr(e?.message || 'Could not save.'); setBusy(false); }
  };

  if (loading) return <p className="py-10 text-center text-[13px] text-faint">Loading…</p>;

  return (
    <div className="max-w-xl">
      <PageHead title="Edit product" sub="Update details, price and stock." action={<Link href="/seller/catalog" className="btn-ghost px-3 py-2 text-[13px]">← Back</Link>} />
      <Panel>
        <Field label="Product title" value={f.title} onChange={(v) => set('title', v)} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Price (₹)" value={f.price} onChange={(v) => set('price', v)} />
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Stock</label>
            <input type="number" min={0} value={f.quantity} onChange={(e) => set('quantity', e.target.value)} className="c-input mt-1.5" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Condition</label>
            <select value={f.condition} onChange={(e) => set('condition', e.target.value)} className="c-input mt-1.5">
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Category" value={f.category} onChange={(v) => set('category', v)} />
        </div>
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Description</label>
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} className="c-input mt-1.5" />
        </div>
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Photo</label>
          <div className="mt-1.5"><MediaInput value={f.image} onChange={(v) => set('image', v)} /></div>
        </div>

        {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
        <button onClick={save} disabled={busy} className="btn-green mt-5 w-full justify-center disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
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
