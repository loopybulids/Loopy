'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Chip, Icon, money, StatCard } from '@/components/admin/AdminKit';

const vipTone = (v: string) => (v === 'Gold' ? 'amber' : v === 'Silver' ? 'navy' : 'gray') as any;

export default function CustomersCenter() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); api.adminCustomers(q).then((r) => { setRows(r); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalLtv = rows.reduce((a, c) => a + c.ltv, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-bold text-slate">Customer Operations Center</h1>
        <p className="text-[14px] text-dim">Every buyer, their value and behaviour across all sellers.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Customers" value={rows.length} icon="users" accent="navy" />
        <StatCard label="Total LTV" value={money(totalLtv)} icon="rupee" accent="green" />
        <StatCard label="Gold VIPs" value={rows.filter((c) => c.vip === 'Gold').length} icon="star" accent="amber" />
        <StatCard label="At-risk (returns)" value={rows.filter((c) => c.returnRate > 20).length} icon="alert" accent="rose" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-hair bg-white px-3 py-2">
        <Icon name="search" size={16} className="text-pale" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search by name or phone…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-pale" />
        <button onClick={load} className="rounded-lg bg-slate px-3 py-1 text-[12px] font-bold text-white">Search</button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hair text-[11px] uppercase tracking-wide text-pale">
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="py-3 font-bold">Orders</th>
                <th className="py-3 font-bold">Lifetime Value</th>
                <th className="py-3 font-bold">Avg Order</th>
                <th className="py-3 font-bold">Return %</th>
                <th className="py-3 font-bold">Tier</th>
                <th className="py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((c) => (
                <tr key={c.key} className="hover:bg-cool/60">
                  <td className="px-4 py-3"><div className="font-bold text-slate">{c.name}</div><div className="text-[11px] text-dim">{c.phone || '—'}</div></td>
                  <td className="py-3 text-slate">{c.orders} <span className="text-pale">({c.paid} paid)</span></td>
                  <td className="py-3 font-bold text-accent">{money(c.ltv)}</td>
                  <td className="py-3 text-slate">{money(c.aov)}</td>
                  <td className={`py-3 font-semibold ${c.returnRate > 20 ? 'text-alert' : 'text-slate'}`}>{c.returnRate}%</td>
                  <td className="py-3"><Chip tone={vipTone(c.vip)}>{c.vip}</Chip></td>
                  <td className="py-3 pr-4 text-right"><Link href={`/admin/customers/${encodeURIComponent(c.key)}`} className="font-bold text-accent hover:underline">Open →</Link></td>
                </tr>
              ))}
              {!loading && !rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-dim">No customers found.</td></tr>}
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-dim animate-pulse">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-hair px-4 py-3 text-[12px] text-dim">{rows.length} customers</div>
      </Card>
    </div>
  );
}
