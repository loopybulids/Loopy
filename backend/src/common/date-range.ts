import { BadRequestException } from '@nestjs/common';

/**
 * Date ranges for the admin console, measured in India time.
 *
 * Every day boundary here is midnight IST, not midnight on whatever clock the
 * server happens to run. The code this replaces bucketed days with
 * `setHours(0, 0, 0, 0)`, which is server-local: right on a laptop in India,
 * five and a half hours out on a UTC host, where an order placed at 1am IST on
 * the 12th was counted on the 11th. An admin asking for "yesterday" means
 * their yesterday.
 *
 * Ranges travel as `YYYY-MM-DD` day keys, inclusive at both ends, because that
 * is what a person picks. Internally they become a half-open interval of
 * instants, [start, end), so a row can never land in two adjacent buckets.
 */

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 86_400_000;
const KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Beyond this many days a series has one point per month instead of per day. */
export const MONTHLY_AFTER_DAYS = 92;
/** A sanity cap, not a product limit: ten years of monthly points. */
const MAX_DAYS = 3660;

export interface DateRange {
  fromKey: string;
  toKey: string;
  /** 00:00 IST on `fromKey`. Inclusive. */
  start: Date;
  /** 00:00 IST on the day after `toKey`. Exclusive. */
  end: Date;
  days: number;
  bucket: 'day' | 'month';
}

const pad = (n: number) => String(n).padStart(2, '0');
const parts = (key: string) => key.split('-').map(Number) as [number, number, number];

/** The IST calendar day an instant falls on. */
export function istKey(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `2026-09-12 14:05` in IST — how an export shows a timestamp to an Indian operator. */
export function istDateTime(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ');
}

export function todayKey(): string {
  return istKey(new Date());
}

function startOf(key: string): Date {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

function addDays(key: string, n: number): string {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function isRealDay(key: string | undefined): key is string {
  if (!key || !KEY.test(key)) return false;
  const [y, m, d] = parts(key);
  const t = new Date(Date.UTC(y, m - 1, d));
  // Rejects 2026-02-31, which Date would otherwise quietly roll into March.
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function makeRange(fromKey: string, toKey: string): DateRange {
  if (fromKey > toKey) [fromKey, toKey] = [toKey, fromKey];
  const [fy, fm, fd] = parts(fromKey);
  const [ty, tm, td] = parts(toKey);
  const days = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS) + 1;
  return {
    fromKey,
    toKey,
    start: startOf(fromKey),
    end: startOf(addDays(toKey, 1)),
    days,
    bucket: days > MONTHLY_AFTER_DAYS ? 'month' : 'day',
  };
}

/**
 * Read `from` / `to` query parameters.
 *
 *  - neither given     → the last `defaultDays` days, ending today
 *  - `from=all`        → from `earliest` (the first order) to `to` or today
 *  - a date past today → clamped to today, so a range never invents empty days
 *
 * A malformed date is a 400, not a silent fallback. Quietly answering with a
 * different range than the one asked for is how a report ends up quoting the
 * wrong month.
 */
export function parseRange(
  from: string | undefined,
  to: string | undefined,
  opts: { defaultDays: number; earliest?: Date | null },
): DateRange {
  const today = todayKey();

  if (to && !isRealDay(to)) throw new BadRequestException(`Invalid "to" date: ${to}`);
  const toKey = to && to < today ? to : today;

  let fromKey: string;
  if (!from) fromKey = addDays(toKey, -(opts.defaultDays - 1));
  else if (from === 'all') fromKey = opts.earliest ? istKey(opts.earliest) : toKey;
  else if (isRealDay(from)) fromKey = from > today ? today : from;
  else throw new BadRequestException(`Invalid "from" date: ${from}`);

  const range = makeRange(fromKey, toKey);
  if (range.days > MAX_DAYS) throw new BadRequestException('That date range is too long — pick ten years or less.');
  return range;
}

/** The same number of days immediately before `r` — what a delta compares against. */
export function previousRange(r: DateRange): DateRange {
  return makeRange(addDays(r.fromKey, -r.days), addDays(r.fromKey, -1));
}

export const inRange = (d: Date, r: DateRange) => d >= r.start && d < r.end;

/** `2026-08-16_to_2026-09-14`, for export filenames. */
export const rangeSlug = (r: DateRange) => (r.fromKey === r.toKey ? r.fromKey : `${r.fromKey}_to_${r.toKey}`);

export interface Bucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

/** One bucket per day, or per month once the range is long enough to need it. */
export function bucketsOf(r: DateRange): Bucket[] {
  const out: Bucket[] = [];

  if (r.bucket === 'day') {
    for (let i = 0; i < r.days; i++) {
      const key = addDays(r.fromKey, i);
      const [, m, d] = parts(key);
      out.push({ key, label: `${d} ${MONTHS[m - 1]}`, start: startOf(key), end: startOf(addDays(key, 1)) });
    }
    return out;
  }

  let [y, m] = parts(r.fromKey);
  const [ty, tm] = parts(r.toKey);
  while (y < ty || (y === ty && m <= tm)) {
    const [ny, nm] = m === 12 ? [y + 1, 1] : [y, m + 1];
    const s = startOf(`${y}-${pad(m)}-01`);
    const e = startOf(`${ny}-${pad(nm)}-01`);
    out.push({
      key: `${y}-${pad(m)}`,
      label: `${MONTHS[m - 1]} ${y}`,
      // The first and last months are usually partial. Clip them to the range
      // so a bucket never claims days nobody asked for.
      start: s < r.start ? r.start : s,
      end: e > r.end ? r.end : e,
    });
    [y, m] = [ny, nm];
  }
  return out;
}

const bucketKey = (d: Date, r: DateRange) => (r.bucket === 'day' ? istKey(d) : istKey(d).slice(0, 7));

/** Group rows into the range's buckets, dropping any outside it. */
export function groupByBucket<T extends { createdAt: Date }>(rows: T[], r: DateRange): { bucket: Bucket; rows: T[] }[] {
  const buckets = bucketsOf(r);
  const groups = buckets.map((bucket) => ({ bucket, rows: [] as T[] }));
  const at = new Map(buckets.map((b, i) => [b.key, i]));
  for (const row of rows) {
    if (!inRange(row.createdAt, r)) continue;
    const i = at.get(bucketKey(row.createdAt, r));
    if (i !== undefined) groups[i].rows.push(row);
  }
  return groups;
}

/** A chart series over the range: `{ date, label, value }` per bucket. */
export function seriesOver<T extends { createdAt: Date }>(rows: T[], r: DateRange, value: (row: T) => number) {
  return groupByBucket(rows, r).map(({ bucket, rows: rs }) => ({
    date: bucket.key,
    label: bucket.label,
    value: rs.reduce((s, row) => s + value(row), 0),
  }));
}
