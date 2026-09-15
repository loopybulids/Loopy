'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { AreaTrend, Card, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';
import LedgerBanner from '@/components/admin/LedgerBanner';
import ExportMenu from '@/components/admin/ExportMenu';
import RangePicker from '@/components/admin/RangePicker';
import { rangeDates, rangeLabel, rangeQuery, useAdminRange } from '@/lib/admin-range';

export default function FinanceCenter() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [range, setRange] = useAdminRange();
  const query = rangeQuery(range);
  const latest = useRef(query);
  latest.current = query;
  const load = () => {
    const q = query;
    return api.adminFinance(q)
      .then((r) => { if (latest.current === q) { setD(r); setErr(''); } })
      .catch((e) => { if (latest.current === q) setErr(e?.message || 'Failed'); });
  };
  useEffect(() => { load(); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Approve or reject a withdrawal.
   *
   * The confirmation spells out the amount and destination, because this is
   * the click that actually moves a seller's money. The key is minted per
   * click so a retry is a no-op, and the row's version goes back with it so a
   * stale screen can't overwrite someone else's decision.
   */
  const decide = async (s: any, action: 'approve' | 'reject') => {
    const who = s.seller?.storeName || s.sellerId.slice(-8);
    const dest = s.seller?.payoutMethod === 'bank'
      ? s.seller?.payoutAccount
      : s.seller?.payoutUpi;

    const note = action === 'reject'
      ? window.prompt(`Why is ${who}'s ${money(s.amount)} payout being rejected?\n\nThe seller sees this.`)
      : window.prompt(`Approving ${money(s.amount)} to ${who}${dest ? `\nDestination: ${dest}` : ''}\n\nEnter the bank/UPI transfer reference (optional):`, '');
    if (note === null) return; // cancelled
    if (action === 'reject' && !note.trim()) { alert('A reason is required to reject.'); return; }

    if (action === 'approve' && !confirm(
      `Confirm: pay ${money(s.amount)} to ${who}.\n\nOnly approve once the transfer has actually been made. This cannot be undone.`,
    )) return;

    setBusy(s.id);
    try {
      await api.adminPayoutAction(s.id, action, s.version, crypto.randomUUID(), note.trim() || undefined);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed');
      await load(); // a stale-version rejection means this screen is out of date
    }
    setBusy('');
  };

  if (err) return <Card className="p-6 text-alert">{err}</Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-hair" /></div>;
  const f = d.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-[26px] font-bold text-slate">Finance Center</h1><p className="text-[14px] text-dim">{rangeDates(range)} · revenue, commission, payouts and settlements</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker range={range} onChange={setRange} />
          <ExportMenu range={range} datasets={['payouts', 'summary', 'orders', 'sellers']} />
        </div>
      </div>

      {/* Whether these figures can be trusted, before the figures themselves. */}
      <LedgerBanner ledger={d.ledger} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="GMV" value={money(f.gmv)} icon="rupee" accent="navy" />
        <StatCard label="Revenue (Commission)" value={money(f.revenue)} icon="wallet" accent="green" />
        <StatCard label="Net Profit" value={money(f.netProfit)} icon="bolt" accent="green" hint="After refunds" />
        <StatCard label="GST (est.)" value={money(f.gst)} icon="shield" accent="violet" />
        <StatCard label="Seller Earnings" value={money(f.sellerEarnings)} icon="store" accent="navy" />
        <StatCard label="Shipping Collected" value={money(f.shipping)} icon="truck" accent="navy" />
        <StatCard label="Refund Cost" value={money(f.refundCost)} icon="refund" accent={f.refundCost ? 'rose' : 'green'} />
        <StatCard label="Payouts Pending" value={money(f.payoutPending)} icon="rupee" accent={f.payoutPending ? 'amber' : 'green'} hint="Every open request" />
      </div>

      <Card className="p-5">
        <SectionTitle action={<span className="text-[12px] font-semibold text-accent">Commission · {rangeLabel(range)}</span>}>Cash Flow</SectionTitle>
        <AreaTrend data={d.cashflow} money height={240} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-hair px-4 py-3"><SectionTitle action={<span className="text-[11.5px] text-pale">All pending · decided in period</span>}>Seller Settlements</SectionTitle></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead><tr className="border-b border-hair text-[11px] uppercase tracking-wide text-pale"><th className="px-4 py-3 font-bold">Seller</th><th className="py-3 font-bold">Destination</th><th className="py-3 text-right font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold">Requested</th><th className="py-3 pr-4 text-right font-bold">Decision</th></tr></thead>
            <tbody className="divide-y divide-hair">
              {d.settlements.map((s: any) => (
                <tr key={s.id} className="hover:bg-cool/60">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate">{s.seller?.storeName || 'Unknown store'}</div>
                    <div className="font-mono text-[11px] text-pale">{s.seller?.username ? `@${s.seller.username}` : s.sellerId.slice(-8)}</div>
                  </td>
                  <td className="py-3 text-[12px] text-dim">
                    {s.seller?.payoutMethod === 'bank'
                      ? (s.seller?.payoutAccount || <span className="text-alert">No account on file</span>)
                      : (s.seller?.payoutUpi || <span className="text-alert">No UPI on file</span>)}
                    {s.seller?.payoutName && <div className="text-[11px] text-pale">{s.seller.payoutName}</div>}
                  </td>
                  <td className="py-3 text-right font-num font-semibold tabular-nums text-slate">{money(s.amount)}</td>
                  <td className="py-3">
                    {statusChip(s.status)}
                    {s.note && <div className="mt-0.5 max-w-[180px] text-[11px] text-pale">{s.note}</div>}
                  </td>
                  <td className="py-3 text-[12px] text-dim">
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                    {s.decidedAt && (
                      <div className="text-[11px] text-pale">
                        decided {new Date(s.decidedAt).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {s.status === 'requested' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => decide(s, 'approve')}
                          disabled={busy === s.id}
                          className="rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                        >
                          {busy === s.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => decide(s, 'reject')}
                          disabled={busy === s.id}
                          className="rounded-lg bg-alert-soft px-2.5 py-1.5 text-[12px] font-bold text-alert disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11.5px] text-pale">
                        {s.decidedBy ? `by ${s.decidedBy}` : '—'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!d.settlements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-dim">No withdrawal requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
