'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AreaTrend, Card, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';
import LedgerBanner from '@/components/admin/LedgerBanner';

export default function FinanceCenter() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const load = () => api.adminFinance().then(setD).catch((e) => setErr(e?.message || 'Failed'));
  useEffect(() => { load(); }, []);

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

  if (err) return <Card className="p-6 text-rose">{err}</Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-line" /></div>;
  const f = d.summary;

  const exportCsv = () => {
    const rows = [['id', 'sellerId', 'amount', 'status', 'date'], ...d.settlements.map((s: any) => [s.id, s.sellerId, s.amount, s.status, new Date(s.createdAt).toISOString()])];
    const csv = rows.map((r: any[]) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'loopy-settlements.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-[26px] font-extrabold text-navy">Finance Center</h1><p className="text-[14px] text-muted">Revenue, commission, payouts, taxes and settlements.</p></div>
        <button onClick={exportCsv} className="rounded-xl bg-navy px-4 py-2 text-[12.5px] font-bold text-white">Export settlements (CSV)</button>
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
        <StatCard label="Payouts Pending" value={money(f.payoutPending)} icon="rupee" accent={f.payoutPending ? 'amber' : 'green'} />
      </div>

      <Card className="p-5">
        <SectionTitle action={<span className="text-[12px] font-semibold text-green-600">Commission · 30 days</span>}>Cash Flow</SectionTitle>
        <AreaTrend data={d.cashflow} money height={240} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3"><SectionTitle>Seller Settlements</SectionTitle></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint"><th className="px-4 py-3 font-bold">Seller</th><th className="py-3 font-bold">Destination</th><th className="py-3 text-right font-bold">Amount</th><th className="py-3 font-bold">Status</th><th className="py-3 font-bold">Requested</th><th className="py-3 pr-4 text-right font-bold">Decision</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.settlements.map((s: any) => (
                <tr key={s.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <div className="font-bold text-navy">{s.seller?.storeName || 'Unknown store'}</div>
                    <div className="font-mono text-[11px] text-faint">{s.seller?.username ? `@${s.seller.username}` : s.sellerId.slice(-8)}</div>
                  </td>
                  <td className="py-3 text-[12px] text-muted">
                    {s.seller?.payoutMethod === 'bank'
                      ? (s.seller?.payoutAccount || <span className="text-rose">No account on file</span>)
                      : (s.seller?.payoutUpi || <span className="text-rose">No UPI on file</span>)}
                    {s.seller?.payoutName && <div className="text-[11px] text-faint">{s.seller.payoutName}</div>}
                  </td>
                  <td className="py-3 text-right font-bold tabular-nums text-navy">{money(s.amount)}</td>
                  <td className="py-3">
                    {statusChip(s.status)}
                    {s.note && <div className="mt-0.5 max-w-[180px] text-[11px] text-faint">{s.note}</div>}
                  </td>
                  <td className="py-3 text-[12px] text-muted">
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                    {s.decidedAt && (
                      <div className="text-[11px] text-faint">
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
                          className="rounded-lg bg-green px-2.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                        >
                          {busy === s.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => decide(s, 'reject')}
                          disabled={busy === s.id}
                          className="rounded-lg bg-rose-soft px-2.5 py-1.5 text-[12px] font-bold text-rose disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11.5px] text-faint">
                        {s.decidedBy ? `by ${s.decidedBy}` : '—'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!d.settlements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No withdrawal requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
