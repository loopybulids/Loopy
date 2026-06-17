'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';
import { useRequireRole } from '@/lib/useRequireRole';
import { Camera, Heart, Shield, Sparkle, Verified } from '@/components/icons';

const CONDITIONS = ['Brand New', 'Like new', 'Good', 'Fair'];

export default function ListItem() {
  const { ready, role } = useRequireRole('seller');
  const [f, setF] = useState({ title: '', price: '', condition: 'Brand New', category: '', description: '', image: '' });
  const [busy, setBusy] = useState(false);
  const [authentic, setAuthentic] = useState(true);
  const [original, setOriginal] = useState(true);
  const router = useRouter();
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const publish = async () => {
    if (!f.title || !f.price) return alert('Add a title and price');
    setBusy(true);
    try { await api.createProduct({ title: f.title, price: Number(f.price), condition: f.condition, category: f.category, description: f.description, images: f.image ? [f.image] : [], quantity: 1 }); router.push('/seller/products'); }
    catch (e: any) { alert(e.message); setBusy(false); }
  };

  if (!ready || role !== 'seller') return <main className="seller-bg min-h-screen" />;

  return (
    <main className="seller-bg min-h-screen pb-12">
      <SellerNav />
      <div className="relative">
        <div className="seller-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2">
          {/* form */}
          <div className="animate-riseIn">
            <h1 className="font-display text-[26px] font-extrabold tracking-tight text-white">List an Item</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] s-muted"><Shield size={14} className="text-green-500" /> Verified Integrity: items are held in trust until arrival.</p>

            <label className="mt-5 block cursor-pointer rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition-colors hover:border-green-500/40">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Camera size={20} /></span>
              <div className="mt-3 font-display text-[16px] font-bold text-white">Add high-quality photos</div>
              <p className="mt-1 text-[12.5px] s-muted">Buyers are 4× more likely to purchase items with 5+ photos. Paste an image URL below to preview.</p>
            </label>
            <input value={f.image} onChange={(e) => set('image', e.target.value)} placeholder="Image URL (https://…)" className="s-input mt-2 w-full px-3 py-2.5 text-sm" />

            <Field label="Product Title" value={f.title} onChange={(v: string) => set('title', v)} placeholder="e.g. Vintage Leather Camera Strap" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Price (₹)" value={f.price} onChange={(v: string) => set('price', v)} placeholder="0.00" />
              <div>
                <div className="text-[12px] font-semibold text-[#C7D2E0]">Condition</div>
                <select value={f.condition} onChange={(e) => set('condition', e.target.value)} className="s-input mt-1 w-full px-3 py-3 text-sm font-semibold">
                  {CONDITIONS.map((c) => <option key={c} className="bg-[#0E2236]">{c}</option>)}
                </select>
              </div>
            </div>
            <Field label="Category" value={f.category} onChange={(v: string) => set('category', v)} placeholder="Search categories…" />

            <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Toggle on={authentic} set={setAuthentic} icon={<Verified size={16} />} title="Authenticity Guaranteed" sub="I confirm this item is genuine." />
              <Toggle on={original} set={setOriginal} icon={<Camera size={16} />} title="Original Photos" sub="These are my own photos of the actual item." />
            </div>

            <button disabled={busy} onClick={publish} className="s-btn mt-5 w-full disabled:opacity-60">{busy ? 'Listing…' : 'List Product Now →'}</button>
          </div>

          {/* live preview */}
          <div>
            <div className="flex items-center justify-between"><h2 className="font-display text-[18px] font-bold text-white">Live Preview</h2><span className="flex items-center gap-1.5 text-[12px] font-semibold text-green-500"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Updating Live</span></div>
            <div className="s-card mt-3 overflow-hidden">
              <div className="relative aspect-[5/4] bg-[#0E2236]">
                {f.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.image} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2.5 py-1 text-[10px] font-bold text-[#07140A]"><Shield size={11} /> Loopy Protected</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="font-display text-[16px] font-bold text-white">{f.title || 'Product Title'}</div>
                  <Heart size={18} className="text-[#8A98AD]" />
                </div>
                <div className="mt-1 flex items-center gap-2"><span className="font-display text-[18px] font-extrabold text-white">{f.price ? rupees(Number(f.price)) : '₹0'}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#C7D2E0]">{f.condition}</span></div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[12px]"><span className="h-6 w-6 rounded-full bg-green-500" /><b className="text-white">You</b> <span className="text-green-500">· Top Seller</span></div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Sparkle size={18} className="mt-0.5 text-green-500" />
              <p className="text-[12.5px] s-muted"><b className="text-white">Seller Tip:</b> Items listed with a clear category and description sell 30% faster. Don't forget to mention any minor flaws!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div className="mt-4">
      <div className="text-[12px] font-semibold text-[#C7D2E0]">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="s-input mt-1 w-full px-3 py-3 text-sm font-semibold placeholder:font-normal" />
    </div>
  );
}
function Toggle({ on, set, icon, title, sub }: any) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-500/15 text-green-500 ring-1 ring-green-500/30">{icon}</span>
      <div className="flex-1"><div className="text-[13px] font-bold text-white">{title}</div><div className="text-[11px] s-muted">{sub}</div></div>
      <button onClick={() => set(!on)} className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-white/15'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>
    </div>
  );
}
