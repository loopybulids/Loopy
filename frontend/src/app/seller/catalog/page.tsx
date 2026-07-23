'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import MediaGallery from '@/components/MediaGallery';
import MediaInput from '@/components/MediaInput';
import { VariantsEditor, cleanVariants, toEditorVariants, type Variant } from '@/components/VariantsEditor';
import { Plus, Tag, Heart, ShieldLock, Check } from '@/components/icons';

function firstImage(p: any): string | null {
  try {
    if (Array.isArray(p.images)) return p.images[0] || null;
    if (typeof p.images === 'string') return JSON.parse(p.images)[0] || null;
  } catch { /* ignore */ }
  return p.image || null;
}
function toArray(p: any): string[] {
  if (Array.isArray(p.images)) return p.images;
  try { return JSON.parse(p.images || '[]'); } catch { return []; }
}

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    api.myProducts().then((p) => { setProducts(p || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const patchLocal = (id: string, patch: any) => setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const toggleLive = async (p: any) => {
    const next = !p.isActive;
    patchLocal(p.id, { isActive: next });
    try { await api.updateProduct(p.id, { isActive: next }); }
    catch { patchLocal(p.id, { isActive: !next }); }
  };

  const editing = products.find((p) => p.id === editId) || null;

  return (
    <div>
      <PageHead
        title="Products"
        sub="Your catalog — click a product to manage everything."
        action={<Link href="/seller/products/new" className="btn-green"><Plus size={15} /> Add product</Link>}
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : products.length === 0 ? (
          <Empty icon={<Tag size={24} />} title="No products yet" hint="Add your first product and it goes live on your storefront instantly."
            action={<Link href="/seller/products/new" className="btn-green"><Plus size={15} /> Add your first product</Link>} />
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
                  const img = firstImage(p);
                  return (
                    <tr key={p.id} className="group cursor-pointer hover:bg-paper/50" onClick={() => setEditId(p.id)}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-green-soft text-green-600">
                            {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Tag size={16} />}
                          </span>
                          <span className="font-display font-bold text-navy group-hover:text-green-600">{p.title || p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-navy">{money(p.price)}</td>
                      <td className="py-3">
                        {qty <= 0 ? <span className="chip-rose">Out of stock</span>
                          : <span className={low ? 'font-semibold text-amber' : 'text-muted'}>{low ? `${qty} left` : `${qty} in stock`}</span>}
                      </td>
                      <td className="py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleLive(p)} className="flex items-center gap-2" title={p.isActive ? 'Live — click to delist' : 'Hidden — click to publish'}>
                          <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.isActive ? 'bg-green' : 'bg-line'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${p.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                          </span>
                          <span className={p.isActive ? 'chip-green' : 'chip-navy'}>{p.isActive ? 'Live' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditId(p.id)} className="text-[13px] font-bold text-green-600 hover:underline">Manage →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <ManageDrawer
          key={editing.id}
          product={editing}
          onClose={() => setEditId(null)}
          onSaved={(u) => { patchLocal(u.id, u); setEditId(null); }}
        />
      )}
    </div>
  );
}

function ManageDrawer({ product, onClose, onSaved }: { product: any; onClose: () => void; onSaved: (u: any) => void }) {
  const [f, setF] = useState({
    title: product.title || '', price: String(product.price ?? ''), mrp: product.mrp != null ? String(product.mrp) : '',
    quantity: String(product.quantity ?? 1), category: product.category || '', brand: product.brand || '',
    description: product.description || '', isActive: product.isActive ?? true,
  });
  const [media, setMedia] = useState<string[]>(toArray(product));
  const [variants, setVariants] = useState<Variant[]>(toEditorVariants(product.variants || []));
  const [sizes, setSizes] = useState<string[]>(product.sizes || []);
  const [sizeChart, setSizeChart] = useState<string>(product.sizeChartUrl || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setErr('');
    if (!f.title || !f.price) { setErr('Title and price are required.'); return; }
    setBusy(true);
    try {
      const updated = await api.updateProduct(product.id, {
        title: f.title, price: Number(f.price), mrp: f.mrp ? Number(f.mrp) : null,
        quantity: Number(f.quantity) || 0, category: f.category, brand: f.brand,
        description: f.description, images: media, isActive: f.isActive,
        variants: cleanVariants(variants), sizes, sizeChartUrl: sizeChart || null,
      });
      setSaved(true);
      setTimeout(() => onSaved({ ...product, ...updated, images: media }), 600);
    } catch (e: any) { setErr(e?.message || 'Could not save.'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-paper shadow-2xl animate-riseIn">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-[17px] font-extrabold text-navy">Manage product</h2>
            <p className="text-[12px] text-faint">Edit details, stock, images and visibility.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper" aria-label="Close">✕</button>
        </div>

        <div className="space-y-5 p-5">
          {/* live/delist */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-white p-4">
            <div>
              <div className="text-[13.5px] font-bold text-navy">{f.isActive ? 'Live on storefront' : 'Hidden from storefront'}</div>
              <div className="text-[12px] text-muted">{f.isActive ? 'Customers can see and buy this.' : 'Delisted — not visible to customers.'}</div>
            </div>
            <button onClick={() => set('isActive', !f.isActive)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${f.isActive ? 'bg-green' : 'bg-line'}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-all ${f.isActive ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* images */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Photos &amp; video</label>
            <div className="mt-1.5"><MediaGallery value={media} onChange={setMedia} /></div>
          </div>

          {/* fields */}
          <Field label="Product title" value={f.title} onChange={(v) => set('title', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price (₹)" value={f.price} onChange={(v) => set('price', v)} type="number" />
            <Field label="Market price (₹)" value={f.mrp} onChange={(v) => set('mrp', v)} type="number" placeholder="Struck-through" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock" value={f.quantity} onChange={(v) => set('quantity', v)} type="number" />
            <Field label="Category" value={f.category} onChange={(v) => set('category', v)} placeholder="e.g. Footwear" />
          </div>
          <Field label="Brand (optional)" value={f.brand} onChange={(v) => set('brand', v)} />

          <VariantsEditor variants={variants} setVariants={setVariants} sizes={sizes} setSizes={setSizes} />

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Size chart (optional)</label>
            <div className="mt-1.5"><MediaInput value={sizeChart} onChange={setSizeChart} /></div>
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Description</label>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} className="c-input mt-1.5" placeholder="Describe the item and any details buyers should know." />
          </div>

          {/* storefront preview */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-faint">How it looks on your store</div>
            <div className="card mx-auto max-w-[260px] overflow-hidden">
              <div className="relative grid max-h-52 place-items-center bg-green-soft">
                {media[0] ? <img src={media[0]} alt="" className="max-h-52 w-full object-contain" /> : <div className="aspect-square w-full" />}
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white"><ShieldLock size={11} /> Loopy Protected</span>
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between"><div className="font-display text-[15px] font-bold text-navy">{f.title || 'Product Title'}</div><Heart size={17} className="text-faint" /></div>
                <div className="mt-1 flex items-center gap-2"><span className="font-display text-[17px] font-extrabold text-navy">{f.price ? money(Number(f.price)) : '₹0'}</span>{f.mrp && Number(f.mrp) > Number(f.price || 0) && <span className="text-[12px] font-semibold text-faint line-through">{money(Number(f.mrp))}</span>}</div>
                {variants.filter((v) => v.label.trim()).length > 0 && <div className="mt-2 flex flex-wrap gap-1">{variants.filter((v) => v.label.trim()).map((v, i) => <span key={i} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-semibold text-navy">{v.label}</span>)}</div>}
              </div>
            </div>
          </div>

          {err && <p className="text-[13px] font-semibold text-rose">{err}</p>}
        </div>

        {/* footer */}
        <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-line bg-white px-5 py-4">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-green flex-[2] justify-center disabled:opacity-60">{busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="c-input mt-1.5" />
    </div>
  );
}
