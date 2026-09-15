'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Icon } from '@/components/admin/AdminKit';
import { AdminRange, rangeLabel, rangeQuery } from '@/lib/admin-range';

export type ExportDataset = 'orders' | 'summary' | 'payouts' | 'sellers';

const DATASETS: Record<ExportDataset, { title: string; hint: string }> = {
  orders: { title: 'Orders', hint: 'Every order placed — buyer, seller, amounts, status and tracking' },
  summary: { title: 'Daily summary', hint: 'One row per day (per month for long ranges), with a total' },
  payouts: { title: 'Payouts', hint: 'Withdrawal requests, decisions and transfer references' },
  sellers: { title: 'Sellers', hint: 'Each seller’s orders, GMV and fees for the period' },
};

/**
 * Download the selected period as CSV.
 *
 * Exports are built on the server (AdminService.exportData), so they are
 * complete rather than whatever page of rows a screen happens to hold, and
 * they always cover the range shown in the picker beside this button.
 */
export default function ExportMenu({
  range,
  datasets = ['orders', 'summary', 'payouts', 'sellers'],
}: {
  range: AdminRange;
  datasets?: ExportDataset[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportDataset | null>(null);
  const [err, setErr] = useState('');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = async (ds: ExportDataset) => {
    setBusy(ds);
    setErr('');
    try {
      const blob = await api.adminExport(ds, rangeQuery(range));
      const slug = range.from === 'all' ? `all-time_to_${range.to}` : range.from === range.to ? range.from : `${range.from}_to_${range.to}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loopy-${ds}_${slug}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoked a moment later: revoking straight away can cancel the
      // download in some browsers before it has started.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message || 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12.5px] font-semibold text-slate transition-colors hover:border-accent/40 ${open ? 'border-accent/50' : 'border-hair'}`}
      >
        <Icon name="download" size={15} className="text-dim" />
        Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-hair bg-white p-1.5 shadow-[0_18px_48px_-20px_rgba(15,23,42,0.35)]"
        >
          <div className="px-2.5 pb-1.5 pt-1 text-[11px] text-pale">
            CSV for <span className="font-semibold text-dim">{rangeLabel(range)}</span>
          </div>
          {datasets.map((ds) => (
            <button
              key={ds}
              role="menuitem"
              type="button"
              disabled={busy !== null}
              onClick={() => run(ds)}
              className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-cool disabled:opacity-60"
            >
              <span className={`mt-0.5 text-pale ${busy === ds ? 'animate-pulse' : ''}`}>
                <Icon name="download" size={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-slate">{busy === ds ? 'Preparing…' : DATASETS[ds].title}</span>
                <span className="block text-[11px] leading-snug text-dim">{DATASETS[ds].hint}</span>
              </span>
            </button>
          ))}
          {err && <p className="px-2.5 pb-1.5 pt-1 text-[11.5px] font-medium text-alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
