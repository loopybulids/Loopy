'use client';
import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/StorePreview';

/**
 * Every product in a store, with the filters a shopper expects.
 *
 * The home page shows eight; this is where the rest live. A seller with forty
 * products had thirty-two of them unreachable, which is the kind of bug that
 * looks like "nobody buys my stuff" rather than like a bug.
 *
 * Filtering happens in the browser, deliberately. The store payload already
 * carries the whole catalogue — the storefront renders from it — so paging
 * this through the API would add a round trip per checkbox to narrow a list
 * that is already in memory. If catalogues ever grow past a few hundred
 * products this is the thing to revisit, and the shape of `matches` below is
 * what a server-side query would be written from.
 *
 * Facet counts respect the *other* filters but not their own. That is what
 * makes them useful: after picking a category, sizes show how many of that
 * category come in each size, so there is never a choice that leads nowhere.
 */

type Product = any;
/** Every filter except this one applies when counting a facet's options. */
type Facet = 'category' | 'brand' | 'size' | 'condition';

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest first' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'discount', label: 'Biggest saving' },
] as const;

const rupees = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const discount = (p: Product) => (p.mrp && p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);
const inStock = (p: Product) => (p.quantity ?? 0) > 0;

const searchText = (p: Product) =>
  [p.title, p.brand, p.category, p.description].filter(Boolean).join(' ').toLowerCase();

/** Options for one facet, with how many products each would leave. */
function options(products: Product[], pick: (p: Product) => string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const v of pick(p)) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter(Boolean).map(String) : []);
const asOne = (v: unknown): string[] => (v ? [String(v)] : []);

export default function ProductCatalog({ products, username, accent }: {
  products: Product[];
  username: string;
  accent: string;
}) {
  const [q, setQ] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);
  const [sort, setSort] = useState<string>('featured');
  const [sheet, setSheet] = useState(false);

  const prices = products.map((p) => p.price || 0);
  const floor = prices.length ? Math.min(...prices) : 0;
  const ceiling = prices.length ? Math.max(...prices) : 0;

  /** One product against the current filters, optionally ignoring one facet. */
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = min === '' ? null : Number(min);
    const hi = max === '' ? null : Number(max);

    return (p: Product, skip?: Facet) => {
      if (needle && !searchText(p).includes(needle)) return false;
      if (skip !== 'category' && cats.length && !cats.includes(p.category || 'Other')) return false;
      if (skip !== 'brand' && brands.length && !brands.includes(p.brand || 'Unbranded')) return false;
      if (skip !== 'condition' && conds.length && !conds.includes(p.condition || 'Good')) return false;
      if (skip !== 'size' && sizes.length) {
        const has = asList(p.sizes);
        // A product with no sizes listed is one-size — it can't match a size filter.
        if (!has.some((s) => sizes.includes(s))) return false;
      }
      if (lo !== null && !Number.isNaN(lo) && (p.price || 0) < lo) return false;
      if (hi !== null && !Number.isNaN(hi) && (p.price || 0) > hi) return false;
      if (stockOnly && !inStock(p)) return false;
      if (saleOnly && !discount(p)) return false;
      return true;
    };
  }, [q, cats, brands, sizes, conds, min, max, stockOnly, saleOnly]);

  const results = useMemo(() => {
    const out = products.filter((p) => matches(p));
    const by: Record<string, (a: Product, b: Product) => number> = {
      newest: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      'price-asc': (a, b) => (a.price || 0) - (b.price || 0),
      'price-desc': (a, b) => (b.price || 0) - (a.price || 0),
      discount: (a, b) => discount(b) - discount(a),
    };
    // "Featured" is the seller's own order — the one they arranged in the console.
    return by[sort] ? [...out].sort(by[sort]) : out;
  }, [products, matches, sort]);

  const facets = useMemo(() => ({
    category: options(products.filter((p) => matches(p, 'category')), (p) => asOne(p.category || 'Other')),
    brand: options(products.filter((p) => matches(p, 'brand')), (p) => asOne(p.brand || 'Unbranded')),
    size: options(products.filter((p) => matches(p, 'size')), (p) => asList(p.sizes)),
    condition: options(products.filter((p) => matches(p, 'condition')), (p) => asOne(p.condition || 'Good')),
  }), [products, matches]);

  const active =
    cats.length + brands.length + sizes.length + conds.length +
    (min !== '' ? 1 : 0) + (max !== '' ? 1 : 0) + (stockOnly ? 1 : 0) + (saleOnly ? 1 : 0);

  const clearAll = () => {
    setCats([]); setBrands([]); setSizes([]); setConds([]);
    setMin(''); setMax(''); setStockOnly(false); setSaleOnly(false); setQ('');
  };

  const toggle = (list: string[], set: (v: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const filters = (
    <div className="space-y-6">
      {active > 0 && (
        <button onClick={clearAll} className="text-[12.5px] font-bold hover:underline" style={{ color: accent }}>
          Clear all filters ({active})
        </button>
      )}

      <Group title="Price">
        <div className="flex items-center gap-2">
          <PriceInput value={min} onChange={setMin} placeholder={String(floor)} label="Minimum price" />
          <span className="text-[13px] text-faint">to</span>
          <PriceInput value={max} onChange={setMax} placeholder={String(ceiling)} label="Maximum price" />
        </div>
        <p className="mt-2 text-[11.5px] text-faint">This store: {rupees(floor)} – {rupees(ceiling)}</p>
      </Group>

      <Group title="Availability">
        <Check label="In stock only" on={stockOnly} set={() => setStockOnly(!stockOnly)} accent={accent} />
        <Check label="On sale" on={saleOnly} set={() => setSaleOnly(!saleOnly)} accent={accent} />
      </Group>

      <Facets title="Category" opts={facets.category} chosen={cats} onPick={toggle(cats, setCats)} accent={accent} />
      <Facets title="Size" opts={facets.size} chosen={sizes} onPick={toggle(sizes, setSizes)} accent={accent} />
      <Facets title="Condition" opts={facets.condition} chosen={conds} onPick={toggle(conds, setConds)} accent={accent} />
      <Facets title="Brand" opts={facets.brand} chosen={brands} onPick={toggle(brands, setBrands)} accent={accent} />
    </div>
  );

  return (
    <section className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-[28px] font-bold">All products</h1>
        <p className="mt-1 text-[14px] text-muted">
          {products.length} {products.length === 1 ? 'item' : 'items'} in this store
        </p>

        {/* search + sort: the two controls that stay visible at every width */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition focus:border-navy"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            className="rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] font-semibold outline-none"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button
            onClick={() => setSheet(true)}
            className="rounded-lg px-4 py-2.5 text-[13.5px] font-bold text-white lg:hidden"
            style={{ background: accent }}
          >
            Filters{active > 0 ? ` (${active})` : ''}
          </button>
        </div>

        <div className="mt-7 lg:flex lg:gap-8">
          <aside className="hidden w-[240px] shrink-0 lg:block">{filters}</aside>

          <div className="min-w-0 flex-1">
            <p className="mb-4 text-[13px] text-faint">
              Showing {results.length} of {products.length}
            </p>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
                <p className="font-display text-[16px] font-bold text-navy">Nothing matches those filters</p>
                <p className="mt-1 text-[13px] text-muted">Try widening the price range or clearing a filter.</p>
                <button onClick={clearAll} className="mt-4 rounded-lg px-5 py-2.5 text-[13.5px] font-bold text-white" style={{ background: accent }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {results.map((p) => <ProductCard key={p.id} p={p} username={username} accent={accent} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filters: a sheet, so the grid stays put underneath */}
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold">Filters</h2>
              <button onClick={() => setSheet(false)} className="text-[13px] font-bold text-muted">Close</button>
            </div>
            {filters}
            <button
              onClick={() => setSheet(false)}
              className="mt-6 w-full rounded-lg py-3 text-[14px] font-bold text-white"
              style={{ background: accent }}
            >
              Show {results.length} {results.length === 1 ? 'product' : 'products'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 font-display text-[13.5px] font-bold text-navy">{title}</h3>
      {children}
    </div>
  );
}

/**
 * One facet. Hidden entirely when there is nothing to choose between — a
 * "Brand" list with a single entry is a filter that can only ever narrow to
 * what is already on screen.
 */
function Facets({ title, opts, chosen, onPick, accent }: {
  title: string;
  opts: { value: string; count: number }[];
  chosen: string[];
  onPick: (v: string) => void;
  accent: string;
}) {
  const [all, setAll] = useState(false);
  if (opts.length < 2) return null;

  const visible = all ? opts : opts.slice(0, 6);
  return (
    <Group title={title}>
      <div className="space-y-1.5">
        {visible.map((o) => (
          <Check
            key={o.value}
            label={o.value}
            count={o.count}
            on={chosen.includes(o.value)}
            set={() => onPick(o.value)}
            accent={accent}
          />
        ))}
      </div>
      {opts.length > 6 && (
        <button onClick={() => setAll(!all)} className="mt-2 text-[12px] font-bold hover:underline" style={{ color: accent }}>
          {all ? 'Show less' : `Show all ${opts.length}`}
        </button>
      )}
    </Group>
  );
}

function Check({ label, count, on, set, accent }: {
  label: string;
  count?: number;
  on: boolean;
  set: () => void;
  accent: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-[13.5px] text-navy">
      <input type="checkbox" checked={on} onChange={set} className="h-4 w-4 shrink-0 cursor-pointer rounded border-line" style={{ accentColor: accent }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-[11.5px] text-faint">{count}</span>}
    </label>
  );
}

function PriceInput({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-faint">₹</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white py-2 pl-6 pr-2 text-[13.5px] outline-none transition focus:border-navy"
      />
    </div>
  );
}
