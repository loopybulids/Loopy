'use client';
import { ReactNode } from 'react';
import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

export const money = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
export const num = (n: number) => (n || 0).toLocaleString('en-IN');
export const compact = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K` : `₹${n}`;

/* ───────────────────────── icons (inline SVG) ───────────────────────── */
type IconName =
  | 'grid' | 'bag' | 'store' | 'users' | 'wallet' | 'headset' | 'chart' | 'gear'
  | 'bell' | 'search' | 'shield' | 'alert' | 'bolt' | 'check' | 'truck' | 'box'
  | 'star' | 'rupee' | 'pulse' | 'cpu' | 'arrow' | 'logout' | 'back' | 'refund';

export function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
  switch (name) {
    case 'grid': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case 'bag': return <svg {...p}><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
    case 'store': return <svg {...p}><path d="M4 9l1-5h14l1 5" /><path d="M4 9v11h16V9" /><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /></svg>;
    case 'users': return <svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M20.5 20a5 5 0 0 0-3.5-4.7" /></svg>;
    case 'wallet': return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1.3" /></svg>;
    case 'headset': return <svg {...p}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 3h-2" /></svg>;
    case 'chart': return <svg {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16l3-4 3 2 4-6" /></svg>;
    case 'gear': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>;
    case 'bell': return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l8 3v6c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case 'alert': return <svg {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg>;
    case 'bolt': return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>;
    case 'check': return <svg {...p}><path d="m5 12 5 5L20 6" /></svg>;
    case 'truck': return <svg {...p}><rect x="2" y="6" width="12" height="9" rx="1.5" /><path d="M14 9h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>;
    case 'box': return <svg {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>;
    case 'star': return <svg {...p}><path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" /></svg>;
    case 'rupee': return <svg {...p}><path d="M7 4h10M7 8h10M7 4c5 0 7 4 3 6H9l5 6" /></svg>;
    case 'pulse': return <svg {...p}><path d="M2 12h4l2-6 4 14 3-9 2 1h5" /></svg>;
    case 'cpu': return <svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>;
    case 'arrow': return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'back': return <svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
    case 'logout': return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    case 'refund': return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" /></svg>;
    default: return null;
  }
}

/* ───────────────────────── building blocks ───────────────────────── */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-[15px] font-extrabold text-navy">{children}</h2>
      {action}
    </div>
  );
}

export function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? 'text-green-600' : 'text-rose'}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}{suffix}
    </span>
  );
}

export function StatCard({ label, value, delta, icon, accent, hint }: { label: string; value: ReactNode; delta?: number; icon?: IconName; accent?: 'green' | 'navy' | 'rose' | 'amber' | 'violet'; hint?: string }) {
  const ring = accent === 'green' ? 'text-green-600 bg-green-mint' : accent === 'rose' ? 'text-rose bg-rose-soft' : accent === 'amber' ? 'text-amber bg-amber-soft' : accent === 'violet' ? 'text-violet-600 bg-violet-50' : 'text-navy bg-paper';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-faint">{label}</span>
        {icon && <span className={`grid h-7 w-7 place-items-center rounded-lg ${ring}`}><Icon name={icon} size={15} /></span>}
      </div>
      <div className="mt-2 font-display text-[24px] font-extrabold leading-none text-navy">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} />}
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
    </Card>
  );
}

export function Chip({ tone, children }: { tone: 'green' | 'rose' | 'amber' | 'navy' | 'violet' | 'gray'; children: ReactNode }) {
  const c = {
    green: 'bg-green-mint text-green', rose: 'bg-rose-soft text-rose', amber: 'bg-amber-soft text-amber',
    navy: 'bg-navy/10 text-navy', violet: 'bg-violet-50 text-violet-700', gray: 'bg-paper text-muted',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c}`}>{children}</span>;
}

export function statusChip(status: string) {
  const s = (status || '').toLowerCase();
  if (['delivered', 'completed', 'paid', 'released', 'approved'].includes(s)) return <Chip tone="green">{status}</Chip>;
  if (['cancelled', 'refunded', 'rejected'].includes(s)) return <Chip tone="rose">{status}</Chip>;
  if (['shipped', 'accepted'].includes(s)) return <Chip tone="violet">{status}</Chip>;
  if (['pendingpayment', 'pending', 'open', 'requested', 'disputed'].includes(s)) return <Chip tone="amber">{status}</Chip>;
  return <Chip tone="gray">{status}</Chip>;
}

/* ───────────────────────── charts (recharts) ───────────────────────── */
const TT = ({ active, payload, label, fmt }: any) =>
  active && payload?.length ? (
    <div className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] shadow-card">
      <div className="font-bold text-navy">{label}</div>
      <div className="text-muted">{fmt ? fmt(payload[0].value) : payload[0].value}</div>
    </div>
  ) : null;

export function AreaTrend({ data, color = '#16a34a', height = 220, money: asMoney }: { data: { label: string; value: number }[]; color?: string; height?: number; money?: boolean }) {
  const id = `g${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => (asMoney ? compact(v) : num(v))} />
        <Tooltip content={<TT fmt={(v: number) => (asMoney ? money(v) : num(v))} />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniArea({ data, color = '#16a34a', height = 48 }: { data: { value: number }[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const DONUT = ['#16a34a', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#14b8a6', '#ec4899'];
export function Donut({ data, height = 220, money: asMoney }: { data: { name: string; value: number }[]; height?: number; money?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.length ? data : [{ name: 'No data', value: 1 }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {(data.length ? data : [{ name: 'x', value: 1 }]).map((_, i) => <Cell key={i} fill={data.length ? DONUT[i % DONUT.length] : '#e2e8f0'} />)}
            </Pie>
            <Tooltip content={<TT fmt={(v: number) => (asMoney ? money(v) : num(v))} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.slice(0, 6).map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 truncate text-navy"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />{d.name}</span>
            <span className="font-semibold text-muted">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
        {!data.length && <li className="text-[12px] text-muted">No data yet</li>}
      </ul>
    </div>
  );
}

export function Bars({ data, color = '#6366f1', height = 220, money: asMoney }: { data: { label: string; value: number }[]; color?: string; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => (asMoney ? compact(v) : num(v))} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} content={<TT fmt={(v: number) => (asMoney ? money(v) : num(v))} />} />
        <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
