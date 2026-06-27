'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AreaTrend, Card, Chip, Icon, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'payouts'>('overview');

  const load = () => api.adminSellerDetail(id).then(setD).catch((e) => setErr(e?.message || 'Not found'));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const kyc = async (ok: boolean) => { ok ? await api.approveSeller(id) : await api.rejectSeller(id); load(); };

  if (err) return <Card className="p-6 text-rose">{err} — <Link href="/admin/sellers" className="underline">back</Link></Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-line" /></div>;
  const s = d.stats;
  const scoreTone = s.score >= 75 ? 'green' : s.score >= 50 ? 'amber' : 'rose';

  return (
    <div className="space-y-5">
      <Link href="/admin/sellers" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-navy"><Icon name="back" size={15} /> Sellers</Link>

      {/* header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-navy text-xl font-extrabold text-white">{(d.storeName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h1 className="font-display text-[24px] font-extrabold text-navy">{d.storeName}</h1>{statusChip(d.kycStatus)}</div>
            <p className="text-[13px] text-muted">@{d.username} · {d.city || '—'} · joined {new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            <p className="text-[12px] text-muted">{d.email || '—'} · {d.phone || '—'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2"><span className="font-display text-[28px] font-extrabold text-navy">{s.score}</span><Chip tone={scoreTone as any}>Health</Chip></div>
            <div className="text-[12px] text-muted">{(d.rating || 0).toFixed(1)} ★ ({d.ratingCount})</div>
          </div>
        </div>
        {/* action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {d.kycStatus !== 'approved' && <button onClick={() => kyc(true)} className="rounded-xl bg-navy px-4 py-2 text-[12.5px] font-bold text-white">Approve Seller</button>}
          {d.kycStatus !== 'rejected' && <button onClick={() => kyc(false)} className="rounded-xl bg-rose-soft px-4 py-2 text-[12.5px] font-bold text-rose">Suspend Seller</button>}
          <a href={d.email ? `mailto:${d.email}` : '#'} className="rounded-xl bg-paper px-4 py-2 text-[12.5px] font-bold text-navy">Message Seller</a>
          <Link href={`/admin/sellers/${id}`} className="rounded-xl bg-paper px-4 py-2 text-[12.5px] font-bold text-navy">Financial Report</Link>
        </div>
      </Card>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Revenue" value={money(s.revenue)} icon="rupee" accent="green" />
        <StatCard label="Commission" value={money(s.commission)} icon="wallet" accent="violet" />
        <StatCard label="Wallet" value={money(s.wallet)} icon="wallet" accent="navy" />
        <StatCard label="Pending Payout" value={money(s.payoutPending)} icon="rupee" accent={s.payoutPending ? 'amber' : 'green'} />
        <StatCard label="Orders" value={s.orders} icon="bag" accent="navy" hint={`${s.delivered} delivered`} />
        <StatCard label="Products" value={s.products} icon="box" accent="navy" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Cancellation %" value={`${s.cancelRate}%`} accent={s.cancelRate > 15 ? 'rose' : 'green'} />
        <StatCard label="Refund %" value={`${s.refundRate}%`} accent={s.refundRate > 10 ? 'rose' : 'green'} />
        <StatCard label="Customers" value={s.customers} accent="navy" />
        <StatCard label="Disputes" value={s.disputes} accent={s.disputes ? 'amber' : 'green'} />
      </div>

      {/* tabs */}
      <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
        {(['overview', 'products', 'orders', 'payouts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-bold capitalize ${tab === t ? 'bg-navy text-white' : 'text-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && <Card className="p-5"><SectionTitle action={<span className="text-[12px] font-semibold text-green-600">Last 14 days</span>}>Revenue Trend</SectionTitle><AreaTrend data={d.series} money height={240} /></Card>}

      {tab === 'products' && (
        <Card className="overflow-hidden">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Product</th><th className="py-3 font-bold">Price</th><th className="py-3 font-bold">Stock</th><th className="py-3 font-bold">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.products.map((p: any) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="h-9 w-9 overflow-hidden rounded-lg bg-paper">{p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}</span><span className="font-semibold text-navy">{p.title}</span></div></td>
                  <td className="py-3 font-bold text-navy">{money(p.price)}</td>
                  <td className="py-3 text-navy">{p.quantity}</td>
                  <td className="py-3">{p.isActive ? <Chip tone="green">Active</Chip> : <Chip tone="gray">Hidden</Chip>}</td>
                </tr>
              ))}
              {!d.products.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No products.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'orders' && (
        <Card className="overflow-hidden">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Order</th><th className="py-3 font-bold">Customer</th><th className="py-3 font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold"></th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-bold text-navy">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="py-3 text-navy">{o.buyer || 'Customer'}</td>
                  <td className="py-3 font-bold text-navy">{money(o.total)}</td>
                  <td className="py-3">{statusChip(o.status)}</td>
                  <td className="py-3 pr-4 text-right"><Link href={`/admin/orders/${o.id}`} className="font-bold text-green-600 hover:underline">View →</Link></td>
                </tr>
              ))}
              {!d.orders.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No orders.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'payouts' && (
        <Card className="overflow-hidden">
          <table className="w-full min-w-[400px] text-left text-[13px]">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Payout</th><th className="py-3 font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold">Date</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.payouts.map((p: any) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{p.id.slice(-8)}</td>
                  <td className="py-3 font-bold text-navy">{money(p.amount)}</td>
                  <td className="py-3">{statusChip(p.status)}</td>
                  <td className="py-3 text-[12px] text-muted">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!d.payouts.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No payouts.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
