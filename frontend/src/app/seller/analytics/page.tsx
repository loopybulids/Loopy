'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, StatCard, Panel, Bars, money } from '@/components/seller-ui';
import { Chart, Star, Wallet } from '@/components/icons';

export default function Analytics() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => { api.myOrders().then((o) => setOrders(o || [])).catch(() => {}); }, []);

  const paid = orders.filter((o) => ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'].includes(o.status));
  const revenue = paid.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const aov = paid.length ? Math.round(revenue / paid.length) : 0;
  const repeat = repeatRate(orders);

  const monthly = orders.length ? bucketMonthly(orders) : { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], values: [18, 24, 31, 27, 38, 44] };

  return (
    <div>
      <PageHead title="Analytics" sub="Revenue, orders and customer insights at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross revenue" value={money(revenue)} icon={<Wallet size={18} />} accent />
        <StatCard label="Orders" value={orders.length} icon={<Chart size={18} />} />
        <StatCard label="Avg order value" value={money(aov)} />
        <StatCard label="Repeat rate" value={`${repeat}%`} icon={<Star size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Revenue trend">
          <Bars data={monthly.values} labels={monthly.labels} />
        </Panel>
        <Panel title="Conversion funnel">
          <div className="space-y-4">
            <Funnel label="Link opens" pct={100} val="—" />
            <Funnel label="Reached checkout" pct={62} val="—" />
            <Funnel label="Paid" pct={orders.length ? Math.min(100, Math.round((paid.length / Math.max(orders.length, 1)) * 100)) : 41} val={`${paid.length}`} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Funnel({ label, pct, val }: { label: string; pct: number; val: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[13px]">
        <span className="font-semibold text-navy/80">{label}</span>
        <span className="text-faint">{val} · {pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-green-soft">
        <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function repeatRate(orders: any[]) {
  const counts = new Map<string, number>();
  for (const o of orders) {
    const k = o.buyer?.id || o.customer?.id || o.buyerId || o.buyer?.name || 'guest';
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const total = counts.size;
  if (!total) return 0;
  const repeats = Array.from(counts.values()).filter((n) => n > 1).length;
  return Math.round((repeats / total) * 100);
}

function bucketMonthly(orders: any[]) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const values = new Array(12).fill(0);
  for (const o of orders) {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    if (d && !isNaN(d.getTime())) values[d.getMonth()] += o.total || o.amount || 0;
  }
  const now = new Date();
  const idx = Array.from({ length: 6 }, (_, i) => (now.getMonth() - 5 + i + 12) % 12);
  return { labels: idx.map((i) => labels[i]), values: idx.map((i) => values[i]) };
}
