/**
 * CSV for the admin exports.
 *
 * Three things a plain `row.join(',')` gets wrong — all of which the old
 * settlements export did:
 *
 *  1. Quoting. A store called "Threads, Tees & More" split into two columns
 *     and shifted every value after it one to the right. Cells containing a
 *     comma, quote or line break are quoted, embedded quotes doubled
 *     (RFC 4180).
 *
 *  2. Formula injection. Buyer names, store names and review text are typed
 *     by the public, and a spreadsheet treats a cell starting with = + - @ as
 *     a formula — so a "name" of =HYPERLINK("http://…","Click me") becomes a
 *     live link in the admin's spreadsheet. Such cells get a leading
 *     apostrophe, which makes the spreadsheet show them as text. Purely
 *     numeric strings like "+919876543210" are left alone: they cannot call a
 *     function, and prefixing every phone number would be its own breakage.
 *
 *  3. Encoding. Excel opens a CSV without a byte-order mark as Windows-1252,
 *     turning ₹ and any name in Devanagari into mojibake. The file starts
 *     with a UTF-8 BOM.
 */

const FORMULA = /^[=+\-@\t\r]/;
const NUMERIC = /^[+-]?[\d\s().,-]+$/;

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';

  let s = v instanceof Date ? v.toISOString() : String(v);
  if (FORMULA.test(s) && !NUMERIC.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return '\uFEFF' + [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
