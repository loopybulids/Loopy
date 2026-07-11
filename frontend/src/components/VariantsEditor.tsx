'use client';
import { Plus } from '@/components/icons';

export type Variant = { label: string; price: string; stock: string };

/** Normalize editor rows into the API shape (drop empty labels, numeric fields). */
export function cleanVariants(variants: Variant[]) {
  return variants
    .filter((v) => v.label.trim())
    .map((v) => ({ label: v.label.trim(), price: v.price ? Number(v.price) : undefined, stock: v.stock ? Number(v.stock) : undefined }));
}

/** Hydrate API variants back into editor rows. */
export function toEditorVariants(v: any[]): Variant[] {
  return (v || []).map((x) => ({ label: x.label || '', price: x.price != null ? String(x.price) : '', stock: x.stock != null ? String(x.stock) : '' }));
}

export function VariantsEditor({ variants, setVariants }: { variants: Variant[]; setVariants: (v: Variant[]) => void }) {
  const upd = (i: number, k: keyof Variant, val: string) => setVariants(variants.map((v, j) => (j === i ? { ...v, [k]: val } : v)));
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Variants (optional)</label>
      <p className="mb-1.5 text-[11px] text-muted">Add sizes/colors — each can have its own price &amp; stock.</p>
      <div className="space-y-2">
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input value={v.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="e.g. Small / Red" className="c-input flex-1 py-2 text-[13px]" />
            <input value={v.price} onChange={(e) => upd(i, 'price', e.target.value)} placeholder="₹ price" type="number" className="c-input w-24 py-2 text-[13px]" />
            <input value={v.stock} onChange={(e) => upd(i, 'stock', e.target.value)} placeholder="stock" type="number" className="c-input w-20 py-2 text-[13px]" />
            <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="px-1.5 text-rose" title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setVariants([...variants, { label: '', price: '', stock: '' }])} className="btn-ghost mt-2 w-full py-2 text-[13px]"><Plus size={14} /> Add variant</button>
    </div>
  );
}
