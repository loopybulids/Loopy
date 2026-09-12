'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AreaTrend, Bars, Card, Chip, Donut, Icon, MetricStrip, money, num, SectionTitle, StatCard, StatTile, statusChip } from '@/components/admin/AdminKit';
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

  if (err) return <Card className="p-6 text-alert">{err} <button onClick={() => { setErr(''); load(); }} className="ml-2 underline">Retry</button></Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-hair" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-hair/60" />)}</div></div>;

  const m = d.metrics;
  const rev = d.charts.revenue;
  const today = rev.at(-1)?.value || 0, yest = rev.at(-2)?.value || 0;
  const revDelta = yest ? Math.round(((today - yest) / yest) * 100) : 0;
  /**
   * Order mix, coloured by meaning rather than by position.
   *
   * Good outcomes read in steel, in-flight ones lighter, and the two that
   * cost money — cancelled and returned — in warn and alert. A positional
   * ramp gave "Cancelled" the same friendly tint as "Delivered".
   */
  const MIX_TONE: Record<string, string> = {
    Delivered: '#1EA75B',
    Processing: '#5FC08A',
    Pending: '#A9DCC0',
    Cancelled: '#9A7B37',
    Returned: '#B4554C',
  };
  const mix = [
    { name: 'Delivered', value: d.orderMix.delivered },
    { name: 'Processing', value: d.orderMix.processing },
    { name: 'Pending', value: d.orderMix.pending },
    { name: 'Cancelled', value: d.orderMix.cancelled },
    { name: 'Returned', value: d.orderMix.returned },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[25px] font-bold tracking-[-0.02em] text-slate sm:text-[28px]">Overview</h1>
          <p className="text-[13.5px] text-dim">Across every seller on Loopy.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-hair bg-white px-3 py-2 text-[12.5px] font-semibold text-dim">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <button onClick={load} className="rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600">Refresh</button>
        </div>
      </div>

      {/* Whether the money metrics below can be trusted. */}
      <LedgerBanner ledger={d.ledger} />

      {/*
        Four money figures, not six. "Revenue", "Net profit" and "Gross profit"
        are all the commission with different refund treatments, so on most days
        they are the same number shown three times — the profit figures now ride
        under Revenue and only appear when they actually differ from it.
      */}
      {/*
        Chart on the left, the three figures that carry the screen stacked on
        the right — each with the shape of its own last fortnight. A row of
        equal cards forced every number to be read separately; this way the
        trend and the totals are one glance.
      */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            action={
              <div className="flex items-center gap-3 text-[11.5px]">
                <span className="flex items-center gap-1.5 text-dim">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Revenue
                </span>
                <span className="text-pale">Last 14 days</span>
              </div>
            }
          >
            Sales overview
          </SectionTitle>
          <AreaTrend data={rev} color="#1EA75B" money height={236} />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatTile
            label="Gross merchandise value"
            value={money(m.gmv)}
            icon="rupee"
            series={rev}
            hint="Across every seller"
            href="/admin/orders"
          />
          <StatTile
            label="Revenue (commission)"
            value={money(m.revenue)}
            icon="wallet"
            delta={revDelta}
            series={d.charts.profit}
            href="/admin/finance"
          />
          <StatTile
            label="Owed to sellers"
            value={money(m.sellerPayouts)}
            icon="store"
            hint={m.pendingRefunds ? `${money(m.pendingRefunds)} refunds pending` : 'Nothing held back'}
            tone={m.pendingRefunds ? 'warn' : 'accent'}
            href="/admin/payouts"
          />
        </div>
      </div>

      {/* Counts belong together — they are not headline figures. */}
      <MetricStrip
        items={[
          { label: 'Active orders', value: num(m.activeOrders), href: '/admin/orders' },
          { label: 'Processing', value: num(m.processingOrders), href: '/admin/orders' },
          { label: 'Delivered', value: num(m.deliveredOrders), href: '/admin/orders' },
          { label: 'Cancelled', value: num(m.cancelledOrders), href: '/admin/orders', alert: m.cancelledOrders > 0 },
          { label: 'Returns', value: num(m.returnRequests), href: '/admin/support', alert: m.returnRequests > 0 },
          { label: 'Customers', value: num(m.activeCustomers), href: '/admin/customers' },
          { label: 'Sellers', value: num(m.activeSellers), href: '/admin/sellers' },
        ]}
      />

      {/* the queue of real work, and the mix it came from */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-hair px-5 py-3.5">
            <h2 className="font-display text-[13.5px] font-bold tracking-[-0.01em] text-slate">Latest orders</h2>
            <Link href="/admin/orders" className="text-[11.5px] font-semibold text-accent hover:text-accent-600">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-hair bg-cool/60 text-[10.5px] font-bold uppercase tracking-[0.08em] text-pale">
                  <th className="px-5 py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5 text-right">Total</th>
                  <th className="py-2.5 pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {(d.recent || []).slice(0, 6).map((o: any) => (
                  <tr key={o.id} className="transition-colors hover:bg-cool/70">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-num text-[12.5px] font-medium text-slate hover:text-accent">
                        #{String(o.id).slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-3 text-dim">{o.buyer}</td>
                    <td className="py-3 font-num text-[12px] text-pale">
                      {new Date(o.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 text-right font-num font-semibold tabular-nums text-slate">{money(o.amount)}</td>
                    <td className="py-3 pr-5">{statusChip(o.status)}</td>
                  </tr>
                ))}
                {!(d.recent || []).length && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-dim">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Order mix</SectionTitle>
          <Donut data={mix} height={190} colors={mix.map((x) => MIX_TONE[x.name])} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle action={<span className="text-[11.5px] text-pale">Commission / day</span>}>Profit</SectionTitle>
          <AreaTrend data={d.charts.profit} color="#2A3341" money height={210} />
        </Card>
        <Card className="p-5">
          <SectionTitle action={<span className="text-[11.5px] text-pale">Orders / day</span>}>Order volume</SectionTitle>
          <Bars data={d.charts.orders} color="#2A3341" height={210} />
        </Card>
      </div>

      {/* top widgets */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle action={<Link href="/admin/sellers" className="text-[11.5px] font-semibold text-dim hover:text-slate">View all</Link>}>Top sellers</SectionTitle>
          <ul className="space-y-2.5">
            {d.topSellers.map((s: any, i: number) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-[11.5px] font-semibold tabular-nums text-pale">{i + 1}</span>
                <Link href={`/admin/sellers/${s.id}`} className="flex-1 truncate text-[13.5px] font-semibold text-slate hover:underline">{s.storeName || s.username}</Link>
                <span className="text-[13px] font-num font-semibold tabular-nums text-slate">{money(s.revenue)}</span>
              </li>
            ))}
            {!d.topSellers.length && <li className="text-[13px] text-dim">No sales yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle>Top products</SectionTitle>
          <ul className="space-y-2.5">
            {d.topProducts.map((p: any, i: number) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-[11.5px] font-semibold tabular-nums text-pale">{i + 1}</span>
                <span className="flex-1 truncate text-[13.5px] font-semibold text-slate">{p.title}</span>
                <span className="text-[12px] text-dim">{p.sold} sold</span>
                <span className="w-20 text-right text-[13px] font-num font-semibold tabular-nums text-slate">{money(p.revenue)}</span>
              </li>
            ))}
            {!d.topProducts.length && <li className="text-[13px] text-dim">No sales yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle>Top categories</SectionTitle>
          <Donut data={d.topCategories.map((c: any) => ({ name: c.name, value: c.revenue }))} height={170} money />
        </Card>
      </div>

      {/* AI summary + activity + health */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          {/* Was "AI Daily Summary" with an "AI" badge. It's a summary of
              today's numbers; saying who computed it adds nothing. */}
          <SectionTitle action={<span className="text-[11.5px] text-pale">Today</span>}>Needs attention</SectionTitle>
          <ul className="space-y-2.5">
            {d.aiSummary.map((l: any, i: number) => {
              const tile = l.tone === 'bad' ? 'bg-alert-soft text-alert'
                : l.tone === 'warn' ? 'bg-warn-soft text-warn'
                : l.tone === 'good' ? 'bg-accent-soft text-accent'
                : 'bg-cool text-dim';
              const glyph = l.tone === 'bad' || l.tone === 'warn' ? 'alert' : l.tone === 'good' ? 'check' : 'chart';
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tile}`}>
                    <Icon name={glyph} size={14} />
                  </span>
                  <span className="pt-1 text-[12.5px] leading-snug text-slate">{l.text}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle action={<Link href="/admin/orders" className="text-[12px] font-semibold text-accent">All orders</Link>}>Live Activity Feed</SectionTitle>
          <ul className="space-y-2.5">
            {d.recent.slice(0, 7).map((o: any) => (
              <li key={o.id} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <Link href={`/admin/orders/${o.id}`} className="font-semibold text-slate hover:text-accent">#{o.id.slice(-6).toUpperCase()}</Link>
                <span className="truncate text-dim">{o.buyer}</span>
                <span className="ml-auto shrink-0">{statusChip(o.status)}</span>
                <span className="w-16 shrink-0 text-right font-bold text-slate">{money(o.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle action={<Chip tone="green">{d.health.overall}</Chip>}>System Health</SectionTitle>
          <ul className="space-y-2.5">
            {d.health.services.map((s: any) => (
              <li key={s.name} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2 text-slate"><Icon name="pulse" size={14} className="text-accent" /> {s.name}</span>
                <Chip tone="green">{s.status}</Chip>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/admin/support" className="rounded-xl bg-cool px-3 py-2 text-center text-[12px] font-bold text-slate hover:bg-hair/60">Disputes</Link>
            <Link href="/admin/finance" className="rounded-xl bg-cool px-3 py-2 text-center text-[12px] font-bold text-slate hover:bg-hair/60">Settlements</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
