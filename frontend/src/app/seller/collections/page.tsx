'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, rupees } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { PageHead, Panel, Empty, StatStrip } from '@/components/seller-ui';
import { Plus, Tag, Check, Store } from '@/components/icons';

/**
 * Collections — seller-curated groups of their own products.
 *
 * A storefront that can only say "All products" has no way to merchandise.
 * A collection is an explicit, ordered list the seller picks, addressable at
 * /s/<store>/c/<slug> and placeable as a row in the store editor.
 *
 * Membership is deliberately manual rather than rule-based ("everything under
 * ₹999"): the seller sees exactly what a shopper will see, with no rule
 * quietly pulling in a product they didn't intend to feature.
 */

type Draft = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  published: boolean;
  productIds: string[];
};

const BLANK: Draft = { id: '', title: '', description: '', imageUrl: '', published: true, productIds: [] };

export default function Collections() {
  const { data, loading, reload } = useApiData<any[]>('seller:collections', () => api.myCollections());
  const collections = data ?? [];

  const { data: productData } = useApiData<any[]>('seller:products', () => api.myProducts());
  const products = productData ?? [];

  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const startNew = () => { setErr(''); setEditing({ ...BLANK }); };
  const startEdit = (c: any) => {
    setErr('');
    setEditing({
      id: c.id,
      title: c.title,
      description: c.description || '',
      imageUrl: c.imageUrl || '',
      published: c.published,
      productIds: [...(c.productIds || [])],
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return setErr('Give the collection a name.');
    setBusy(true); setErr('');
    try {
      const body = {
        title: editing.title.trim(),
        description: editing.description.trim(),
        imageUrl: editing.imageUrl.trim(),
        published: editing.published,
        productIds: editing.productIds,
      };
      if (editing.id) await api.updateCollection(editing.id, body);
      else await api.createCollection(body);
      setEditing(null);
      await reload();
    } catch (e: any) {
      setErr(e?.message || 'Could not save this collection.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: any) => {
    if (!confirm(`Delete "${c.title}"?\n\nThe products stay in your catalogue — only the collection goes.`)) return;
    try { await api.deleteCollection(c.id); await reload(); }
    catch (e: any) { alert(e?.message || 'Could not delete.'); }
  };

  const togglePublished = async (c: any) => {
    try { await api.updateCollection(c.id, { published: !c.published }); await reload(); }
    catch { await reload(); }
  };

  const live = collections.filter((c) => c.published).length;
  const grouped = collections.reduce((n, c) => n + (c.productIds?.length || 0), 0);

  return (
    <div>
      <PageHead
        title="Collections"
        sub="Group products into rows you can place on your storefront."
        action={<button onClick={startNew} className="btn-green"><Plus size={15} /> New collection</button>}
      />

      <StatStrip
        items={[
          { label: 'Collections', value: collections.length },
          { label: 'Live on storefront', value: live, hint: collections.length && live === collections.length ? 'All published' : `${collections.length - live} hidden` },
          { label: 'Products featured', value: grouped },
        ]}
      />

      {editing && (
        <Editor
          draft={editing}
          products={products}
          busy={busy}
          err={err}
          onChange={setEditing}
          onCancel={() => { setEditing(null); setErr(''); }}
          onSave={save}
        />
      )}

      <Panel className="mt-5" title="Your collections">
        {loading && !collections.length ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : collections.length === 0 ? (
          <Empty
            icon={<Tag size={24} />}
            title="No collections yet"
            hint="Create one to group products — “New in”, “Under ₹999”, “Festive picks” — then add it to your storefront in the Store Editor."
            action={<button onClick={startNew} className="btn-green"><Plus size={15} /> New collection</button>}
          />
        ) : (
          <div className="space-y-3">
            {collections.map((c) => (
              <div key={c.id} className={`rounded-xl border p-4 ${c.published ? 'border-line' : 'border-dashed border-line bg-paper/50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[15px] font-extrabold text-navy">{c.title}</span>
                      <span className={c.published ? 'chip-green' : 'chip-navy'}>{c.published ? 'Live' : 'Hidden'}</span>
                      <span className="font-mono text-[11px] text-faint">/c/{c.slug}</span>
                    </div>
                    {c.description && <p className="mt-1 text-[13px] text-muted">{c.description}</p>}
                    <p className="mt-1 text-[12px] text-faint">
                      {c.productIds.length === 0
                        ? 'No products yet'
                        : `${c.productIds.length} product${c.productIds.length === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePublished(c)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-muted hover:bg-paper hover:text-navy">
                      {c.published ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => startEdit(c)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-paper">Edit</button>
                    <button onClick={() => remove(c)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-rose hover:bg-rose-soft/60">Delete</button>
                  </div>
                </div>

                {/* what's in it */}
                {c.products?.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {c.products.map((p: any) => (
                      <div key={p.id} className="w-[104px] shrink-0">
                        <div className="aspect-square overflow-hidden rounded-lg bg-paper ring-1 ring-line">
                          {p.image
                            ? <img src={p.image} alt="" className="h-full w-full object-cover" />
                            : <div className="grid h-full place-items-center text-faint"><Store size={18} /></div>}
                        </div>
                        <div className="mt-1 truncate text-[11.5px] font-semibold text-navy">{p.title}</div>
                        <div className="font-num text-[11px] text-faint">{rupees(p.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <p className="mt-4 text-[12.5px] text-muted">
        Collections appear on your storefront once you add a <b className="text-navy">Collections</b> section in the{' '}
        <a href="/seller/store-editor" className="font-semibold text-green-600 underline decoration-line">Store Editor</a>.
      </p>
    </div>
  );
}

/** Create / edit form, including the product picker. */
function Editor({
  draft, products, busy, err, onChange, onCancel, onSave,
}: {
  draft: Draft;
  products: any[];
  busy: boolean;
  err: string;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [q, setQ] = useState('');
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => `${p.title} ${p.brand || ''} ${p.category || ''}`.toLowerCase().includes(needle));
  }, [products, q]);

  const toggle = (id: string) => {
    const has = draft.productIds.includes(id);
    // Appending keeps the seller's click order as the display order.
    set('productIds', has ? draft.productIds.filter((x) => x !== id) : [...draft.productIds, id]);
  };

  return (
    <Panel className="mt-5" title={draft.id ? 'Edit collection' : 'New collection'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[13px] font-bold text-navy">Name</label>
          <input
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={60}
            autoFocus
            placeholder="e.g. New in, Under ₹999, Festive picks"
            className="c-input mt-1.5"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-navy">Description <span className="font-normal text-faint">(optional)</span></label>
          <input
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={140}
            placeholder="One line shown under the heading"
            className="c-input mt-1.5"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 text-[13px] font-semibold text-navy">
        <button
          type="button"
          onClick={() => set('published', !draft.published)}
          aria-pressed={draft.published}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${draft.published ? 'bg-green' : 'bg-line'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${draft.published ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
        Show this collection on my storefront
      </label>

      {/* product picker */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[13px] font-bold text-navy">
            Products
            <span className="ml-1.5 font-normal text-muted">
              {draft.productIds.length} selected
            </span>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your products…"
            className="c-input w-full max-w-[260px] text-[13px]"
          />
        </div>

        {products.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            You have no products yet — add one first and it&apos;ll show up here.
          </p>
        ) : (
          <div className="mt-3 grid max-h-[340px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => {
              const on = draft.productIds.includes(p.id);
              const order = draft.productIds.indexOf(p.id) + 1;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-colors ${
                    on ? 'border-green bg-green-soft/40' : 'border-line hover:border-green/40'
                  }`}
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper ring-1 ring-line">
                    {p.images
                      ? <img src={String(p.images).split(',')[0]} alt="" className="h-full w-full object-cover" />
                      : <span className="grid h-full place-items-center text-faint"><Store size={16} /></span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-navy">{p.title}</span>
                    <span className="block font-num text-[11.5px] text-faint">{rupees(p.price)}</span>
                  </span>
                  {on && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green font-num text-[10px] font-bold text-white" title={`Position ${order}`}>
                      {order}
                    </span>
                  )}
                </button>
              );
            })}
            {!shown.length && <p className="text-[13px] text-muted">Nothing matches “{q}”.</p>}
          </div>
        )}
      </div>

      {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn-green px-4 py-2 text-[13px] disabled:opacity-50">
          {busy ? 'Saving…' : draft.id ? <><Check size={15} /> Save changes</> : <><Plus size={15} /> Create collection</>}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-semibold text-muted hover:text-navy">
          Cancel
        </button>
      </div>
    </Panel>
  );
}
