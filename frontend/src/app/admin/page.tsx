'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AreaTrend, Bars, Card, Chip, Donut, Icon, money, num, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';
import LedgerBanner from '@/components/admin/LedgerBanner';

const CACHE_KEY = 'loopy_admin_command';

export default function CommandCenter() {
  // Hydrate instantly from the last cached payload (saved at login / previous visit),
  // then refresh in the background — so analytics appear the moment you land here.
  const [d, setD] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [err, setErr] = useState('');

  const load = () =>
    api.adminCommand()
      .then((r) => { setD(r); try { localStorage.setItem(CACHE_KEY, JSON.stringify(r)); } catch {} })
      .catch((e) => { if (!d) setErr(e?.message || 'Failed to load.'); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <Card className="p-6 text-rose">{err} <button onClick={() => { setErr(''); load(); }} className="ml-2 underline">Retry</button></Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-line" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-line/60" />)}</div></div>;

  const m = d.metrics;
  const rev = d.charts.revenue;
  const today = rev.at(-1)?.value || 0, yest = rev.at(-2)?.value || 0;
  const revDelta = yest ? Math.round(((today - yest) / yest) * 100) : 0;
  const mix = [
    { name: 'Delivered', value: d.orderMix.delivered },
    { name: 'Processing', value: d.orderMix.processing },
    { name: 'Pending', value: d.orderMix.pending },
    { name: 'Cancelled', value: d.orderMix.cancelled },
    { name: 'Returned', value: d.orderMix.returned },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-extrabold text-navy sm:text-[30px]">Executive Command Center</h1>
          <p className="text-[14px] text-muted">Real-time marketplace performance across every seller.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <button onClick={load} className="rounded-xl bg-navy px-3.5 py-2 text-[12.5px] font-bold text-white">Refresh</button>
        </div>
      </div>

      {/* Whether the money metrics below can be trusted. */}
      <LedgerBanner ledger={d.ledger} />

      {/* primary money metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="GMV" value={money(m.gmv)} icon="rupee" accent="navy" hint="Gross merchandise value" href="/admin/orders" />
        <StatCard label="Revenue (Commission)" value={money(m.revenue)} icon="wallet" accent="green" delta={revDelta} href="/admin/finance" />
        <StatCard label="Net Profit" value={money(m.netProfit)} icon="bolt" accent="green" hint="After refunds" href="/admin/finance" />
        <StatCard label="Gross Profit" value={money(m.grossProfit)} icon="chart" accent="violet" href="/admin/finance" />
        <StatCard label="Seller Payouts" value={money(m.sellerPayouts)} icon="store" accent="navy" href="/admin/finance" />
        <StatCard label="Pending Refunds" value={money(m.pendingRefunds)} icon="refund" accent={m.pendingRefunds ? 'rose' : 'green'} href="/admin/support" />
      </div>

      {/* order + people metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Active Orders" value={num(m.activeOrders)} icon="bag" accent="violet" href="/admin/orders" />
        <StatCard label="Processing" value={num(m.processingOrders)} icon="truck" accent="amber" href="/admin/orders" />
        <StatCard label="Delivered" value={num(m.deliveredOrders)} icon="check" accent="green" href="/admin/orders" />
        <StatCard label="Cancelled" value={num(m.cancelledOrders)} icon="alert" accent="rose" href="/admin/orders" />
        <StatCard label="Return Requests" value={num(m.returnRequests)} icon="refund" accent="amber" href="/admin/support" />
        <StatCard label="Active Customers" value={num(m.activeCustomers)} icon="users" accent="navy" href="/admin/customers" />
        <StatCard label="Active Sellers" value={num(m.activeSellers)} icon="store" accent="navy" href="/admin/sellers" />
      </div>

      {/* charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle action={<span className="text-[12px] font-semibold text-green-600">Last 14 days</span>}>Revenue Trend</SectionTitle>
          <AreaTrend data={rev} money height={250} />
        </Card>
        <Card className="p-5">
          <SectionTitle>Order Mix</SectionTitle>
          <Donut data={mix} height={200} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle action={<span className="text-[12px] font-semibold text-violet-600">Commission / day</span>}>Profit Trend</SectionTitle>
          <AreaTrend data={d.charts.profit} color="#6366f1" money height={210} />
        </Card>
        <Card className="p-5">
          <SectionTitle action={<span className="text-[12px] font-semibold text-muted">Orders / day</span>}>Orders Volume</SectionTitle>
          <Bars data={d.charts.orders} color="#0E2A47" height={210} />
        </Card>
      </div>

      {/* top widgets */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle action={<Link href="/admin/sellers" className="text-[12px] font-semibold text-green-600">View all</Link>}>Top Sellers</SectionTitle>
          <ul className="space-y-2.5">
            {d.topSellers.map((s: any, i: number) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-paper text-[11px] font-extrabold text-navy">{i + 1}</span>
                <Link href={`/admin/sellers/${s.id}`} className="flex-1 truncate text-[13.5px] font-bold text-navy hover:text-green-600">{s.storeName || s.username}</Link>
                <span className="text-[13px] font-bold text-green-600">{money(s.revenue)}</span>
              </li>
            ))}
            {!d.topSellers.length && <li className="text-[13px] text-muted">No sales yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle>Top Products</SectionTitle>
          <ul className="space-y-2.5">
            {d.topProducts.map((p: any, i: number) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-paper text-[11px] font-extrabold text-navy">{i + 1}</span>
                <span className="flex-1 truncate text-[13.5px] font-semibold text-navy">{p.title}</span>
                <span className="text-[12px] text-muted">{p.sold} sold</span>
                <span className="w-20 text-right text-[13px] font-bold text-navy">{money(p.revenue)}</span>
              </li>
            ))}
            {!d.topProducts.length && <li className="text-[13px] text-muted">No sales yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle>Top Categories</SectionTitle>
          <Donut data={d.topCategories.map((c: any) => ({ name: c.name, value: c.revenue }))} height={170} money />
        </Card>
      </div>

      {/* AI summary + activity + health */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle action={<Chip tone="violet">AI</Chip>}>AI Daily Summary</SectionTitle>
          <ul className="space-y-2.5">
            {d.aiSummary.map((l: any, i: number) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-snug">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${l.tone === 'good' ? 'bg-green-600' : l.tone === 'warn' ? 'bg-amber' : l.tone === 'bad' ? 'bg-rose' : 'bg-navy/40'}`} />
                <span className="text-navy">{l.text}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle action={<Link href="/admin/orders" className="text-[12px] font-semibold text-green-600">All orders</Link>}>Live Activity Feed</SectionTitle>
          <ul className="space-y-2.5">
            {d.recent.slice(0, 7).map((o: any) => (
              <li key={o.id} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                <Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy hover:text-green-600">#{o.id.slice(-6).toUpperCase()}</Link>
                <span className="truncate text-muted">{o.buyer}</span>
                <span className="ml-auto shrink-0">{statusChip(o.status)}</span>
                <span className="w-16 shrink-0 text-right font-bold text-navy">{money(o.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle action={<Chip tone="green">{d.health.overall}</Chip>}>System Health</SectionTitle>
          <ul className="space-y-2.5">
            {d.health.services.map((s: any) => (
              <li key={s.name} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2 text-navy"><Icon name="pulse" size={14} className="text-green-600" /> {s.name}</span>
                <Chip tone="green">{s.status}</Chip>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/admin/support" className="rounded-xl bg-paper px-3 py-2 text-center text-[12px] font-bold text-navy hover:bg-line/60">Disputes</Link>
            <Link href="/admin/finance" className="rounded-xl bg-paper px-3 py-2 text-center text-[12px] font-bold text-navy hover:bg-line/60">Settlements</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
