'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Icon, money, SectionTitle, statusChip } from '@/components/admin/AdminKit';

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ orders: any[]; sellers: any[]; customers: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [orders, sellers, customers] = await Promise.all([
        api.adminOrders(q).catch(() => []),
        api.adminSellers().then((s) => s.filter((x) => `${x.storeName} ${x.username} ${x.email || ''}`.toLowerCase().includes(q.toLowerCase()))).catch(() => []),
        api.adminCustomers(q).catch(() => []),
      ]);
      setRes({ orders, sellers, customers });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[25px] font-extrabold tracking-[-0.02em] text-slate sm:text-[28px]">Search</h1>
        <p className="text-[13.5px] text-dim">Orders, sellers, customers, phone numbers, payment IDs and tracking numbers.</p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-hair bg-white px-4 py-3">
        <Icon name="search" size={18} className="shrink-0 text-pale" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Order ID, store name, phone, payment ID or AWB"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate outline-none placeholder:text-pale"
        />
        {q && (
          <button onClick={() => { setQ(''); setRes(null); }} className="shrink-0 text-[12px] font-semibold text-pale hover:text-slate">
            Clear
          </button>
        )}
        <button
          onClick={run}
          disabled={!q.trim() || loading}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-45"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Something to look at before a query is typed — the page was otherwise
          a heading above an empty screen. */}
      {!res && !loading && (
        <div className="rounded-xl border border-hair bg-white px-5 py-10 text-center">
          <div className="text-[13.5px] font-bold text-slate">Search across every seller</div>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-dim">
            Paste anything you have. Partial values work — the last six characters of an
            order reference, part of a store name, or a customer&apos;s phone number.
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
            {['S5OKP4', 'cpaybara', '98765', 'DL1234567890'].map((ex) => (
              <button
                key={ex}
                onClick={() => { setQ(ex); }}
                className="rounded-lg border border-hair bg-cool px-2.5 py-1 font-num text-[11.5px] text-dim transition-colors hover:border-accent/35 hover:text-slate"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <Card className="animate-pulse p-6 text-center text-dim">Searching…</Card>}

      {/* A query that found nothing should say so, not look like a blank page. */}
      {res && !res.orders.length && !res.sellers.length && !res.customers.length && (
        <div className="rounded-xl border border-hair bg-white px-5 py-10 text-center">
          <div className="text-[13.5px] font-bold text-slate">Nothing matched “{q}”</div>
          <p className="mt-1 text-[12.5px] text-dim">Check the spelling, or try a shorter fragment.</p>
        </div>
      )}

      {res && (
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle action={<span className="text-[12px] text-dim">{res.orders.length}</span>}>Orders</SectionTitle>
            <ul className="divide-y divide-hair">
              {res.orders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <Link href={`/admin/orders/${o.id}`} className="font-bold text-slate hover:text-accent">#{o.id.slice(-6).toUpperCase()}</Link>
                  <span className="text-dim">{o.buyerName || 'Customer'} · {o.seller}</span>
                  <span className="ml-auto">{statusChip(o.status)}</span>
                  <span className="w-16 text-right font-bold text-slate">{money(o.total)}</span>
                </li>
              ))}
              {!res.orders.length && <li className="py-2 text-[13px] text-dim">No orders.</li>}
            </ul>
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <SectionTitle action={<span className="text-[12px] text-dim">{res.sellers.length}</span>}>Sellers</SectionTitle>
              <ul className="divide-y divide-hair">
                {res.sellers.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <Link href={`/admin/sellers/${s.id}`} className="font-bold text-slate hover:text-accent">{s.storeName}</Link>
                    <span className="ml-auto font-semibold text-accent">{money(s.stats.revenue)}</span>
                  </li>
                ))}
                {!res.sellers.length && <li className="py-2 text-[13px] text-dim">No sellers.</li>}
              </ul>
            </Card>
            <Card className="p-5">
              <SectionTitle action={<span className="text-[12px] text-dim">{res.customers.length}</span>}>Customers</SectionTitle>
              <ul className="divide-y divide-hair">
                {res.customers.slice(0, 6).map((c) => (
                  <li key={c.key} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <Link href={`/admin/customers/${encodeURIComponent(c.key)}`} className="font-bold text-slate hover:text-accent">{c.name}</Link>
                    <span className="text-dim">{c.phone || ''}</span>
                    <span className="ml-auto font-semibold text-accent">{money(c.ltv)}</span>
                  </li>
                ))}
                {!res.customers.length && <li className="py-2 text-[13px] text-dim">No customers.</li>}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
