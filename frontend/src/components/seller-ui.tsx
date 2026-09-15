'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from '@/components/motion';

/* Metric card for the dashboard grid. Pass `href` to make it navigate. */
export function StatCard({
  label, value, delta, icon, accent = false, href,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  accent?: boolean;
  href?: string;
}) {
  /*
   * Compact on purpose. At p-5 with a 28px figure these cards were taller than
   * the content below them, so three counts of zero occupied the whole first
   * screen. Labels read as words rather than shouting in caps, and the figure
   * is set in the numeric face so columns of money line up.
   */
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium leading-snug text-muted">{label}</span>
        {icon && <span className="shrink-0 text-green-600">{icon}</span>}
      </div>
      <div className="mt-1.5 font-num text-[21px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-navy">{value}</div>
      {delta && <div className="mt-1 text-[11.5px] text-faint">{delta}</div>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`card block px-4 py-3.5 transition-colors hover:border-green/40 ${accent ? 'ring-1 ring-green/20' : ''}`}>
        {inner}
      </Link>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`card px-4 py-3.5 ${accent ? 'ring-1 ring-green/20' : ''}`}
    >
      {inner}
    </motion.div>
  );
}

/* Generic light panel with a heading. */
export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between">
          {title && <h2 className="font-display text-[16px] font-bold text-navy">{title}</h2>}
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
/**
 * The line above a page's content: what this screen is for, and its main action.
 *
 * It deliberately does NOT render the page name. The console's topbar already
 * shows it, so every screen printed its title twice — "Shipping / Shipping",
 * "Customers / Customers" — and burned ~90px of vertical space before any
 * content appeared. `title` is still accepted so call sites read clearly and
 * so it can be used as the accessible label, but it isn't drawn.
 */
export function PageHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p aria-label={title} className="text-[13.5px] text-muted">{sub}</p>
      {action}
    </div>
  );
}

/**
 * A row of small counts sharing one card, divided by hairlines.
 *
 * Three separate cards for three single-digit counts gave each the width of a
 * headline figure and left most of it empty. Counts belong together.
 */
export function StatStrip({
  items, cols = 3,
}: {
  items: { label: string; value: ReactNode; hint?: string; href?: string; live?: boolean }[];
  /** Columns on a wide screen. Pick the item count so no cell is left empty. */
  cols?: 3 | 4;
}) {
  const wide = cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-white sm:divide-x ${wide}`}>
      {items.map((it) => {
        const body = (
          <>
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
              {it.label}
              {it.live && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
                </span>
              )}
            </div>
            <div className="mt-1 font-num text-[19px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-navy">
              {it.value}
            </div>
            {it.hint && <div className="mt-0.5 text-[11px] text-faint">{it.hint}</div>}
          </>
        );
        return it.href
          ? <Link key={it.label} href={it.href} className="px-4 py-3 transition-colors hover:bg-paper/70">{body}</Link>
          : <div key={it.label} className="px-4 py-3">{body}</div>;
      })}
    </div>
  );
}

/**
 * Switches between the two account pages.
 *
 * Profile and Settings are one job split across two screens, so each shows
 * the pair and marks which you're on — otherwise changing your handle means
 * going back to the sidebar to find the other half.
 */
export function AccountTabs({ active }: { active: '/seller/profile' | '/seller/settings' }) {
  const tabs = [
    { href: '/seller/profile', label: 'Profile', hint: 'Public store identity' },
    { href: '/seller/settings', label: 'Settings', hint: 'Account & store preferences' },
  ] as const;

  return (
    <div className="mb-5 flex gap-2">
      {tabs.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`flex-1 rounded-xl border px-4 py-2.5 transition-colors ${
              on ? 'border-green bg-green-soft/50' : 'border-line bg-white hover:border-green/40'
            }`}
          >
            <div className={`text-[13.5px] font-bold ${on ? 'text-navy' : 'text-muted'}`}>{t.label}</div>
            <div className="text-[11.5px] text-faint">{t.hint}</div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * A titled group of settings rows.
 *
 * The heading sits on the page background and the rows sit in one bordered
 * card beneath it, so a long form reads as a few labelled groups instead of
 * one tall wall of inputs. Used by Profile and Settings.
 */
export function SettingsSection({
  icon, title, sub, children,
}: { icon?: ReactNode; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <div className="mb-2 flex items-start gap-2.5 px-1">
        {icon && (
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-green-soft text-green-600">
            {icon}
          </span>
        )}
        <div>
          <h2 className="font-display text-[14px] font-bold text-navy">{title}</h2>
          {sub && <p className="text-[12px] text-muted">{sub}</p>}
        </div>
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {children}
      </div>
    </section>
  );
}

/**
 * One setting: what it is on the left, the control on the right.
 *
 * Stacks on narrow screens — a label and a text field side by side below
 * ~520px leaves the field too narrow to read what you typed.
 */
export function SettingsRow({
  label, hint, children, stack,
}: { label: string; hint?: string; children?: ReactNode; stack?: boolean }) {
  return (
    <div className={`gap-3 px-4 py-3.5 ${stack ? '' : 'sm:flex sm:items-center sm:justify-between'}`}>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-navy">{label}</div>
        {hint && <p className="mt-0.5 text-[12px] leading-snug text-muted">{hint}</p>}
      </div>
      {children && (
        <div className={stack ? 'mt-2' : 'mt-2 shrink-0 sm:mt-0 sm:w-[min(320px,45%)]'}>{children}</div>
      )}
    </div>
  );
}

export const money = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

/**
 * A buyer, as a round avatar with their initials.
 *
 * The order rows used to lead with a shopping-bag glyph, identical on every
 * row, which read as a delete button and told you nothing. Initials make each
 * row recognisable at a glance — the same customer ordering twice looks the
 * same twice — and the tint is derived from the name, so it is stable across
 * visits without storing anything. With no name there is nothing to abbreviate,
 * so a plain person glyph stands in.
 */
const AVATAR_TINTS: [string, string][] = [
  ['#E3F6EC', '#15784A'],
  ['#E6EEF8', '#2F5B8A'],
  ['#FBF1DE', '#8A6116'],
  ['#FBE9E7', '#9C4A3F'],
  ['#EEEAF8', '#5B4A91'],
  ['#E2F3F2', '#1F6E6A'],
];

export function BuyerAvatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  const clean = String(name || '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  // Array.from, not [0]: a name can start with an emoji or a multi-byte letter.
  const initials = words.slice(0, 2).map((w) => Array.from(w)[0] || '').join('').toUpperCase();

  let hash = 0;
  for (const ch of clean.toLowerCase()) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  const [bg, fg] = AVATAR_TINTS[hash % AVATAR_TINTS.length];

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-display font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.36) }}
    >
      {initials || (
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )}
    </span>
  );
}
