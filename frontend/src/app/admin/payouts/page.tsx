'use client';
import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, Chip, Icon, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

/**
 * The withdrawal queue.
 *
 * Its own screen because these are the only rows in the admin that someone is
 * actively waiting on: a seller has asked for their money and cannot get it
 * until an operator acts. As a table inside Finance it sat below a page of
 * charts and was easy to never look at.
 *
 * Each waiting request shows the destination, what the seller has earned, and
 * anything that should stop the payment — so the decision is made from this
 * screen without opening another.
 */
export default function Payouts() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api.adminPayouts().then(setD).catch((e) => setErr(e?.message || 'Failed to load'));
  useEffect(() => { load(); }, []);

  // The request whose voucher is open, and what is about to be done to it.
  const [sheet, setSheet] = useState<{ p: any; action: 'approve' | 'reject' } | null>(null);

  /**
   * Apply one decision.
   *
   * The key is minted per click, so the browser retrying is a no-op while a
   * deliberate second decision is a new one; the row's version goes back so a
   * screen loaded before someone else decided is refused rather than applied.
   *
   * Returns the failure message rather than showing it: the voucher is still
   * open and is where the operator is looking.
   */
  const decide = async (p: any, action: 'approve' | 'reject', note: string): Promise<string | null> => {
    setBusy(p.id);
    try {
      await api.adminPayoutAction(p.id, action, p.version, crypto.randomUUID(), note.trim() || undefined);
      setSheet(null);
      await load();
      return null;
    } catch (e: any) {
      await load(); // a stale-version refusal means this screen is out of date
      return e?.message || 'That did not go through.';
    } finally {
      setBusy('');
    }
  };

  if (err) return <Card className="p-6 text-alert">{err}</Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-hair" /><div className="h-24 rounded-2xl bg-hair/60" /></div>;

  const s = d.summary;

  return (
    <div className="space-y-5">
      {sheet && (
        <PayoutBill
          p={sheet.p}
          action={sheet.action}
          busy={busy === sheet.p.id}
          onClose={() => setSheet(null)}
          onConfirm={(note) => decide(sheet.p, sheet.action, note)}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate">Payout Requests</h1>
          <p className="text-[14px] text-dim">Sellers waiting to be paid. Approving records that you have made the transfer.</p>
        </div>
        <button onClick={load} className="rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600">Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting decision" value={String(s.pendingCount)} icon="rupee" accent={s.pendingCount ? 'amber' : 'green'} />
        <StatCard label="Amount requested" value={money(s.pendingAmount)} icon="wallet" accent="navy" />
        <StatCard label="Needs attention" value={String(s.needsAttention)} icon="alert" accent={s.needsAttention ? 'rose' : 'green'} hint="Missing details or over balance" />
        <StatCard label="Paid to date" value={money(s.paidAmount)} icon="check" accent="green" />
      </div>

      {/* the queue */}
      <Card className="overflow-hidden">
        <div className="border-b border-hair px-4 py-3">
          <SectionTitle action={s.pendingCount ? <span className="chip-warn">{s.pendingCount} waiting</span> : undefined}>
            Awaiting your decision
          </SectionTitle>
        </div>

        {d.pending.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-[14px] font-bold text-slate">Nothing waiting</div>
            <p className="mt-1 text-[13px] text-dim">Withdrawal requests will appear here the moment a seller makes one.</p>
          </div>
        ) : (
          <div className="divide-y divide-hair">
            {d.pending.map((p: any) => (
              <div key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* who + where */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[15px] font-bold text-slate">
                        {p.seller?.storeName || 'Unknown store'}
                      </span>
                      {p.seller?.username && <span className="font-mono text-[11.5px] text-pale">@{p.seller.username}</span>}
                      {p.seller?.kyc && (
                        <Chip tone={['approved', 'verified'].includes(p.seller.kyc) ? 'green' : 'amber'}>KYC {p.seller.kyc}</Chip>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-0.5 text-[12.5px]">
                      <div>
                        <span className="text-dim">{p.seller?.method === 'bank' ? 'Bank account' : 'UPI'}: </span>
                        {p.seller?.destination
                          ? <b className="select-all font-mono text-slate">{p.seller.destination}</b>
                          : <b className="text-alert">not provided</b>}
                        {p.seller?.accountName && <span className="text-pale"> · {p.seller.accountName}</span>}
                      </div>
                      <div className="text-pale">
                        Earned {money(p.seller?.lifetimeEarned ?? 0)} · already paid {money(p.seller?.alreadyPaid ?? 0)}
                      </div>
                      <div className="text-pale">
                        Requested {new Date(p.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {p.seller?.email ? ` · ${p.seller.email}` : ''}
                      </div>
                    </div>

                    {!!p.warnings?.length && (
                      <ul className="mt-2 space-y-0.5">
                        {p.warnings.map((w: string) => (
                          <li key={w} className="flex items-start gap-1.5 text-[12px] font-semibold text-alert">
                            <Icon name="alert" size={13} /> {w}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* amount + decision */}
                  <div className="shrink-0 text-right">
                    <div className="font-num text-[23px] font-semibold leading-none tracking-[-0.03em] text-slate">{money(p.amount)}</div>
                    <div className="mt-3 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSheet({ p, action: 'approve' })}
                        disabled={busy === p.id}
                        className="rounded-xl bg-accent px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
                      >
                        {busy === p.id ? '…' : 'Approve & mark paid'}
                      </button>
                      <button
                        onClick={() => setSheet({ p, action: 'reject' })}
                        disabled={busy === p.id}
                        className="rounded-xl bg-alert-soft px-3 py-2 text-[12.5px] font-bold text-alert disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* history */}
      <Card className="overflow-hidden">
        <div className="border-b border-hair px-4 py-3"><SectionTitle>Decided</SectionTitle></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hair text-[11px] uppercase tracking-wide text-pale">
                <th className="px-4 py-3 font-bold">Seller</th>
                <th className="py-3 text-right font-bold">Amount</th>
                <th className="py-3 font-bold">Outcome</th>
                <th className="py-3 font-bold">Reference / reason</th>
                <th className="py-3 pr-4 font-bold">Decided by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {d.decided.map((p: any) => (
                <tr key={p.id} className="hover:bg-cool/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate">{p.seller?.storeName || '—'}</div>
                    {p.seller?.username && <div className="font-mono text-[11px] text-pale">@{p.seller.username}</div>}
                  </td>
                  <td className="py-3 text-right font-num font-semibold tabular-nums text-slate">{money(p.amount)}</td>
                  <td className="py-3">{statusChip(p.status)}</td>
                  <td className="py-3 max-w-[240px] text-[12px] text-dim">{p.note || '—'}</td>
                  <td className="py-3 pr-4 text-[12px] text-dim">
                    {p.decidedBy || '—'}
                    {p.decidedAt && (
                      <div className="text-[11px] text-pale">{new Date(p.decidedAt).toLocaleDateString('en-IN')}</div>
                    )}
                  </td>
                </tr>
              ))}
              {!d.decided.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-dim">No decisions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * The payout voucher.
 *
 * This replaces a confirm() followed by a prompt(). Paying a seller is the one
 * irreversible act on this screen, and those native dialogs showed the amount
 * and the destination in two separate steps, in a box whose text cannot be
 * selected — so a UPI ID could not be copied or checked against a banking app
 * before approving. The voucher lays the whole bill out at once: who is paid,
 * where, how much, what they have earned and been paid before, and anything
 * that should stop the transfer. The reference or the rejection reason is
 * typed in the same place.
 */
function PayoutBill({ p, action, busy, onClose, onConfirm }: {
  p: any;
  action: 'approve' | 'reject';
  busy: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<string | null>;
}) {
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const rejecting = action === 'reject';
  const seller = p.seller || {};

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    if (rejecting && !note.trim()) {
      setErr('A reason is required — the seller sees it.');
      return;
    }
    setErr('');
    const failed = await onConfirm(note);
    if (failed) setErr(failed);
  };

  const row = (label: string, value: ReactNode, mono = false) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="shrink-0 text-[11.5px] text-dim">{label}</span>
      <span className={`text-right text-[12.5px] font-semibold text-slate ${mono ? 'break-all font-mono text-[12px]' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Payout voucher"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-hair bg-white shadow-[0_28px_70px_-24px_rgba(15,23,42,0.5)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hair bg-cool/60 px-5 py-4">
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-pale">Payout voucher</div>
            <div className="mt-0.5 truncate font-display text-[16px] font-bold text-slate">{seller.storeName || 'Unknown store'}</div>
            <div className="truncate font-mono text-[11px] text-pale">
              {seller.username ? `@${seller.username}` : String(p.sellerId || '').slice(-8)} · #{String(p.id).slice(-8).toUpperCase()}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-num text-[24px] font-semibold leading-none tracking-[-0.03em] text-slate">{money(p.amount)}</div>
            <div className="mt-1 text-[10.5px] text-pale">to transfer</div>
          </div>
        </div>

        <div className="divide-y divide-hair/70 px-5">
          {row('Method', seller.method === 'bank' ? 'Bank transfer' : 'UPI')}
          {row('Destination', seller.destination || <span className="text-alert">Nothing on file</span>, true)}
          {row('Account holder', seller.accountName || '—')}
          {row('KYC', <Chip tone={seller.kyc === 'approved' ? 'green' : 'amber'}>{seller.kyc || 'unknown'}</Chip>)}
          {row('Requested', p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '—')}
          {row('Contact', seller.payoutEmail || seller.email || '—', true)}
          {row('Earned to date', money(seller.lifetimeEarned || 0))}
          {row('Already paid', money(seller.alreadyPaid || 0))}
        </div>

        {!!p.warnings?.length && (
          <div className="mx-5 mt-3 space-y-0.5 rounded-lg border border-alert/25 bg-alert-soft/60 p-3">
            {p.warnings.map((w: string) => (
              <div key={w} className="flex items-start gap-1.5 text-[12px] font-semibold text-alert">
                <Icon name="alert" size={13} /> {w}
              </div>
            ))}
          </div>
        )}

        <div className="px-5 pb-1 pt-4">
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-pale">
            {rejecting ? 'Reason (the seller sees this)' : 'Transfer reference (UTR / txn id)'}
          </label>
          <textarea
            autoFocus
            rows={rejecting ? 3 : 2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={rejecting ? 'e.g. the UPI ID does not match the KYC name' : 'Optional — worth keeping for reconciliation'}
            className="mt-1.5 w-full rounded-lg border border-hair bg-white px-3 py-2 text-[13px] text-slate outline-none focus:border-accent/60"
          />
          <p className="mt-2.5 text-[11.5px] leading-snug text-dim">
            {rejecting
              ? 'The request is closed and the money goes back to the seller’s available balance, where they can ask again.'
              : 'Approve only once the transfer has actually been made from your bank or UPI app. This cannot be undone.'}
          </p>
          {err && <p className="mt-2 text-[12px] font-semibold text-alert">{err}</p>}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-hair bg-cool/40 px-5 py-3.5">
          <button onClick={onClose} className="rounded-xl border border-hair bg-white px-3.5 py-2 text-[12.5px] font-bold text-dim transition-colors hover:text-slate">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition-colors disabled:opacity-50 ${rejecting ? 'bg-alert hover:opacity-90' : 'bg-accent hover:bg-accent-600'}`}
          >
            {busy ? 'Working…' : rejecting ? 'Reject request' : `Mark ${money(p.amount)} as paid`}
          </button>
        </div>
      </div>
    </div>
  );
}
