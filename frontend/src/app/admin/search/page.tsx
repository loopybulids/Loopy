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
      <div><h1 className="font-display text-[26px] font-extrabold text-slate">Global Investigation Center</h1><p className="text-[14px] text-dim">Search any order, seller, customer, phone, payment ID or AWB.</p></div>

      <div className="flex items-center gap-2 rounded-2xl border border-hair bg-white px-4 py-3 shadow-card">
        <Icon name="search" size={18} className="text-pale" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="e.g. order id, 98765…, store name, payment id, AWB" className="w-full bg-transparent text-[14px] outline-none placeholder:text-pale" />
        <button onClick={run} className="rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600">Search</button>
      </div>

      {loading && <Card className="p-6 text-center text-dim animate-pulse">Searching…</Card>}

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
