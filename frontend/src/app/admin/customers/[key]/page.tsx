'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Chip, Icon, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function CustomerProfile() {
  const { key } = useParams<{ key: string }>();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.adminCustomerDetail(key).then(setD).catch((e) => setErr(e?.message || 'Not found')); }, [key]);

  if (err) return <Card className="p-6 text-rose">{err} — <Link href="/admin/customers" className="underline">back</Link></Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-line" /></div>;
  const s = d.stats;
  const vipTone = (s.vip === 'Gold' ? 'amber' : s.vip === 'Silver' ? 'navy' : 'gray') as any;

  return (
    <div className="space-y-5">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-navy"><Icon name="back" size={15} /> Customers</Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-navy text-xl font-extrabold text-green-mint">{(d.name || '?').slice(0, 2).toUpperCase()}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2"><h1 className="font-display text-[24px] font-extrabold text-navy">{d.name}</h1><Chip tone={vipTone}>{s.vip} member</Chip></div>
            <p className="text-[13px] text-muted">{d.phone || '—'} · since {new Date(s.firstOrder).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            <p className="text-[12px] text-muted">{d.address || 'No address on file'}</p>
          </div>
          <div className="flex gap-2">
            <a href={d.phone ? `tel:${d.phone}` : '#'} className="rounded-xl bg-navy px-4 py-2 text-[12.5px] font-bold text-white">Call</a>
            <button className="rounded-xl bg-rose-soft px-4 py-2 text-[12.5px] font-bold text-rose">Block</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Lifetime Value" value={money(s.ltv)} icon="rupee" accent="green" />
        <StatCard label="Avg Order" value={money(s.aov)} icon="bag" accent="navy" />
        <StatCard label="Orders" value={s.orders} icon="box" accent="navy" hint={`${s.paid} paid`} />
        <StatCard label="Refunds" value={s.refunds} icon="refund" accent={s.refunds ? 'amber' : 'green'} />
        <StatCard label="Return %" value={`${s.returnRate}%`} accent={s.returnRate > 20 ? 'rose' : 'green'} />
        <StatCard label="Tier" value={s.vip} icon="star" accent="amber" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3"><SectionTitle>Order History</SectionTitle></div>
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Order</th><th className="py-3 font-bold">Seller</th><th className="py-3 font-bold">Item</th><th className="py-3 font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold"></th></tr></thead>
          <tbody className="divide-y divide-line">
            {d.orders.map((o: any) => (
              <tr key={o.id} className="hover:bg-paper/60">
                <td className="px-4 py-3 font-bold text-navy">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="py-3 text-navy">{o.seller || '—'}</td>
                <td className="py-3 text-navy">{o.item || '—'}</td>
                <td className="py-3 font-bold text-navy">{money(o.total)}</td>
                <td className="py-3">{statusChip(o.status)}</td>
                <td className="py-3 pr-4 text-right"><Link href={`/admin/orders/${o.id}`} className="font-bold text-green-600 hover:underline">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
