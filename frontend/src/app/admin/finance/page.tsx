'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AreaTrend, Card, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function FinanceCenter() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.adminFinance().then(setD).catch((e) => setErr(e?.message || 'Failed')); }, []);

  if (err) return <Card className="p-6 text-rose">{err}</Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-line" /></div>;
  const f = d.summary;

  const exportCsv = () => {
    const rows = [['id', 'sellerId', 'amount', 'status', 'date'], ...d.settlements.map((s: any) => [s.id, s.sellerId, s.amount, s.status, new Date(s.createdAt).toISOString()])];
    const csv = rows.map((r: any[]) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'loopy-settlements.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-[26px] font-extrabold text-navy">Finance Center</h1><p className="text-[14px] text-muted">Revenue, commission, payouts, taxes and settlements.</p></div>
        <button onClick={exportCsv} className="rounded-xl bg-navy px-4 py-2 text-[12.5px] font-bold text-white">Export settlements (CSV)</button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="GMV" value={money(f.gmv)} icon="rupee" accent="navy" />
        <StatCard label="Revenue (Commission)" value={money(f.revenue)} icon="wallet" accent="green" />
        <StatCard label="Net Profit" value={money(f.netProfit)} icon="bolt" accent="green" hint="After refunds" />
        <StatCard label="GST (est.)" value={money(f.gst)} icon="shield" accent="violet" />
        <StatCard label="Seller Earnings" value={money(f.sellerEarnings)} icon="store" accent="navy" />
        <StatCard label="Shipping Collected" value={money(f.shipping)} icon="truck" accent="navy" />
        <StatCard label="Refund Cost" value={money(f.refundCost)} icon="refund" accent={f.refundCost ? 'rose' : 'green'} />
        <StatCard label="Payouts Pending" value={money(f.payoutPending)} icon="rupee" accent={f.payoutPending ? 'amber' : 'green'} />
      </div>

      <Card className="p-5">
        <SectionTitle action={<span className="text-[12px] font-semibold text-green-600">Commission · 30 days</span>}>Cash Flow</SectionTitle>
        <AreaTrend data={d.cashflow} money height={240} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3"><SectionTitle>Seller Settlements</SectionTitle></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Settlement ID</th><th className="py-3 font-bold">Seller</th><th className="py-3 font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold">Date</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.settlements.map((s: any) => (
                <tr key={s.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{s.id.slice(-10)}</td>
                  <td className="py-3 font-mono text-[12px] text-muted">{s.sellerId.slice(-8)}</td>
                  <td className="py-3 font-bold text-navy">{money(s.amount)}</td>
                  <td className="py-3">{statusChip(s.status)}</td>
                  <td className="py-3 text-[12px] text-muted">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!d.settlements.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No settlements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
