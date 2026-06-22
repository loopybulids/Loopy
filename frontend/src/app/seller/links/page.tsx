'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Check, Plus, Share, Tag } from '@/components/icons';

/**
 * Checkout-link generator — the core DM2Order differentiator.
 * Seller picks a product + quantity → we mint a shareable link that drops the
 * item straight into the buyer's cart. (Client-side for now.)
 */
export default function CheckoutLinks() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pid, setPid] = useState('');
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.myProducts().then((p) => {
      setProducts(p || []);
      if (p?.[0]) setPid(p[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const product = products.find((p) => p.id === pid);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const link = useMemo(
    () => (product ? `${origin}/product/${product.id}?qty=${qty}&via=link` : ''),
    [origin, product, qty],
  );

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const share = (channel: 'whatsapp' | 'instagram' | 'copy') => {
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
    else if (channel === 'instagram') window.open('https://instagram.com', '_blank');
    else copy();
  };

  return (
    <div>
      <PageHead title="Checkout links" sub="Turn any DM into a paid order — generate a link, paste it in chat, get paid." />

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
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Product</label>
            <select value={pid} onChange={(e) => setPid(e.target.value)} className="c-input mt-1.5">
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.name} — {money(p.price)}</option>
              ))}
            </select>

            <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Quantity</label>
            <div className="mt-1.5 flex items-center gap-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft">–</button>
              <input value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="c-input w-20 text-center" />
              <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft">+</button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-green-soft px-4 py-3 ring-1 ring-green/15">
              <span className="text-[13px] font-semibold text-navy/80">Order total</span>
              <span className="font-display text-[20px] font-extrabold text-green-600">{money((product?.price || 0) * qty)}</span>
            </div>
          </Panel>

          {/* preview + share */}
          <Panel title="Shareable link">
            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Your link</div>
              <div className="mt-2 break-all font-mono text-[13px] text-green-600">{link}</div>
            </div>

            <button onClick={copy} className="btn-green mt-4 w-full justify-center">
              {copied ? <><Check size={16} /> Copied!</> : <><Share size={16} /> Copy link</>}
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => share('whatsapp')} className="btn-ghost">WhatsApp</button>
              <button onClick={() => share('instagram')} className="btn-ghost">Instagram</button>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              When your customer opens this link, the item is pre-added to their cart and they check out with escrow protection. The order shows up in your dashboard automatically.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
