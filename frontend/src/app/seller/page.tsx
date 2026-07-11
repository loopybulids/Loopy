'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatCard, Panel, Empty, money } from '@/components/seller-ui';
import { AreaTrend } from '@/components/admin/AdminKit';
import { Bag, Check, Eye, Plus, Share, Star, Users, Wallet } from '@/components/icons';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [an, setAn] = useState<any>(null);
  const [ob, setOb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    api.myOrders().catch(() => []),
    api.myWallet().catch(() => null),
    api.myAnalytics().catch(() => null),
    api.myOnboarding().catch(() => null),
  ]).then(([o, w, a, on]) => { setOrders(o || []); setWallet(w); setAn(a); setOb(on); setLoading(false); });
  useEffect(() => { load(); }, []);

  const revenue = an?.revenue ?? 0;
  const showChecklist = ob && ob.done < ob.total;

  return (
    <div className="space-y-6">
      {/* onboarding checklist */}
      {showChecklist && <Onboarding ob={ob} />}

      {/* metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Revenue" value={money(revenue)} delta={revenue ? 'Paid orders' : 'No sales yet'} icon={<Wallet size={18} />} accent href="/seller/payments" />
        <StatCard label="Orders" value={an?.orders ?? orders.length} delta={`${an?.paidOrders ?? 0} paid`} icon={<Bag size={18} />} href="/seller/orders" />
        <StatCard label="Customers" value={an?.customers ?? 0} delta="Unique buyers" icon={<Users size={18} />} href="/seller/customers" />
        <StatCard label="Store visits" value={an?.totalVisits ?? 0} delta={`${an?.visitsToday ?? 0} today`} icon={<Eye size={18} />} />
        <LiveCard live={an?.liveUsers ?? 0} conversion={an?.conversion ?? 0} />
        <StatCard label="Rating" value={an?.avgRating ? `${an.avgRating}★` : '—'} delta={`${an?.reviewCount ?? 0} reviews`} icon={<Star size={18} />} href="/seller/reviews" />
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue · 14 days" action={<span className="chip-green">{money(revenue)}</span>}>
          {an ? <AreaTrend data={an.revenueSeries} money height={210} /> : <Skel />}
        </Panel>
        <Panel title="Traffic · 14 days" action={<span className="chip-navy">{an?.totalVisits ?? 0} visits</span>}>
          {an ? <AreaTrend data={an.trafficSeries} color="#1B4B79" height={210} /> : <Skel />}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Orders · 14 days">
          {an ? <AreaTrend data={an.ordersSeries} color="#15784A" height={200} /> : <Skel />}
        </Panel>
        <Panel title="Payouts">
          <div className="space-y-4">
            <Row label="Available balance" value={money(wallet?.available ?? 0)} strong />
            <Row label="Held (in escrow)" value={money(wallet?.held ?? 0)} />
            <Row label="Paid out" value={money(wallet?.paidOut ?? 0)} />
          </div>
          <Link href="/seller/payments" className="btn-green mt-5 w-full justify-center">Go to payouts</Link>
        </Panel>
      </div>

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
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Bag size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14px] font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                    <div className="truncate text-[12px] text-faint">{o.buyerName || o.buyer?.name || 'Customer'}</div>
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
          <h2 className="font-display text-[17px] font-extrabold text-navy">Complete your store setup</h2>
          <p className="text-[13px] text-muted">Finish these steps to launch your brand.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} /></div>
          <span className="font-display text-[13px] font-extrabold text-navy">{ob.done} of {ob.total}</span>
        </div>
      </div>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ob.steps.map((s: any) => (
          <Link key={s.key} href={s.href} className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${s.done ? 'border-green/20 bg-green-soft/40' : 'border-line bg-white hover:border-green-600/40'}`}>
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? 'bg-green-600 text-white' : 'border-2 border-line'}`}>{s.done && <Check size={14} />}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="text-[13.5px] font-bold text-navy">{s.label}</span>{s.done && <span className="chip-green !py-0 text-[10px]">Done</span>}</div>
              <p className="text-[12px] text-muted">{s.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LiveCard({ live, conversion }: { live: number; conversion: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wide text-faint">Live now</span>
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" /></span>
      </div>
      <div className="mt-3 font-display text-[28px] font-extrabold text-navy">{live}</div>
      <div className="mt-1 text-[12px] font-semibold text-green-600">{conversion}% visit→order</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`font-display font-extrabold ${strong ? 'text-[19px] text-green-600' : 'text-[15px] text-navy'}`}>{value}</span>
    </div>
  );
}

function Skel() { return <div className="h-[200px] animate-pulse rounded-lg bg-paper" />; }
