'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import SellerNav from '@/components/SellerNav';

const CONDITIONS = ['Like new', 'Good', 'Fair'];

export default function NewProduct() {
  const [f, setF] = useState({ title: '', price: '', size: '', brand: '', condition: 'Like new', description: '', image: '' });
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const publish = async () => {
    if (!f.title || !f.price) return alert('Add a title and price');
    setBusy(true);
    try {
      await api.createProduct({
        title: f.title, price: Number(f.price), size: f.size, brand: f.brand,
        condition: f.condition, description: f.description,
        images: f.image ? [f.image] : [], quantity: 1,
      });
      router.push('/seller/products');
    } catch (e: any) { alert(e.message); setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-paper pb-24">
      <SellerNav />
      <div className="mx-auto max-w-md px-5 py-6">
        <h1 className="font-serif text-[24px] font-semibold">New product</h1>
        <div className="card mt-4 space-y-3 p-5">
          <Field label="Title" value={f.title} onChange={(v) => set('title', v)} placeholder="Y2K floral slip dress" />
          <div className="flex gap-3">
            <Field label="Price ₹" value={f.price} onChange={(v) => set('price', v)} placeholder="649" />
            <Field label="Size" value={f.size} onChange={(v) => set('size', v)} placeholder="M" />
          </div>
          <Field label="Brand" value={f.brand} onChange={(v) => set('brand', v)} placeholder="Zara" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Condition</div>
            <div className="mt-1.5 flex gap-2">
              {CONDITIONS.map((c) => (
                <button key={c} onClick={() => set('condition', c)} className={`chip ${f.condition === c ? 'bg-indigo-soft text-indigo' : 'bg-[#F0EEF4] text-muted'}`}>{c}</button>
              ))}
            </div>
          </div>
          <Field label="Image URL (optional)" value={f.image} onChange={(v) => set('image', v)} placeholder="https://…" />
          <label className="block rounded-xl border border-line px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Description</div>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Soft satin, no flaws…" className="mt-1 w-full resize-none bg-transparent text-sm outline-none" />
          </label>
        </div>
        <button disabled={busy} onClick={publish} className="btn-pri mt-4 w-full disabled:opacity-60">{busy ? 'Publishing…' : 'Publish to store'}</button>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block flex-1 rounded-xl border border-line px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-faint" />
    </label>
  );
}
