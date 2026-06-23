'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHead, Panel, money } from '@/components/seller-ui';
import MediaInput from '@/components/MediaInput';
import { Camera, Heart, ShieldLock, Sparkle, Verified } from '@/components/icons';

const CONDITIONS = ['Brand New', 'Like new', 'Good', 'Fair'];

export default function AddProduct() {
  const router = useRouter();
  const [f, setF] = useState({ title: '', price: '', condition: 'Brand New', category: '', description: '', image: '' });
  const [authentic, setAuthentic] = useState(true);
  const [original, setOriginal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const publish = async () => {
    setErr('');
    if (!f.title || !f.price) { setErr('Add a title and price.'); return; }
    setBusy(true);
    try {
      await api.createProduct({
        title: f.title, price: Number(f.price), condition: f.condition,
        category: f.category, description: f.description,
        images: f.image ? [f.image] : [], quantity: 1,
      });
      router.push('/seller/catalog');
    } catch (e: any) { setErr(e?.message || 'Could not list product.'); setBusy(false); }
  };

  return (
    <div>
      <PageHead title="List an item" sub="Add a product to your catalog — it goes live on your storefront instantly." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* form */}
        <Panel>
          <MediaInput dropzone value={f.image} onChange={(v) => set('image', v)} />

          <Field label="Product title" value={f.title} onChange={(v) => set('title', v)} placeholder="e.g. Vintage Leather Camera Strap" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Price (₹)" value={f.price} onChange={(v) => set('price', v)} placeholder="0.00" />
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Condition</label>
              <select value={f.condition} onChange={(e) => set('condition', e.target.value)} className="c-input mt-1.5">
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Category" value={f.category} onChange={(v) => set('category', v)} placeholder="e.g. Footwear, Bags, Apparel" />

          <div className="mt-4 space-y-3 rounded-xl border border-line bg-paper p-4">
            <Toggle on={authentic} set={setAuthentic} icon={<Verified size={16} />} title="Authenticity Guaranteed" sub="I confirm this item is genuine." />
            <Toggle on={original} set={setOriginal} icon={<Camera size={16} />} title="Original Photos" sub="These are my own photos of the actual item." />
          </div>

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
          <button disabled={busy} onClick={publish} className="btn-green mt-5 w-full justify-center disabled:opacity-60">{busy ? 'Listing…' : 'List Product Now →'}</button>
        </Panel>

        {/* live preview */}
        <div className="lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-extrabold text-navy">Live preview</h2>
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-green-600"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Updating live</span>
          </div>
          <div className="card mx-auto max-w-[280px] overflow-hidden">
            <div className="relative grid max-h-64 place-items-center bg-green-soft">
              {f.image
                ? <img src={f.image} alt="" className="max-h-64 w-full object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                : <div className="aspect-square w-full" />}
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white"><ShieldLock size={11} /> Loopy Protected</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="font-display text-[16px] font-bold text-navy">{f.title || 'Product Title'}</div>
                <Heart size={18} className="text-faint" />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-[18px] font-extrabold text-navy">{f.price ? money(Number(f.price)) : '₹0'}</span>
                <span className="chip-navy">{f.condition}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[12px]"><span className="h-6 w-6 rounded-full bg-green-500" /><b className="text-navy">You</b> <span className="text-green-600">· Top Seller</span></div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3.5">
            <Sparkle size={18} className="mt-0.5 text-green-600" />
            <p className="text-[12.5px] text-muted"><b className="text-navy">Seller Tip:</b> Items listed with a clear category and description sell 30% faster. Don’t forget to mention any minor flaws!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mt-4">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="c-input mt-1.5" />
    </div>
  );
}

function Toggle({ on, set, icon, title, sub }: { on: boolean; set: (v: boolean) => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-soft text-green-600 ring-1 ring-green/15">{icon}</span>
      <div className="flex-1"><div className="text-[13px] font-bold text-navy">{title}</div><div className="text-[11px] text-muted">{sub}</div></div>
      <button onClick={() => set(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-green' : 'bg-line'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>
    </div>
  );
}
