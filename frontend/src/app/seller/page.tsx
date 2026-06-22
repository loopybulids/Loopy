'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatCard, Panel, Bars, Empty, money } from '@/components/seller-ui';
import { Bag, Clock, Plus, Share, Wallet } from '@/components/icons';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.myOrders().catch(() => []),
      api.myWallet().catch(() => null),
    ]).then(([o, w]) => { setOrders(o || []); setWallet(w); setLoading(false); });
  }, []);

  const paidish = (s: string) => ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'].includes(s);
  const revenue = orders.filter((o) => paidish(o.status)).reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pending = orders.filter((o) => o.status === 'Paid' || o.status === 'Accepted').length;
  const completed = orders.filter((o) => ['Delivered', 'Completed'].includes(o.status)).length;
  const customers = new Set(orders.map((o) => o.buyerId || o.buyer?.id || o.customer?.id).filter(Boolean)).size;

  const series = build7Day(orders);

  return (
    <div className="space-y-6">
      {/* metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={money(revenue)} delta={revenue ? '+ this period' : 'No sales yet'} icon={<Wallet size={18} />} accent />
        <StatCard label="Total orders" value={orders.length} delta={`${pending} pending`} icon={<Bag size={18} />} />
        <StatCard label="Completed" value={completed} delta={`${orders.length ? Math.round((completed / orders.length) * 100) : 0}% of orders`} icon={<Clock size={18} />} />
        <StatCard label="Customers" value={customers} delta="Unique buyers" icon={<Share size={18} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Revenue · last 7 days" action={<span className="chip-green">{money(revenue)}</span>}>
          <Bars data={series.values} labels={series.labels} />
        </Panel>

        <Panel title="Payouts">
          <div className="space-y-4">
            <Row label="Available balance" value={money(wallet?.available ?? 0)} strong />
            <Row label="Pending (in escrow)" value={money(wallet?.pending ?? revenue)} />
            <Row label="Settled" value={money(wallet?.settled ?? 0)} />
          </div>
          <Link href="/seller/payments" className="btn-green mt-5 w-full justify-center">Go to payouts</Link>
        </Panel>
      </div>

      <Panel
        title="Recent orders"
        action={<Link href="/seller/orders" className="text-[13px] font-bold text-green-600 hover:underline">View all</Link>}
      >
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : orders.length === 0 ? (
          <Empty
            icon={<Share size={24} />}
            title="No orders yet"
            hint="Generate your first checkout link, share it in a DM, and orders will land right here."
            action={<Link href="/seller/links" className="btn-green"><Plus size={15} /> Create a checkout link</Link>}
          />
        ) : (
          <div className="divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Bag size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[14px] font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                  <div className="truncate text-[12px] text-faint">{o.buyer?.name || o.customer?.name || 'Customer'}</div>
                </div>
                <span className="text-[13px] font-bold text-navy">{money(o.total || o.amount || 0)}</span>
                <span className="chip-green ml-2">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
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

function build7Day(orders: any[]) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = new Array(7).fill(0);
  let any = false;
  for (const o of orders) {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    if (!d || isNaN(d.getTime())) continue;
    const idx = (d.getDay() + 6) % 7;
    values[idx] += o.total || o.amount || 0;
    any = true;
  }
  if (!any) return { labels, values: [12, 19, 9, 24, 17, 31, 22] };
  return { labels, values };
}
