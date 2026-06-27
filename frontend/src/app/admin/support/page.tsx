'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Chip, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function SupportCenter() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const [loading, setLoading] = useState(true);

  const load = () => api.adminDisputes().then((d) => { setDisputes(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const resolve = async (id: string, r: 'refunded' | 'released') => { await api.resolveDispute(id, r); load(); };

  const shown = tab === 'open' ? disputes.filter((d) => d.status === 'open') : disputes;
  const open = disputes.filter((d) => d.status === 'open').length;
  const priority = (d: any) => (d.issueType?.toLowerCase().includes('not') ? 'High' : 'Normal');

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-[26px] font-extrabold text-navy">Support & Dispute Center</h1><p className="text-[14px] text-muted">Resolve customer disputes and release or refund payments.</p></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Tickets" value={open} icon="headset" accent={open ? 'amber' : 'green'} />
        <StatCard label="Total Tickets" value={disputes.length} icon="bell" accent="navy" />
        <StatCard label="Refunded" value={disputes.filter((d) => d.status === 'refunded').length} icon="refund" accent="rose" />
        <StatCard label="Released" value={disputes.filter((d) => d.status === 'released').length} icon="check" accent="green" />
      </div>

      <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
        {(['open', 'all'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-bold capitalize ${tab === t ? 'bg-navy text-white' : 'text-muted'}`}>{t === 'open' ? `Open (${open})` : 'All'}</button>)}
      </div>

      <div className="space-y-3">
        {loading && <Card className="p-6 text-center text-muted animate-pulse">Loading tickets…</Card>}
        {!loading && !shown.length && <Card className="p-8 text-center text-muted">No {tab === 'open' ? 'open ' : ''}tickets. 🎉</Card>}
        {shown.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-muted">TKT-{d.id.slice(-6).toUpperCase()}</span>
                <Chip tone={priority(d) === 'High' ? 'rose' : 'gray'}>{priority(d)} priority</Chip>
                {statusChip(d.status)}
              </div>
              <Link href={`/admin/orders/${d.orderId}`} className="text-[12px] font-bold text-green-600 hover:underline">Order #{d.orderId.slice(-6).toUpperCase()} →</Link>
            </div>
            <div className="mt-2 text-[14px] font-bold text-navy">{d.issueType}</div>
            <p className="mt-0.5 text-[13px] text-muted">{d.description || 'No description provided.'}</p>
            <div className="mt-1 text-[12px] text-faint">Raised by {d.buyerName || 'customer'} · {new Date(d.createdAt).toLocaleString('en-IN')}</div>
            {d.status === 'open' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => resolve(d.id, 'released')} className="rounded-xl bg-paper px-4 py-2 text-[12.5px] font-bold text-navy hover:bg-line/60">Release to seller</button>
                <button onClick={() => resolve(d.id, 'refunded')} className="rounded-xl bg-rose-soft px-4 py-2 text-[12.5px] font-bold text-rose">Refund customer</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
