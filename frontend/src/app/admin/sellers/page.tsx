'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { impersonateSeller } from '@/lib/impersonate';
import { Card, Icon, money, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function SellersCenter() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.adminSellers().then((s) => { setSellers(s); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const kyc = async (id: string, ok: boolean) => { ok ? await api.approveSeller(id) : await api.rejectSeller(id); load(); };

  const shown = q ? sellers.filter((s) => `${s.storeName} ${s.username} ${s.email || ''}`.toLowerCase().includes(q.toLowerCase())) : sellers;
  const totals = sellers.reduce((a, s) => ({ revenue: a.revenue + s.stats.revenue, commission: a.commission + s.stats.commission, orders: a.orders + s.stats.orders }), { revenue: 0, commission: 0, orders: 0 });
  const pending = sellers.filter((s) => s.kycStatus === 'pending').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-extrabold text-navy">Seller Operations Center</h1>
        <p className="text-[14px] text-muted">Every seller, their performance and verification — in one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Sellers" value={sellers.length} icon="store" accent="navy" />
        <StatCard label="Pending KYC" value={pending} icon="shield" accent={pending ? 'amber' : 'green'} />
        <StatCard label="Seller Revenue" value={money(totals.revenue)} icon="rupee" accent="green" />
        <StatCard label="Commission" value={money(totals.commission)} icon="wallet" accent="violet" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
        <Icon name="search" size={16} className="text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by store, username or email…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-bold">Seller</th>
                <th className="py-3 font-bold">Products</th>
                <th className="py-3 font-bold">Orders</th>
                <th className="py-3 font-bold">Delivered</th>
                <th className="py-3 font-bold">Customers</th>
                <th className="py-3 font-bold">Revenue</th>
                <th className="py-3 font-bold">Commission</th>
                <th className="py-3 font-bold">KYC</th>
                <th className="py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((s) => (
                <tr key={s.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy text-[11px] font-extrabold text-white">{(s.storeName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0"><Link href={`/admin/sellers/${s.id}`} className="block truncate font-bold text-navy hover:text-green-600">{s.storeName}</Link><div className="truncate text-[11px] text-muted">{s.email || s.username}</div></div>
                    </div>
                  </td>
                  <td className="py-3 text-navy">{s.stats.products}</td>
                  <td className="py-3 text-navy">{s.stats.orders} <span className="text-faint">({s.stats.paidOrders} paid)</span></td>
                  <td className="py-3 text-navy">{s.stats.delivered}</td>
                  <td className="py-3 text-navy">{s.stats.customers}</td>
                  <td className="py-3 font-semibold text-navy">{money(s.stats.revenue)}</td>
                  <td className="py-3 text-green-600">{money(s.stats.commission)}</td>
                  <td className="py-3">{statusChip(s.kycStatus)}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.kycStatus !== 'approved' && <button onClick={() => kyc(s.id, true)} className="rounded-lg bg-navy px-3 py-1.5 text-[11px] font-bold text-white">Approve</button>}
                      <button onClick={() => impersonateSeller(s.id)} className="rounded-lg bg-green-soft px-3 py-1.5 text-[11px] font-bold text-green-600">Log in</button>
                      <Link href={`/admin/sellers/${s.id}`} className="font-bold text-green-600 hover:underline">Open →</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !shown.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted">No sellers found.</td></tr>}
              {loading && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted animate-pulse">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-3 text-[12px] text-muted">{shown.length} of {sellers.length} sellers</div>
      </Card>
    </div>
  );
}
