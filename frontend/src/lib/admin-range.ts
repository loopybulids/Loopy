'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * The date range the admin console is looking at.
 *
 * One range, shared by every admin screen and remembered between visits: pick
 * "Last month" on the dashboard and Finance, Analytics and Orders open on last
 * month too — which is what you want when you are investigating a period, and
 * the opposite of re-picking it on four screens.
 *
 * Presets are stored by name and re-resolved on every load, so "Last 7 days"
 * chosen on Monday still means the last seven days on Thursday. Only a custom
 * range is kept as fixed dates.
 *
 * Days are India days, matching the backend (common/date-range). The browser's
 * own timezone is deliberately ignored, so an admin travelling abroad sees the
 * same "yesterday" as the finance team at home.
 */

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 86_400_000;
const STORE_KEY = 'loopy_admin_range';
const CHANGED = 'loopy-admin-range';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type PresetId =
  | 'today' | 'yesterday' | '7d' | '30d' | '90d'
  | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all' | 'custom';

export interface AdminRange {
  preset: PresetId;
  /** `YYYY-MM-DD` in IST, or `'all'` for everything since the first order. */
  from: string;
  /** `YYYY-MM-DD` in IST, inclusive. */
  to: string;
}

type Named = Exclude<PresetId, 'custom'>;

export const PRESETS: { id: Named; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'thisYear', label: 'This year' },
  { id: 'all', label: 'All time' },
];

const DEFAULT_PRESET: Named = '30d';

const pad = (n: number) => String(n).padStart(2, '0');
const parts = (key: string) => key.split('-').map(Number) as [number, number, number];

export function todayKey(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function spanDays(from: string, to: string): number {
  const [fy, fm, fd] = parts(from);
  const [ty, tm, td] = parts(to);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS) + 1;
}

export function isDayKey(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = parts(v);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const monthEnd = (y: number, m: number) => addDays(m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`, -1);
const isWholeMonth = (from: string, to: string) => from.endsWith('-01') && to === monthEnd(parts(from)[0], parts(from)[1]);
const isWholeYear = (from: string, to: string) => from.endsWith('-01-01') && to === `${from.slice(0, 4)}-12-31`;

export function resolvePreset(preset: Named): AdminRange {
  const t = todayKey();
  const [y, m] = parts(t);
  switch (preset) {
    case 'today': return { preset, from: t, to: t };
    case 'yesterday': { const k = addDays(t, -1); return { preset, from: k, to: k }; }
    case '7d': return { preset, from: addDays(t, -6), to: t };
    case '30d': return { preset, from: addDays(t, -29), to: t };
    case '90d': return { preset, from: addDays(t, -89), to: t };
    case 'thisMonth': return { preset, from: `${y}-${pad(m)}-01`, to: t };
    case 'lastMonth': {
      const [ly, lm] = m === 1 ? [y - 1, 12] : [y, m - 1];
      return { preset, from: `${ly}-${pad(lm)}-01`, to: monthEnd(ly, lm) };
    }
    case 'thisYear': return { preset, from: `${y}-01-01`, to: t };
    case 'all': return { preset, from: 'all', to: t };
  }
}

function fmtDay(key: string, withYear: boolean): string {
  const [y, m, d] = parts(key);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** Exact dates: "16 Aug – 14 Sep 2026". Shown under a preset name. */
export function rangeDates(r: AdminRange): string {
  if (r.from === 'all') return 'Since the first order';
  if (r.from === r.to) return fmtDay(r.from, true);
  const sameYear = r.from.slice(0, 4) === r.to.slice(0, 4);
  return `${fmtDay(r.from, !sameYear)} – ${fmtDay(r.to, true)}`;
}

/** What to call a range in a heading: a preset name, a month, a year, or dates. */
export function rangeLabel(r: AdminRange): string {
  const preset = PRESETS.find((p) => p.id === r.preset);
  if (preset) return preset.label;
  if (r.from === r.to) {
    const [y, m, d] = parts(r.from);
    return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${fmtDay(r.from, true)}`;
  }
  if (isWholeMonth(r.from, r.to)) {
    const [y, m] = parts(r.from);
    return `${MONTHS_LONG[m - 1]} ${y}`;
  }
  if (isWholeYear(r.from, r.to)) return r.from.slice(0, 4);
  return rangeDates(r);
}

export const rangeQuery = (r: AdminRange) => `from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`;

/**
 * The period before or after this one, for the ◀ ▶ buttons.
 *
 * Calendar periods step as calendar periods: ◀ on "Last month" is the month
 * before it, not the 30 days before it, and a year steps a year. Anything
 * else steps by its own length, so ◀ on "Yesterday" is the day before.
 * Returns null where there is nowhere to go — before "All time", or past today.
 */
export function stepRange(r: AdminRange, dir: -1 | 1): AdminRange | null {
  if (r.from === 'all') return null;
  const today = todayKey();
  const [y, m] = parts(r.from);
  // A partial period that runs up to today, e.g. 1 Sep – today after stepping
  // forward into the current month, still steps as that month.
  const runsToToday = (unit: number) =>
    r.to === today && r.from !== r.to && r.from.slice(0, unit) === r.to.slice(0, unit);
  let from: string;
  let to: string;

  if (r.from.endsWith('-01-01') && (isWholeYear(r.from, r.to) || r.preset === 'thisYear' || runsToToday(4))) {
    from = `${y + dir}-01-01`;
    to = `${y + dir}-12-31`;
  } else if (r.from.endsWith('-01') && (isWholeMonth(r.from, r.to) || r.preset === 'thisMonth' || runsToToday(7))) {
    const [ny, nm] = dir < 0 ? (m === 1 ? [y - 1, 12] : [y, m - 1]) : (m === 12 ? [y + 1, 1] : [y, m + 1]);
    from = `${ny}-${pad(nm)}-01`;
    to = monthEnd(ny, nm);
  } else {
    const n = spanDays(r.from, r.to);
    from = addDays(r.from, dir * n);
    to = addDays(r.to, dir * n);
  }

  if (from > today) return null;
  if (to > today) to = today;
  return { preset: 'custom', from, to };
}

function load(): AdminRange {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (v && PRESETS.some((p) => p.id === v.preset)) return resolvePreset(v.preset);
    if (v?.preset === 'custom' && isDayKey(v.from) && isDayKey(v.to)) return { preset: 'custom', from: v.from, to: v.to };
  } catch {
    // Storage blocked or a stale shape — fall through to the default.
  }
  return resolvePreset(DEFAULT_PRESET);
}

/** The shared admin range, and a setter that updates every screen using it. */
export function useAdminRange(): [AdminRange, (r: AdminRange) => void] {
  const [range, setState] = useState<AdminRange>(() =>
    typeof window === 'undefined' ? resolvePreset(DEFAULT_PRESET) : load(),
  );

  useEffect(() => {
    const sync = () => setState(load());
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);

  const setRange = useCallback((r: AdminRange) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(r)); } catch { /* remembered for this visit only */ }
    setState(r);
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return [range, setRange];
}
