'use client';
import { ReactNode } from 'react';
import { motion } from '@/components/motion';

/* Metric card for the dashboard grid. */
export function StatCard({
  label, value, delta, icon, accent = false,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`card p-5 ${accent ? 'ring-1 ring-green/20' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wide text-faint">{label}</span>
        {icon && <span className="text-green-600">{icon}</span>}
      </div>
      <div className="mt-3 font-display text-[28px] font-extrabold text-navy">{value}</div>
      {delta && <div className="mt-1 text-[12px] font-semibold text-green-600">{delta}</div>}
    </motion.div>
  );
}

/* Generic light panel with a heading. */
export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between">
          {title && <h2 className="font-display text-[16px] font-extrabold text-navy">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* Empty-state block for sections with no data yet. */
export function Empty({ icon, title, hint, action }: { icon: ReactNode; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-lg bg-green-soft text-green-600 ring-1 ring-green/15">{icon}</span>
      <h3 className="mt-4 font-display text-[17px] font-bold text-navy">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] text-muted">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Tiny animated bar chart. */
export function Bars({ data, labels }: { data: number[]; labels?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-t-md bg-gradient-to-t from-green-mint to-green-600"
            style={{ minHeight: 4 }}
          />
          {labels && <span className="text-[10px] font-semibold text-faint">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/* Section header used at the top of scaffold pages. */
export function PageHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[24px] font-extrabold text-navy">{title}</h1>
        <p className="mt-1 text-[13.5px] text-muted">{sub}</p>
      </div>
      {action}
    </div>
  );
}

export const money = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
