'use client';

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** Seller picks which sizes are available. */
export function SizeSelector({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Available sizes (optional)</label>
      <p className="mb-1.5 text-[11px] text-muted">Tap the sizes you have in stock. Others show as sold-out on your store.</p>
      <div className="flex flex-wrap gap-2">
        {SIZES.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`min-w-[44px] rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors ${on ? 'border-green bg-green text-white' : 'border-line bg-white text-muted hover:border-green/40'}`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Storefront display: available sizes enabled, the rest disabled/struck-through. */
export function SizeStrip({ sizes, compact = false }: { sizes: string[]; compact?: boolean }) {
  if (!sizes || sizes.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'gap-1.5'}`}>
      {SIZES.map((s) => {
        const avail = sizes.includes(s);
        return (
          <span
            key={s}
            className={`rounded-md border text-center font-bold ${compact ? 'min-w-[22px] px-1 py-0.5 text-[10px]' : 'min-w-[30px] px-2 py-1 text-[11px]'} ${avail ? 'border-navy/20 text-navy' : 'border-line text-faint line-through opacity-60'}`}
            title={avail ? `${s} — available` : `${s} — sold out`}
          >
            {s}
          </span>
        );
      })}
    </div>
  );
}
