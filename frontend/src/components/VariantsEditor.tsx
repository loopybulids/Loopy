'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Plus } from '@/components/icons';
import { SizeSelector } from '@/components/sizes';

export type Variant = { label: string; price: string; stock: string; color?: string };

/** Common product colours. `name` doubles as the auto-filled variant label. */
const PALETTE: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#9CA3AF' },
  { name: 'Beige', hex: '#E7D8C2' },
  { name: 'Brown', hex: '#7C4A25' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Olive', hex: '#65A30D' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Purple', hex: '#7C3AED' },
];

/** Normalize editor rows into the API shape (drop empty labels, numeric fields). */
export function cleanVariants(variants: Variant[]) {
  return variants
    .filter((v) => v.label.trim())
    .map((v) => ({
      label: v.label.trim(),
      price: v.price ? Number(v.price) : undefined,
      stock: v.stock ? Number(v.stock) : undefined,
      color: v.color || undefined,
    }));
}

/** Hydrate API variants back into editor rows. */
export function toEditorVariants(v: any[]): Variant[] {
  return (v || []).map((x) => ({
    label: x.label || '',
    price: x.price != null ? String(x.price) : '',
    stock: x.stock != null ? String(x.stock) : '',
    color: x.color || undefined,
  }));
}

/** Swatch button + palette popover for one variant row. */
function ColorPicker({ value, onPick }: { value?: string; onPick: (hex: string, name: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={value ? `Colour ${value}` : 'Pick a colour'}
        aria-label="Pick a colour"
        className="grid h-[38px] w-[38px] place-items-center rounded-lg border border-line bg-white transition-colors hover:border-green-600/50"
      >
        {value
          ? <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: value }} />
          : <span className="h-5 w-5 rounded-full bg-[conic-gradient(#DC2626,#FACC15,#16A34A,#2563EB,#7C3AED,#DC2626)] opacity-70" />}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-[212px] rounded-xl border border-line bg-white p-2.5 shadow-lift">
          <div className="grid grid-cols-8 gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => { onPick(c.hex, c.name); setOpen(false); }}
                className="grid h-[22px] w-[22px] place-items-center rounded-full ring-1 ring-black/10 transition-transform hover:scale-110"
                style={{ background: c.hex }}
              >
                {value?.toLowerCase() === c.hex.toLowerCase() && (
                  <Check size={12} className={c.name === 'White' || c.name === 'Yellow' || c.name === 'Beige' ? 'text-navy' : 'text-white'} />
                )}
              </button>
            ))}
          </div>

          <label className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5 text-[12px] font-semibold text-muted">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onPick(e.target.value, '')}
              className="h-6 w-8 cursor-pointer rounded border border-line bg-white p-0.5"
            />
            Custom
            {value && (
              <button type="button" onClick={() => { onPick('', ''); setOpen(false); }} className="ml-auto text-[12px] font-semibold text-rose hover:underline">
                Clear
              </button>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

export function VariantsEditor({ variants, setVariants, sizes, setSizes }: { variants: Variant[]; setVariants: (v: Variant[]) => void; sizes?: string[]; setSizes?: (v: string[]) => void }) {
  const upd = (i: number, patch: Partial<Variant>) =>
    setVariants(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Variants (optional)</label>
      <p className="mb-1.5 text-[11px] text-muted">Add sizes/colors — each can have its own price &amp; stock.</p>

      {setSizes && (
        <div className="mb-4 rounded-xl border border-line bg-paper/50 p-3">
          <SizeSelector value={sizes || []} onChange={setSizes} />
        </div>
      )}

      <div className="space-y-2">
        {variants.map((v, i) => (
          /* Grid, not flex: `.c-input` carries `w-full` from a custom utility that
             out-ranks `w-24`/`w-20`, so fixed widths on the inputs were ignored and
             the label field collapsed. Column widths belong on the grid instead. */
          <div key={i} className="grid grid-cols-[38px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_26px] items-center gap-2">
            <ColorPicker
              value={v.color}
              onPick={(hex, name) => upd(i, { color: hex || undefined, label: !v.label.trim() && name ? name : v.label })}
            />
            <input
              value={v.label}
              onChange={(e) => upd(i, { label: e.target.value })}
              placeholder="e.g. Small / Red"
              className="c-input py-2 text-[13px]"
            />
            <input
              value={v.price}
              onChange={(e) => upd(i, { price: e.target.value })}
              placeholder="Price"
              type="number"
              inputMode="numeric"
              className="c-input no-spin py-2 text-[13px]"
            />
            <input
              value={v.stock}
              onChange={(e) => upd(i, { stock: e.target.value })}
              placeholder="Stock"
              type="number"
              inputMode="numeric"
              className="c-input no-spin py-2 text-[13px]"
            />
            <button
              type="button"
              onClick={() => setVariants(variants.filter((_, j) => j !== i))}
              className="justify-self-center px-1 text-rose"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setVariants([...variants, { label: '', price: '', stock: '' }])} className="btn-ghost mt-2 w-full py-2 text-[13px]">
        <Plus size={14} /> Add variant
      </button>
    </div>
  );
}
