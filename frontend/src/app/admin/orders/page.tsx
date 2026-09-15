'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Icon, money, statusChip } from '@/components/admin/AdminKit';
import ExportMenu from '@/components/admin/ExportMenu';
import RangePicker from '@/components/admin/RangePicker';
import { rangeDates, rangeLabel, rangeQuery, useAdminRange } from '@/lib/admin-range';

const TABS = ['all', 'PendingPayment', 'Paid', 'Accepted', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

export default function OrdersCenter() {
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useAdminRange();
  const query = rangeQuery(range);
  // The search behind the rows on screen. A search spans every date — see
  // AdminService.orders — so the footer has to say so.
  const [searched, setSearched] = useState('');
  const latest = useRef(0);

  const load = () => {
    const run = ++latest.current;
    const term = q.trim();
    setLoading(true);
    api.adminOrders(term, tab, query)
      .then((r) => { if (run === latest.current) { setRows(r); setSearched(term); } })
      .catch(() => {})
      .finally(() => { if (run === latest.current) setLoading(false); });
  };
  useEffect(() => { load(); }, [tab, query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate">Orders Control Center</h1>
          <p className="text-[14px] text-dim">Every order across all sellers — search, filter and investigate.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker range={range} onChange={setRange} />
          <ExportMenu range={range} datasets={['orders', 'summary']} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-hair bg-white px-3 py-2">
          <Icon name="search" size={16} className="text-pale" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Order ID, customer, phone, seller, payment ID, AWB…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-pale" />
          <button onClick={load} className="rounded-lg bg-slate px-3 py-1 text-[12px] font-bold text-white">Search</button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold capitalize ${tab === t ? 'bg-slate text-white' : 'bg-white text-dim hover:bg-cool'}`}>
            {t === 'all' ? 'All' : t === 'PendingPayment' ? 'Pending' : t}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hair text-[11px] uppercase tracking-wide text-pale">
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="py-3 font-bold">Customer</th>
                <th className="py-3 font-bold">Seller</th>
                <th className="py-3 font-bold">Item</th>
                <th className="py-3 font-bold">Amount</th>
                <th className="py-3 font-bold">Status</th>
                <th className="py-3 font-bold">Date</th>
                <th className="py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-cool/60">
                  <td className="px-4 py-3 font-bold text-slate">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="py-3"><div className="font-semibold text-slate">{o.buyerName || 'Customer'}</div><div className="text-[11px] text-dim">{o.buyerPhone || '—'}</div></td>
                  <td className="py-3 text-slate">{o.seller || '—'}</td>
                  <td className="py-3"><span className="text-slate">{o.firstItem}</span>{o.itemCount > 1 && <span className="text-dim"> +{o.itemCount - 1}</span>}</td>
                  <td className="py-3 font-bold text-slate">{money(o.total)}</td>
                  <td className="py-3">{statusChip(o.status)}</td>
                  <td className="py-3 text-[12px] text-dim">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</td>
                  <td className="py-3 pr-4 text-right"><Link href={`/admin/orders/${o.id}`} className="font-bold text-accent hover:underline">Investigate →</Link></td>
                </tr>
              ))}
              {!loading && !rows.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-dim">{searched ? 'No orders match that search.' : `No orders in this period (${rangeDates(range)}).`}</td></tr>}
              {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-dim animate-pulse">Loading orders…</td></tr>}
            </tbody>
          </table>
        </div>
        {!loading && <div className="border-t border-hair px-4 py-3 text-[12px] text-dim">{rows.length} {rows.length === 1 ? 'order' : 'orders'} · {searched ? `matching “${searched}” across all dates` : rangeLabel(range)}</div>}
      </Card>
    </div>
  );
}
