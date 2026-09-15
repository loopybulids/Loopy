'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { BuyerAvatar, StatCard, StatStrip, Panel, Empty, money } from '@/components/seller-ui';
import { AreaTrend } from '@/components/admin/AdminKit';
import { Bag, Check, Eye, Plus, Share, Star, Users, Wallet } from '@/components/icons';

export default function Dashboard() {
  /**
   * One request, and one cached bundle.
   *
   * The server assembles orders, wallet, analytics and onboarding in parallel
   * (see getDashboard), so this is a single round trip rather than four
   * competing ones. The result is remembered under one key, so returning to
   * the dashboard paints every card from the last visit on the first frame and
   * refreshes behind it.
   */
  const { data, loading, error, refreshing, reload } = useApiData('seller:dashboard', () =>
    api.myDashboard().then((d: any) => ({
      orders: d?.orders || [],
      wallet: d?.wallet ?? null,
      an: d?.analytics ?? null,
      ob: d?.onboarding ?? null,
    })),
  );

  const orders: any[] = data?.orders ?? [];
  const wallet = data?.wallet ?? null;
  const an = data?.an ?? null;
  const ob = data?.ob ?? null;

  const revenue = an?.revenue ?? 0;
  // Earned across the store's whole history, straight from the wallet so the
  // dashboard and the payments page can never disagree.
  const lifetime = wallet?.lifetime ?? 0;
  const showChecklist = ob && ob.done < ob.total;

  return (
    <div className="space-y-6">
      {/*
        A failed load must say so. Every card falls back to 0, so without this
        a dead API looks exactly like a store that has made no sales — which is
        indistinguishable from real data and far worse than an error.
      */}
      {error && !data && (
        <div className="rounded-xl border border-rose/40 bg-rose-soft/60 px-4 py-3">
          <div className="text-[13.5px] font-bold text-navy">Couldn&apos;t load your dashboard</div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {error} — the figures below are not real.
          </p>
          <button onClick={() => reload()} className="mt-2 rounded-lg bg-navy px-3 py-1.5 text-[12px] font-bold text-white">
            Try again
          </button>
        </div>
      )}

      {/* onboarding checklist */}
      {showChecklist && <Onboarding ob={ob} />}

      {/*
        Skeletons while the first load is in flight.
        Rendering `0` during loading is indistinguishable from a store that
        genuinely has no sales — which made "is it broken or is it empty?"
        impossible to answer by looking at the screen.
      */}
      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card px-4 py-3.5">
              <div className="h-3 w-24 animate-pulse rounded bg-line" />
              <div className="mt-2 h-5 w-20 animate-pulse rounded bg-line" />
              <div className="mt-2 h-3 w-16 animate-pulse rounded bg-line/70" />
            </div>
          ))}
        </div>
      ) : (
      <>
      {/* Money first, three across — the figures a seller opens this page for. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* All-time earnings first: it's the number sellers actually look for.
            Same formula as the wallet — delivered orders, net of discounts. */}
        <StatCard label="All-time earnings" value={money(lifetime)} delta={lifetime ? 'Delivered orders' : 'Nothing delivered yet'} icon={<Wallet size={18} />} accent href="/seller/payments" />
        <StatCard label="Revenue" value={money(revenue)} delta={revenue ? `${an?.paidOrders ?? 0} paid orders` : 'No sales yet'} icon={<Wallet size={18} />} href="/seller/payments" />
        <StatCard label="Orders" value={an?.orders ?? orders.length} delta={`${an?.paidOrders ?? 0} paid`} icon={<Bag size={18} />} href="/seller/orders" />
      </div>

      {/*
        Store activity as one divided strip of four.
        Seven cards in a six-column grid left the seventh alone on its own row
        beside a screen's width of nothing — and these are context, not
        headline figures, so they don't need a card each.
      */}
      <StatStrip
        cols={4}
        items={[
          { label: 'Customers', value: an?.customers ?? 0, hint: 'Unique buyers', href: '/seller/customers' },
          { label: 'Store visits', value: an?.totalVisits ?? 0, hint: `${an?.visitsToday ?? 0} today` },
          { label: 'Live now', value: an?.liveUsers ?? 0, hint: `${an?.conversion ?? 0}% visit→order`, live: true },
          { label: 'Rating', value: an?.avgRating ? `${an.avgRating}★` : '—', hint: `${an?.reviewCount ?? 0} reviews`, href: '/seller/reviews' },
        ]}
      />
      </>
      )}

      {/* Which store these figures belong to — two stores can share a name. */}
      {data && (
        <p className="-mt-2 text-[11.5px] text-faint">
          Showing {ob?.published ? 'live' : 'draft'} store data
          {refreshing ? ' · refreshing…' : ''}
        </p>
      )}

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue · 14 days" action={<span className="chip-green">{money(revenue)}</span>}>
          {an ? <AreaTrend data={an.revenueSeries} money height={210} /> : <Skel />}
        </Panel>
        <Panel title="Traffic · 14 days" action={<span className="chip-navy">{an?.totalVisits ?? 0} visits</span>}>
          {an ? <AreaTrend data={an.trafficSeries} color="#1B4B79" height={210} /> : <Skel />}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Orders · 14 days">
          {an ? <AreaTrend data={an.ordersSeries} color="#15784A" height={200} /> : <Skel />}
        </Panel>
        <Panel title="Traffic sources" action={<span className="chip-navy">{an?.totalVisits ?? 0} visits</span>}>
          {an?.sources?.length ? (
            <ul className="space-y-3">
              {an.sources.map((s: any) => {
                const pct = an.totalVisits ? Math.round((s.value / an.totalVisits) * 100) : 0;
                return (
                  <li key={s.name}>
                    <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-semibold text-navy">{s.name}</span><span className="text-muted">{s.value} · {pct}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="py-8 text-center text-[13px] text-faint">No visits yet. Share your store link to see where traffic comes from.</p>}
        </Panel>
      </div>

      <Panel title="Payouts">
        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Available balance" value={money(wallet?.available ?? 0)} strong />
          <Row label="Pending (in escrow)" value={money(wallet?.pending ?? 0)} />
          <Row label="Paid out" value={money(wallet?.settled ?? 0)} />
          <Row label="Lifetime earnings" value={money(wallet?.lifetime ?? 0)} />
        </div>
        <Link href="/seller/payments" className="btn-green mt-5 w-fit">Go to payouts</Link>
      </Panel>

      {/* recent orders */}
      <Panel title="Recent orders" action={<Link href="/seller/orders" className="text-[13px] font-bold text-green-600 hover:underline">View all</Link>}>
        {loading ? <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
          : orders.length === 0 ? (
            <Empty icon={<Share size={24} />} title="No orders yet" hint="Generate your first checkout link, share it in a DM, and orders will land right here."
              action={<Link href="/seller/links" className="btn-green"><Plus size={15} /> Create a checkout link</Link>} />
          ) : (
            <div className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-3">
                  <BuyerAvatar name={o.buyerName || o.buyer?.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14px] font-bold text-navy">{o.buyerName || o.buyer?.name || 'Customer'}</div>
                    <div className="truncate font-num text-[12px] text-faint">#{String(o.id).slice(-6).toUpperCase()}</div>
                  </div>
                  <span className="text-[13px] font-bold text-navy">{money(o.total || o.totalAmount || o.amount || 0)}</span>
                  <span className="chip-green ml-2">{o.status}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}

function Onboarding({ ob }: { ob: any }) {
  const pct = Math.round((ob.done / ob.total) * 100);
  return (
    <div className="card overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[17px] font-bold text-navy">Complete your store setup</h2>
          <p className="text-[13px] text-muted">Finish these steps to launch your brand.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} /></div>
          <span className="font-display text-[13px] font-bold text-navy">{ob.done} of {ob.total}</span>
        </div>
      </div>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ob.steps.map((s: any) => (
          <Link key={s.key} href={s.href} className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${s.done ? 'border-green/20 bg-green-soft/40' : 'border-line bg-white hover:border-green-600/40'}`}>
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? 'bg-green-600 text-white' : 'border-2 border-line'}`}>{s.done && <Check size={14} />}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-bold text-navy">{s.label}</span>
                {s.done
                  ? <span className="chip-green !py-0 text-[10px]">Done</span>
                  : s.progress && <span className="chip-amber !py-0 text-[10px]">{s.progress}</span>}
              </div>
              <p className="text-[12px] text-muted">{s.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`font-display font-bold ${strong ? 'text-[19px] text-green-600' : 'text-[15px] text-navy'}`}>{value}</span>
    </div>
  );
}

function Skel() { return <div className="h-[200px] animate-pulse rounded-lg bg-paper" />; }
