'use client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Icon } from '@/components/admin/AdminKit';

type IconName = Parameters<typeof Icon>[0]['name'];
type Tone = 'alert' | 'warn' | 'info';

interface Notice {
  id: string;
  kind: 'payout' | 'dispute' | 'refund' | 'kyc' | 'review' | 'order';
  tone: Tone;
  title: string;
  body: string;
  href: string;
  at: string;
  important: boolean;
}

const SEEN_KEY = 'loopy_admin_seen';
const POLL_MS = 60_000;

const GLYPH: Record<Notice['kind'], IconName> = {
  payout: 'rupee', dispute: 'alert', refund: 'refund', kyc: 'shield', review: 'star', order: 'bag',
};
const TILE: Record<Tone, string> = {
  alert: 'bg-alert-soft text-alert',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-accent-soft text-accent',
};

function readSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function writeSeen(s: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s])); } catch { /* read-marks last this visit only */ }
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="sticky top-0 z-[1] bg-white/95 px-4 pb-1.5 pt-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-pale backdrop-blur">
        {title}
      </div>
      <ul className="divide-y divide-hair/70">{children}</ul>
    </div>
  );
}

/**
 * The admin bell.
 *
 * The list comes from live admin state (AdminService.notifications): open
 * payout requests, disputes, refunds owed, KYC reviews, low ratings and new
 * orders. Because it reads the facts directly, an item leaves the list the
 * moment it is dealt with — from any screen, by any admin.
 *
 * What *is* local is which items you have read. That is kept in this browser,
 * so the badge reflects what you personally have not looked at yet; it clears
 * per item on click, or all at once. New orders are listed but never counted
 * in the badge — a badge that counts sales on a busy day is one everybody
 * learns to ignore, and then it hides the payout request as well.
 */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[] | null>(null);
  const [err, setErr] = useState('');
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setSeen(readSeen()); }, []);

  const load = useCallback(async () => {
    try {
      const r = await api.adminNotifications();
      const list: Notice[] = r?.items || [];
      setItems(list);
      setErr('');
      // Forget read-marks for items that no longer exist, so the stored set
      // cannot grow without bound.
      setSeen((prev) => {
        const live = new Set(list.map((i) => i.id));
        const kept = new Set([...prev].filter((id) => live.has(id)));
        if (kept.size !== prev.size) writeSeen(kept);
        return kept;
      });
    } catch (e: any) {
      setErr(e?.message || 'Could not load notifications.');
    }
  }, []);

  // Poll while the tab is visible, and catch up the moment it comes back.
  useEffect(() => {
    load();
    const tick = () => { if (document.visibilityState === 'visible') load(); };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [load]);

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

  const markSeen = (ids: string[]) =>
    setSeen((prev) => {
      const next = new Set(prev);
      ids.forEach((i) => next.add(i));
      writeSeen(next);
      return next;
    });

  const list = items || [];
  const unread = list.filter((i) => i.important && !seen.has(i.id)).length;
  const attention = list.filter((i) => i.important);
  const activity = list.filter((i) => !i.important);

  const go = (i: Notice) => {
    markSeen([i.id]);
    setOpen(false);
    router.push(i.href);
  };

  const row = (i: Notice) => {
    const fresh = i.important && !seen.has(i.id);
    return (
      <li key={i.id}>
        <button type="button" onClick={() => go(i)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cool/70">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TILE[i.tone]}`}>
            <Icon name={GLYPH[i.kind] || 'bell'} size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[12.5px] text-slate ${fresh ? 'font-semibold' : 'font-medium'}`}>{i.title}</span>
            <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-dim">{i.body}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <span className="font-num text-[10.5px] text-pale">{ago(i.at)}</span>
            {fresh && <span className="h-2 w-2 rounded-full bg-accent" aria-label="Unread" />}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => { if (!open) load(); setOpen((o) => !o); }}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-white text-slate transition-colors hover:border-accent/40 ${open ? 'border-accent/50' : 'border-hair'}`}
      >
        <Icon name="bell" size={16} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-alert px-1 font-num text-[10px] font-semibold leading-none text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[4.25rem] z-50 flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-xl border border-hair bg-white shadow-[0_22px_56px_-22px_rgba(15,23,42,0.4)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:max-h-[min(560px,calc(100dvh-6rem))] sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3">
            <div>
              <div className="font-display text-[14px] font-bold text-slate">Notifications</div>
              <div className="text-[11px] text-pale">
                {attention.length ? `${attention.length} need${attention.length === 1 ? 's' : ''} attention` : 'Nothing needs attention'}
              </div>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => markSeen(list.map((i) => i.id))} className="text-[11.5px] font-semibold text-accent hover:text-accent-600">
                Mark all read
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {items === null && !err && <div className="animate-pulse px-4 py-8 text-center text-[12.5px] text-dim">Loading…</div>}

            {items === null && err && (
              <div className="px-4 py-6 text-center text-[12.5px] text-alert">
                {err}{' '}
                <button type="button" onClick={load} className="font-semibold underline">Retry</button>
              </div>
            )}

            {items !== null && !list.length && (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Icon name="check" size={18} /></span>
                <p className="mt-2.5 text-[13px] font-semibold text-slate">You’re all caught up</p>
                <p className="mt-0.5 text-[11.5px] text-dim">Payout requests, disputes and KYC reviews will show up here.</p>
              </div>
            )}

            {attention.length > 0 && <Section title="Needs attention">{attention.map(row)}</Section>}
            {activity.length > 0 && <Section title="New orders · last 7 days">{activity.map(row)}</Section>}
          </div>
        </div>
      )}
    </div>
  );
}
