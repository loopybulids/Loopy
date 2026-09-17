'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PresetId, PRESETS, rangeDates, rangeQuery, resolvePreset } from '@/lib/admin-range';

/**
 * Download your own data as a spreadsheet.
 *
 * The period lives in this menu rather than on the page, because the dashboard
 * itself is not filtered by date — a range picker up in the header would imply
 * the figures below it had changed. Here it only ever means "what goes in the
 * file", which is the one question being asked.
 *
 * Files are built on the server (sellers.service exportData) so an export is
 * the seller's whole history for the period, not the page of rows the screen
 * happens to be holding.
 */

const DATASETS = [
  { id: 'orders', title: 'Orders', hint: 'Each order — customer, items, what you receive, tracking' },
  { id: 'summary', title: 'Day-by-day summary', hint: 'One row per day (per month for long periods), with a total' },
  { id: 'payouts', title: 'Payouts', hint: 'Your withdrawals, their status and references' },
  { id: 'products', title: 'Products', hint: 'Your catalogue with stock, and units sold in the period' },
] as const;

type Dataset = (typeof DATASETS)[number]['id'];
type Period = Exclude<PresetId, 'custom'>;

const PERIODS: Period[] = ['7d', '30d', 'thisMonth', 'lastMonth', 'all'];
const labelOf = (id: Period) => PRESETS.find((p) => p.id === id)?.label || id;

export default function SellerExport() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');
  const [busy, setBusy] = useState<Dataset | null>(null);
  const [err, setErr] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const range = resolvePreset(period);

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

  const run = async (ds: Dataset) => {
    setBusy(ds);
    setErr('');
    try {
      const blob = await api.myExport(ds, rangeQuery(range));
      const slug = range.from === 'all' ? `all-time_to_${range.to}` : `${range.from}_to_${range.to}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loopy-${ds}_${slug}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoked a moment later: revoking at once can cancel the download in
      // some browsers before it has started.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message || 'That download failed.');
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
        className={`flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12.5px] font-bold text-navy transition-colors hover:border-green/40 ${open ? 'border-green/50' : 'border-line'}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted">
          <path d="M12 4v11" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
        Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-2 shadow-lift"
        >
          <div className="px-1.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Period</div>
          <div className="flex flex-wrap gap-1.5 px-1.5">
            {PERIODS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriod(id)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  period === id ? 'bg-green-soft text-green' : 'text-muted hover:bg-paper'
                }`}
              >
                {labelOf(id)}
              </button>
            ))}
          </div>
          <div className="px-1.5 pt-1.5 font-num text-[11px] text-faint">{rangeDates(range)}</div>

          <div className="mt-2 border-t border-line pt-1.5">
            {DATASETS.map((ds) => (
              <button
                key={ds.id}
                role="menuitem"
                type="button"
                disabled={busy !== null}
                onClick={() => run(ds.id)}
                className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-paper disabled:opacity-60"
              >
                <span className={`mt-0.5 text-faint ${busy === ds.id ? 'animate-pulse' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 4v11" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 20h14" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-bold text-navy">{busy === ds.id ? 'Preparing…' : ds.title}</span>
                  <span className="block text-[11px] leading-snug text-muted">{ds.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {err && <p className="px-2.5 pb-1 pt-0.5 text-[11.5px] font-semibold text-rose">{err}</p>}
          <p className="px-2.5 pb-1 pt-1 text-[11px] text-faint">CSV — opens in Excel or Google Sheets.</p>
        </div>
      )}
    </div>
  );
}
