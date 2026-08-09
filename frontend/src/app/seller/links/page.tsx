'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Check, Plus, Share, Tag } from '@/components/icons';

/**
 * Checkout-link generator — the core DM2Order differentiator.
 *
 * The seller builds a basket (any number of products, each with a quantity) and
 * we mint one link that pre-fills the buyer's cart on their storefront.
 *
 * The link points at `/s/<username>/cart?add=<id>:<qty>,…` — it carries ids and
 * quantities only. Prices are resolved from the live catalogue when the buyer
 * opens it, so a link can never be edited to change what something costs.
 */

type Row = { pid: string; qty: number };

export default function CheckoutLinks() {
  const [products, setProducts] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.myProducts().catch(() => []),
      api.myProfile().catch(() => null),
    ]).then(([p, profile]) => {
      const list = p || [];
      setProducts(list);
      setUsername(profile?.username || '');
      if (list[0]) setRows([{ pid: list[0].id, qty: 1 }]);
      setLoading(false);
    });
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, n) => (n === i ? { ...row, ...patch } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, n) => n !== i));
  const addRow = () => {
    // default to the first product not already in the basket
    const used = new Set(rows.map((r) => r.pid));
    const next = products.find((p) => !used.has(p.id)) || products[0];
    if (next) setRows((r) => [...r, { pid: next.id, qty: 1 }]);
  };

  const total = rows.reduce((s, r) => s + (byId.get(r.pid)?.price || 0) * r.qty, 0);
  const itemCount = rows.reduce((s, r) => s + r.qty, 0);
  const allUsed = rows.length >= products.length;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const link = useMemo(() => {
    if (!username || !rows.length) return '';
    // Merge duplicate picks of the same product into one id:qty pair.
    const merged = new Map<string, number>();
    for (const r of rows) if (byId.has(r.pid)) merged.set(r.pid, (merged.get(r.pid) || 0) + r.qty);
    if (!merged.size) return '';
    const add = [...merged].map(([id, q]) => `${id}:${q}`).join(',');
    return `${origin}/s/${username}/cart?add=${add}`;
  }, [origin, username, rows, byId]);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const share = (channel: 'whatsapp' | 'instagram') => {
    if (!link) return;
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
    else window.open('https://instagram.com', '_blank');
  };

  return (
    <div>
      <PageHead title="Checkout links" sub="Turn any DM into a paid order — build a basket, paste the link in chat, get paid." />

      {loading ? (
        <Panel><p className="py-8 text-center text-[13px] text-faint">Loading your catalog…</p></Panel>
      ) : products.length === 0 ? (
        <Panel>
          <Empty
            icon={<Tag size={24} />}
            title="Add a product first"
            hint="You need at least one product to generate a checkout link."
            action={<Link href="/seller/products/new" className="btn-green"><Plus size={15} /> Add a product</Link>}
          />
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* builder */}
          <Panel title="Build a link">
            <div className="space-y-3">
              {rows.map((row, i) => {
                const p = byId.get(row.pid);
                return (
                  <div key={i} className="rounded-xl border border-line bg-paper/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-faint">Item {i + 1}</span>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(i)} className="text-[12px] font-semibold text-rose hover:underline">Remove</button>
                      )}
                    </div>

                    <select
                      value={row.pid}
                      onChange={(e) => setRow(i, { pid: e.target.value })}
                      className="c-input mt-2"
                    >
                      {products.map((p2) => (
                        <option key={p2.id} value={p2.id}>{p2.title || p2.name} — {money(p2.price)}</option>
                      ))}
                    </select>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button onClick={() => setRow(i, { qty: Math.max(1, row.qty - 1) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft">–</button>
                      <input
                        value={row.qty}
                        onChange={(e) => setRow(i, { qty: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
                        inputMode="numeric"
                        className="c-input w-16 py-2 text-center"
                      />
                      <button onClick={() => setRow(i, { qty: Math.min(99, row.qty + 1) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft">+</button>
                      <span className="ml-auto text-[13px] font-bold text-navy">{money((p?.price || 0) * row.qty)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addRow}
              disabled={allUsed}
              title={allUsed ? 'Every product is already in this link' : undefined}
              className="btn-ghost mt-3 w-full justify-center disabled:opacity-50"
            >
              <Plus size={15} /> Add another product
            </button>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-green-soft px-4 py-3 ring-1 ring-green/15">
              <span className="text-[13px] font-semibold text-navy/80">
                Order total <span className="text-faint">· {itemCount} item{itemCount === 1 ? '' : 's'}</span>
              </span>
              <span className="font-display text-[20px] font-extrabold text-green-600">{money(total)}</span>
            </div>
          </Panel>

          {/* preview + share */}
          <Panel title="Shareable link">
            {!username ? (
              <div className="rounded-xl border border-dashed border-line bg-paper p-4 text-[13px] text-muted">
                Set a store handle in <Link href="/seller/profile" className="font-bold text-green-600 hover:underline">Profile</Link> to generate checkout links.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Your link</div>
                  <div className="mt-2 break-all font-mono text-[12.5px] text-green-600">{link}</div>
                </div>

                <button onClick={copy} disabled={!link} className="btn-green mt-4 w-full justify-center disabled:opacity-60">
                  {copied ? <><Check size={16} /> Copied!</> : <><Share size={16} /> Copy link</>}
                </button>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => share('whatsapp')} disabled={!link} className="btn-ghost disabled:opacity-60">WhatsApp</button>
                  <button onClick={() => share('instagram')} disabled={!link} className="btn-ghost disabled:opacity-60">Instagram</button>
                </div>
              </>
            )}

            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              Opening this link drops all {itemCount} item{itemCount === 1 ? '' : 's'} into your customer&apos;s cart, ready to check out with escrow protection. The order lands in your dashboard automatically. Prices are read from your live catalogue when they open it, so the link can&apos;t be tampered with.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
