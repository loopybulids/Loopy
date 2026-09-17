'use client';
import { useEffect, useRef, useState } from 'react';
import { AdminRange, isDayKey, PRESETS, PresetId, rangeDates, rangeQuery, resolvePreset, todayKey } from '@/lib/admin-range';

/**
 * The export panel, shared by the seller console and the admin.
 *
 * One component because the two sides ask exactly the same three questions —
 * which period, which dates, which dataset — and had begun to answer them
 * differently. Only the palette differs, so that is all `theme` switches; the
 * behaviour, the validation and the download are in one place.
 *
 * Laid out wide rather than tall: the periods sit on one line and the datasets
 * in two columns, so the whole choice is visible at once instead of a column
 * that ran past the fold.
 */

export interface ExportItem {
  id: string;
  title: string;
  hint: string;
}

type Theme = 'seller' | 'admin';

const SKIN: Record<Theme, Record<string, string>> = {
  seller: {
    button: 'border-line text-navy hover:border-green/40',
    buttonOpen: 'border-green/50',
    panel: 'border-line bg-white shadow-lift',
    label: 'text-faint',
    chipOn: 'bg-green-soft text-green',
    chipOff: 'text-muted hover:bg-paper',
    dates: 'text-faint',
    input: 'border-line text-navy focus:border-green/60',
    apply: 'bg-green text-white hover:bg-green-700',
    row: 'hover:bg-paper',
    rowTitle: 'text-navy',
    rowHint: 'text-muted',
    icon: 'text-faint',
    err: 'text-rose',
    note: 'text-faint',
    divide: 'border-line',
  },
  admin: {
    button: 'border-hair text-slate hover:border-accent/40',
    buttonOpen: 'border-accent/50',
    panel: 'border-hair bg-white shadow-[0_18px_48px_-20px_rgba(15,23,42,0.35)]',
    label: 'text-pale',
    chipOn: 'bg-accent-soft text-accent',
    chipOff: 'text-dim hover:bg-cool',
    dates: 'text-pale',
    input: 'border-hair text-slate focus:border-accent/60',
    apply: 'bg-accent text-white hover:bg-accent-600',
    row: 'hover:bg-cool',
    rowTitle: 'text-slate',
    rowHint: 'text-dim',
    icon: 'text-pale',
    err: 'text-alert',
    note: 'text-pale',
    divide: 'border-hair',
  },
};

const PERIODS: Exclude<PresetId, 'custom'>[] = ['today', '7d', '30d', 'thisMonth', 'lastMonth', 'all'];
const labelOf = (id: PresetId) => PRESETS.find((p) => p.id === id)?.label || 'Custom';

function DownIcon({ className = '', size = 15 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export default function ExportSheet({
  theme,
  items,
  initialRange,
  download,
  filePrefix = 'loopy',
}: {
  theme: Theme;
  items: ExportItem[];
  /** Starting period — the admin passes the range its page is showing. */
  initialRange?: AdminRange;
  download: (id: string, query: string) => Promise<Blob>;
  filePrefix?: string;
}) {
  const s = SKIN[theme];
  const today = todayKey();

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<AdminRange>(initialRange ?? resolvePreset('30d'));
  const [from, setFrom] = useState(range.from === 'all' ? '' : range.from);
  const [to, setTo] = useState(range.to);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const root = useRef<HTMLDivElement>(null);

  // Follow the page's own picker while it is closed, so opening the menu
  // always starts from what the screen is showing.
  useEffect(() => {
    if (initialRange && !open) setRange(initialRange);
  }, [initialRange, open]);

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

  const pickPreset = (id: Exclude<PresetId, 'custom'>) => {
    const next = resolvePreset(id);
    setRange(next);
    setFrom(next.from === 'all' ? '' : next.from);
    setTo(next.to);
    setErr('');
  };

  const applyDates = () => {
    if (!isDayKey(from) || !isDayKey(to)) return setErr('Pick both dates.');
    if (from > to) return setErr('The start date is after the end date.');
    if (to > today) return setErr('The end date is in the future.');
    setErr('');
    setRange({ preset: 'custom', from, to });
  };

  // Typing dates without pressing Apply should not silently export the old
  // period, so the button says what it will actually use.
  const pendingDates = isDayKey(from) && isDayKey(to) && (from !== range.from || to !== range.to);

  const run = async (id: string) => {
    setBusy(id);
    setErr('');
    try {
      const blob = await download(id, rangeQuery(range));
      const slug = range.from === 'all' ? `all-time_to_${range.to}` : `${range.from}_to_${range.to}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filePrefix}-${id}_${slug}.csv`;
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
        className={`flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12.5px] font-bold transition-colors ${s.button} ${open ? s.buttonOpen : ''}`}
      >
        <DownIcon className={s.icon} />
        Export
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-11 z-40 w-[min(32rem,calc(100vw-2rem))] rounded-xl border p-3 ${s.panel}`}
        >
          {/* period — one line */}
          <div className={`text-[10.5px] font-bold uppercase tracking-[0.09em] ${s.label}`}>Period</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {PERIODS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => pickPreset(id)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${range.preset === id ? s.chipOn : s.chipOff}`}
              >
                {labelOf(id)}
              </button>
            ))}
            {range.preset === 'custom' && (
              <span className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${s.chipOn}`}>Custom</span>
            )}
          </div>

          {/* exact dates */}
          <div className={`mt-2.5 flex flex-wrap items-end gap-2 border-t pt-2.5 ${s.divide}`}>
            <label className={`text-[10.5px] font-bold uppercase tracking-[0.09em] ${s.label}`}>
              From
              <input
                type="date"
                value={from}
                max={to || today}
                onChange={(e) => { setFrom(e.target.value); setErr(''); }}
                className={`mt-1 block h-9 rounded-lg border bg-white px-2 font-num text-[12.5px] outline-none ${s.input}`}
              />
            </label>
            <label className={`text-[10.5px] font-bold uppercase tracking-[0.09em] ${s.label}`}>
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                max={today}
                onChange={(e) => { setTo(e.target.value); setErr(''); }}
                className={`mt-1 block h-9 rounded-lg border bg-white px-2 font-num text-[12.5px] outline-none ${s.input}`}
              />
            </label>
            <button
              type="button"
              onClick={applyDates}
              className={`h-9 rounded-lg px-3 text-[12px] font-bold transition-colors ${s.apply} ${pendingDates ? '' : 'opacity-60'}`}
            >
              Use these dates
            </button>
            <span className={`ml-auto self-center font-num text-[11px] ${s.dates}`}>{rangeDates(range)}</span>
          </div>

          {/* datasets — two across */}
          <div className={`mt-2.5 grid gap-1 border-t pt-2 sm:grid-cols-2 ${s.divide}`}>
            {items.map((it) => (
              <button
                key={it.id}
                role="menuitem"
                type="button"
                disabled={busy !== null}
                onClick={() => run(it.id)}
                className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-60 ${s.row}`}
              >
                <span className={`mt-0.5 ${s.icon} ${busy === it.id ? 'animate-pulse' : ''}`}>
                  <DownIcon size={14} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[12.5px] font-bold ${s.rowTitle}`}>{busy === it.id ? 'Preparing…' : it.title}</span>
                  <span className={`block text-[11px] leading-snug ${s.rowHint}`}>{it.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {err && <p className={`px-1 pt-1.5 text-[11.5px] font-semibold ${s.err}`}>{err}</p>}
          <p className={`px-1 pt-1.5 text-[11px] ${s.note}`}>CSV — opens in Excel or Google Sheets.</p>
        </div>
      )}
    </div>
  );
}
