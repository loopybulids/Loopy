'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/admin/AdminKit';
import {
  AdminRange, isDayKey, PRESETS, rangeDates, rangeLabel, resolvePreset, stepRange, todayKey,
} from '@/lib/admin-range';

/**
 * Pick the period the admin console reports on.
 *
 * ◀ ▶ step to the previous or next period of the same shape — the quickest
 * way to look back day by day or month by month, which is most of what
 * "show me the previous days" means in practice. The label opens the presets
 * and a custom from/to.
 */
export default function RangePicker({ range, onChange }: { range: AdminRange; onChange: (r: AdminRange) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [err, setErr] = useState('');
  const root = useRef<HTMLDivElement>(null);

  const today = todayKey();
  const prev = stepRange(range, -1);
  const next = stepRange(range, 1);

  // Seed the custom fields from the current range each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setFrom(range.from === 'all' ? '' : range.from);
    setTo(range.to);
    setErr('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const pick = (r: AdminRange) => { onChange(r); setOpen(false); };

  const applyCustom = () => {
    if (!isDayKey(from) || !isDayKey(to)) return setErr('Pick both dates.');
    if (from > to) return setErr('The start date is after the end date.');
    if (to > today) return setErr('The end date is in the future.');
    pick({ preset: 'custom', from, to });
  };

  const stepBtn =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-hair bg-white text-dim transition-colors ' +
    'hover:border-accent/40 hover:text-slate disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hair disabled:hover:text-dim';
  const dateInput =
    'mt-1 block h-9 w-full rounded-lg border border-hair bg-white px-2 font-num text-[12.5px] text-slate outline-none focus:border-accent/60';

  return (
    <div ref={root} className="relative flex items-center gap-1.5">
      <button
        type="button"
        aria-label={prev ? `Previous period: ${rangeLabel(prev)}` : 'Previous period'}
        title={prev ? rangeLabel(prev) : undefined}
        disabled={!prev}
        onClick={() => prev && onChange(prev)}
        className={stepBtn}
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 min-w-0 items-center gap-2 rounded-lg border bg-white px-3 text-left transition-colors hover:border-accent/40 ${open ? 'border-accent/50' : 'border-hair'}`}
      >
        <Icon name="calendar" size={15} className="shrink-0 text-pale" />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-semibold text-slate">{rangeLabel(range)}</span>
          {range.preset !== 'custom' && (
            <span className="hidden truncate font-num text-[10.5px] text-pale sm:block">{rangeDates(range)}</span>
          )}
        </span>
        <Icon name="chevronDown" size={14} className="shrink-0 text-pale" />
      </button>

      <button
        type="button"
        aria-label={next ? `Next period: ${rangeLabel(next)}` : 'Next period'}
        title={next ? rangeLabel(next) : undefined}
        disabled={!next}
        onClick={() => next && onChange(next)}
        className={stepBtn}
      >
        <Icon name="chevronRight" size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date range"
          className="absolute left-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-hair bg-white p-2 shadow-[0_18px_48px_-20px_rgba(15,23,42,0.35)] sm:left-auto sm:right-0"
        >
          <div className="grid grid-cols-2 gap-1">
            {PRESETS.map((p) => {
              const on = range.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(resolvePreset(p.id))}
                  className={`rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors ${on ? 'bg-accent-soft font-semibold text-accent' : 'text-slate hover:bg-cool'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-hair px-1 pb-1 pt-3">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-pale">Custom range</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[11px] text-dim">
                From
                <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
              </label>
              <label className="text-[11px] text-dim">
                To
                <input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} className={dateInput} />
              </label>
            </div>
            {err && <p className="mt-2 text-[11.5px] font-medium text-alert">{err}</p>}
            <button
              type="button"
              onClick={applyCustom}
              className="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
