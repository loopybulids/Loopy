'use client';
import { useEffect, useState } from 'react';
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

  /**
   * Approve or reject one request.
   *
   * The key is minted per click, so the browser retrying is a no-op while a
   * deliberate second decision is a new one; the row's version goes back so a
   * screen loaded before someone else decided is refused rather than applied.
   */
  const decide = async (p: any, action: 'approve' | 'reject') => {
    const who = p.seller?.storeName || p.sellerId?.slice(-8) || 'this seller';

    let note: string | null = '';
    if (action === 'reject') {
      note = window.prompt(`Why is ${who}'s ${money(p.amount)} withdrawal being rejected?\n\nThe seller sees this reason.`);
      if (note === null) return;
      if (!note.trim()) { alert('A reason is required to reject.'); return; }
    } else {
      const lines = [
        `Pay ${money(p.amount)} to ${who}.`,
        p.seller?.destination ? `${p.seller.method === 'bank' ? 'Account' : 'UPI'}: ${p.seller.destination}` : 'NO DESTINATION ON FILE',
        p.seller?.accountName ? `Name: ${p.seller.accountName}` : '',
        '',
        ...(p.warnings?.length ? ['⚠ ' + p.warnings.join('\n⚠ '), ''] : []),
        'Approve only once the transfer has actually been made.',
        'This cannot be undone.',
      ].filter(Boolean);
      if (!confirm(lines.join('\n'))) return;
      note = window.prompt('Transfer reference (optional):', '') ?? '';
    }

    setBusy(p.id);
    try {
      await api.adminPayoutAction(p.id, action, p.version, crypto.randomUUID(), note.trim() || undefined);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed');
      await load(); // a stale-version refusal means this screen is out of date
    }
    setBusy('');
  };

  if (err) return <Card className="p-6 text-alert">{err}</Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-hair" /><div className="h-24 rounded-2xl bg-hair/60" /></div>;

  const s = d.summary;

  return (
    <div className="space-y-5">
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
                        onClick={() => decide(p, 'approve')}
                        disabled={busy === p.id}
                        className="rounded-xl bg-accent px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
                      >
                        {busy === p.id ? '…' : 'Approve & mark paid'}
                      </button>
                      <button
                        onClick={() => decide(p, 'reject')}
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
