'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AreaTrend, Bars, Card, Chip, Donut, money, num, SectionTitle, StatCard } from '@/components/admin/AdminKit';

export default function AnalyticsCenter() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.adminAnalytics().then(setD).catch((e) => setErr(e?.message || 'Failed')); }, []);

  if (err) return <Card className="p-6 text-alert">{err}</Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-hair" /></div>;
  const k = d.kpis;
  const maxFunnel = Math.max(...d.funnel.map((f: any) => f.value), 1);

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-[26px] font-bold text-slate">Business Intelligence</h1><p className="text-[14px] text-dim">Trends, funnel, retention and a 7-day forecast.</p></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Customer LTV" value={money(k.clv)} icon="rupee" accent="green" />
        <StatCard label="Repeat Rate" value={`${k.repeatRate}%`} icon="users" accent="violet" />
        <StatCard label="Conversion" value={`${k.conversion}%`} icon="bolt" accent="navy" />
        <StatCard label="Avg Order Value" value={money(k.aov)} icon="bag" accent="navy" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5"><SectionTitle action={<span className="text-[12px] font-semibold text-accent">30 days</span>}>Revenue</SectionTitle><AreaTrend data={d.revenueSeries} money height={220} /></Card>
        <Card className="p-5"><SectionTitle action={<span className="text-[12px] font-semibold text-dim">30 days</span>}>Orders</SectionTitle><Bars data={d.ordersSeries} color="#2A3341" height={220} /></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <SectionTitle>Conversion Funnel</SectionTitle>
          <div className="space-y-3">
            {d.funnel.map((f: any) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]"><span className="font-semibold text-slate">{f.stage}</span><span className="font-bold text-dim">{num(f.value)}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-cool"><div className="h-full rounded-full bg-accent" style={{ width: `${(f.value / maxFunnel) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-1">
          <SectionTitle>Revenue by Category</SectionTitle>
          <Donut data={d.categories.map((c: any) => ({ name: c.name, value: c.value }))} height={190} money />
        </Card>
        <Card className="p-5 lg:col-span-1">
          <SectionTitle action={<span className="text-[11.5px] text-pale">Projected</span>}>Next 7 days</SectionTitle>
          <Bars data={d.forecast} color="#1EA75B" money height={190} />
          <p className="mt-2 text-[11px] text-dim">Projected from the trailing 7-day average. Indicative only.</p>
        </Card>
      </div>
    </div>
  );
}
