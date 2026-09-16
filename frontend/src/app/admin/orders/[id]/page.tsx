'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Chip, Icon, money, SectionTitle, statusChip } from '@/components/admin/AdminKit';

/** Where a refund can go next — mirrors REFUND_NEXT in backend common/money-actions. */
const REFUND_NEXT: Record<string, string[]> = {
  Required: ['Initiated'],
  Initiated: ['Refunded', 'Failed'],
  Failed: ['Initiated'],
  Refunded: [],
};

export default function OrderInvestigation() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [audit, setAudit] = useState<any[]>([]);


  const [payMsg, setPayMsg] = useState('');

  const load = () => api.adminOrderDetail(id).then(setD).catch((e) => setErr(e?.message || 'Not found'));

  /**
   * Ask the payment gateway whether this order's money arrived.
   *
   * The buyer's own return from checkout normally records it, and a webhook
   * covers the case where they close the tab — but a webhook needs a public
   * API URL and can be missed, and the gateway only keeps a session for five
   * minutes. This is the manual route for "I paid but it still says unpaid",
   * and it cannot invent a payment: it records one only if the gateway
   * confirms it.
   */
  const checkPayment = async () => {
    setBusy('verify');
    setPayMsg('');
    try {
      const updated = await api.confirmPayment(id);
      setPayMsg(updated?.status === 'Paid' ? 'Payment confirmed — this order is now Paid.' : 'The gateway has no payment for this order yet.');
      await load();
    } catch (e: any) {
      setPayMsg(e?.message || 'Could not check the payment.');
    } finally {
      setBusy('');
    }
  };
  const loadAudit = () => api.adminOrderAudit(id).then(setAudit).catch(() => setAudit([]));

  /**
   * Run an admin action against the exact version of the order on screen.
   *
   * The key is minted once per click, so the browser retrying that request is
   * a no-op server-side, while a genuine second click is a new decision with a
   * new key. Money actions spell out the amount in the confirmation, because
   * "Mark Delivered" doesn't tell the operator they are releasing ₹7,200.
   */
  const act = async (action: string, label: string, isMoney: boolean) => {
    const question = isMoney
      ? `${label}

${money(d.amounts.total)} collected from the customer.
`
        + `${money(d.amounts.sellerReceivable)} goes to ${d.seller?.storeName || 'the seller'}.
`
        + `${money(d.amounts.platformFee)} is Loopy's fee.

This cannot be undone. Continue?`
      : `${label} — order #${d.id.slice(-6).toUpperCase()}?`;
    if (!confirm(question)) return;

    setBusy(action);
    try {
      await api.adminOrderAction(id, action, d.version, crypto.randomUUID());
      await Promise.all([load(), loadAudit()]);
    } catch (e: any) {
      alert(e?.message || 'Failed');
      await load(); // a stale-version rejection means the screen is out of date
    }
    setBusy('');
  };

  useEffect(() => { load(); loadAudit(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveRefund = async (to: string) => {
    if (!confirm(`Mark this refund as ${to}?`)) return;
    setBusy(`refund:${to}`);
    try {
      await api.adminSetRefundState(id, to, d.version, crypto.randomUUID());
      await Promise.all([load(), loadAudit()]);
    } catch (e: any) { alert(e?.message || 'Failed'); await load(); }
    setBusy('');
  };

  if (err) return <Card className="p-6 text-alert">{err} — <Link href="/admin/orders" className="underline">back to orders</Link></Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-hair" /></div>;

  const riskTone = d.risk > 50 ? 'rose' : d.risk > 20 ? 'amber' : 'green';

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-dim hover:text-slate"><Icon name="back" size={15} /> Orders</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[26px] font-bold text-slate">Order #{d.id.slice(-6).toUpperCase()}</h1>
            {statusChip(d.status)}
          </div>
          <p className="text-[13px] text-dim">Placed {new Date(d.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={riskTone as any}>Risk {d.risk}/100</Chip>
          <Chip tone={d.fraudScore === 'High' ? 'rose' : d.fraudScore === 'Medium' ? 'amber' : 'green'}>Fraud: {d.fraudScore}</Chip>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* timeline */}
          <Card className="p-5">
            <SectionTitle>Order Timeline</SectionTitle>
            <ol className="relative ml-2 space-y-4 border-l-2 border-hair pl-5">
              {d.timeline.map((t: any) => (
                <li key={t.key} className="relative">
                  <span className={`absolute -left-[1.65rem] top-0.5 grid h-5 w-5 place-items-center rounded-full text-white ${t.done ? 'bg-accent' : 'bg-hair'}`}><Icon name="check" size={12} /></span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[13.5px] font-bold ${t.done ? 'text-slate' : 'text-pale'}`}>{t.label}</span>
                    {t.at && <span className="text-[11px] text-dim">{new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  {t.note && <div className="text-[11px] text-dim">{t.note}</div>}
                </li>
              ))}
            </ol>
          </Card>

          {/* items */}
          <Card className="p-5">
            <SectionTitle>Items ({d.items.length})</SectionTitle>
            <div className="space-y-3">
              {d.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cool">{it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-pale"><Icon name="box" size={18} /></span>}</span>
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-slate">{it.title}</div><div className="text-[11px] text-dim">{[it.brand, it.category, it.condition].filter(Boolean).join(' · ')}</div></div>
                  <div className="text-right text-[13px]"><div className="font-bold text-slate">{money(it.price)}</div><div className="text-[11px] text-dim">×{it.qty}</div></div>
                </div>
              ))}
            </div>
          </Card>

          {/* payment + settlement */}
          <Card className="p-5">
            <SectionTitle>Payment & Settlement</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-3">
              <Field label="Method" value={d.payment.method} />
              <Field label="Payment ID" value={d.payment.id || '—'} />
              <Field label="Gateway Ref" value={d.payment.razorpay || '—'} />
            </div>

            {/* Customer-facing lines. These three always sum to the total —
                platform economics are shown separately below so the breakdown
                can never appear to disagree with what was charged. */}
            <div className="mt-4 border-t border-hair pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-pale">What the customer paid</div>
              <div className="space-y-1.5 text-[13px]">
                <Line label="Items" value={money(d.amounts.items)} />
                <Line label="Shipping" value={money(d.amounts.shipping)} />
                <Line label={`Platform fee (${d.amounts.items ? Math.round((d.amounts.platformFee / d.amounts.items) * 100) : 0}%)`} value={money(d.amounts.platformFee)} />
                <div className="flex justify-between border-t border-hair pt-1.5 text-[14px] font-bold text-slate">
                  <span>Order total</span><span>{money(d.amounts.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-hair pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-pale">Settlement</div>
              <div className="space-y-1.5 text-[13px]">
                <Line label="Seller receivable (items + shipping)" value={money(d.amounts.sellerReceivable)} />
                <Line label="Loopy keeps (platform fee)" value={money(d.amounts.platformFee)} />
                <Line label="GST on fee (est. 18%)" value={money(d.amounts.gstOnFee)} muted />
              </div>
            </div>

            {/* A stored total that disagrees with its parts is a ledger fault. */}
            {d.amounts.reconciles ? (
              <p className="mt-3 text-[12px] font-semibold text-accent">✓ Reconciled — total equals items + shipping + fee.</p>
            ) : (
              <p className="mt-3 rounded-lg bg-alert-soft px-3 py-2 text-[12px] font-bold text-alert">
                ⚠ Ledger mismatch of {money(d.amounts.difference)} — stored total does not equal its components. Do not settle this order until it is corrected.
              </p>
            )}
          </Card>

          {d.dispute && (
            <Card className="p-5">
              <SectionTitle action={statusChip(d.dispute.status)}>Dispute</SectionTitle>
              <div className="text-[13px] text-slate"><b>{d.dispute.issueType}</b> — {d.dispute.description || 'No description'}</div>
            </Card>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* actions */}
          <Card className="p-5">
            <SectionTitle>Actions</SectionTitle>

            {d.status === 'PendingPayment' && (
              <div className="mb-3 rounded-lg border border-warn/30 bg-warn-soft/50 p-3">
                <div className="text-[12.5px] font-bold text-slate">Waiting for the buyer's payment</div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-dim">
                  The seller cannot see this order until it is paid. If the buyer says they have paid, check with the gateway.
                </p>
                <button
                  onClick={checkPayment}
                  disabled={busy === 'verify'}
                  className="mt-2 rounded-lg bg-slate px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-slate/90 disabled:opacity-60"
                >
                  {busy === 'verify' ? 'Checking…' : 'Check payment'}
                </button>
                {payMsg && <p className="mt-1.5 text-[11.5px] font-semibold text-dim">{payMsg}</p>}
              </div>
            )}

            {/* Only what the server will actually accept from this status. */}
            <div className="grid grid-cols-2 gap-2">
              {(d.allowedActions || []).map((a: any) => (
                <Action
                  key={a.key}
                  label={a.money && a.key === 'deliver' ? `Verify delivery · release ${money(d.amounts.sellerReceivable)}` : a.label}
                  tone={a.key === 'refund' || a.key === 'cancel' ? 'rose' : undefined}
                  busy={busy === a.key}
                  onClick={() => act(a.key, a.label, a.money)}
                />
              ))}
              <Action label="Contact Seller" onClick={() => d.seller.email && (window.location.href = `mailto:${d.seller.email}`)} />
              <Action label="Contact Customer" onClick={() => d.customer.phone && (window.location.href = `tel:${d.customer.phone}`)} />
            </div>
            {!(d.allowedActions || []).length && (
              <p className="mt-2 text-[12px] text-dim">
                No further action is possible — this order is {d.status.toLowerCase()}.
              </p>
            )}
            <p className="mt-3 border-t border-hair pt-2 text-[11px] text-pale">
              Version {d.version} · actions are checked against this version, so a stale screen cannot overwrite someone else&apos;s decision.
            </p>
          </Card>

          {/* refund lifecycle — separate from status, because owing a refund and
              having paid it are different facts */}
          {d.refundState && (
            <Card className="p-5">
              <SectionTitle>Refund</SectionTitle>
              <div className="mb-3 flex items-center gap-2">
                <span className={d.refundState === 'Refunded' ? 'chip-accent' : d.refundState === 'Failed' ? 'chip-alert' : 'chip-warn'}>
                  {d.refundState}
                </span>
                <span className="text-[12.5px] text-dim">{money(d.amounts.total)} owed to the customer</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {REFUND_NEXT[d.refundState]?.map((to: string) => (
                  <Action
                    key={to}
                    label={to === 'Refunded' ? 'Confirm money returned' : to === 'Failed' ? 'Mark failed' : `Mark ${to}`}
                    tone={to === 'Failed' ? 'rose' : undefined}
                    busy={busy === `refund:${to}`}
                    onClick={() => moveRefund(to)}
                  />
                ))}
              </div>
              {!REFUND_NEXT[d.refundState]?.length && (
                <p className="text-[12px] text-dim">This refund is settled. Nothing further to do.</p>
              )}
            </Card>
          )}

          {/* audit trail — the evidence for every money decision on this order */}
          <Card className="p-5">
            <SectionTitle>Audit Trail</SectionTitle>
            {audit.length ? (
              <ol className="space-y-2.5">
                {audit.map((a) => (
                  <li key={a.id} className="border-l-2 border-hair pl-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="text-[13px] font-bold text-slate">{a.action}</span>
                      <span className="text-[11px] text-dim">{new Date(a.at).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[12px] text-dim">
                      {a.before?.status && a.after?.status && a.before.status !== a.after.status
                        ? `${a.before.status} → ${a.after.status}`
                        : a.before?.refundState || a.after?.refundState
                          ? `${a.before?.refundState || 'not owed'} → ${a.after?.refundState}`
                          : ''}
                      {a.amount ? ` · ${money(a.amount)}` : ''}
                    </div>
                    <div className="text-[11px] text-pale">by {a.actor}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12.5px] text-dim">No admin action has been taken on this order.</p>
            )}
          </Card>

          {/* customer */}
          <Card className="p-5">
            <SectionTitle>Customer</SectionTitle>
            <div className="space-y-2 text-[13px]">
              <Field label="Name" value={d.customer.name} />
              <Field label="Phone" value={d.customer.phone || '—'} />
              <Field label="Address" value={d.customer.address || '—'} />
              <Field label="Total Orders" value={d.customer.orders} />
              <Field label="Lifetime Value" value={money(d.customer.ltv)} accent />
            </div>
          </Card>

          {/* seller */}
          <Card className="p-5">
            <SectionTitle action={<Link href={`/admin/sellers/${d.seller.id}`} className="text-[12px] font-semibold text-accent">Open →</Link>}>Seller</SectionTitle>
            <div className="space-y-2 text-[13px]">
              <Field label="Store" value={d.seller.storeName} />
              <Field label="Email" value={d.seller.email || '—'} />
              <Field label="City" value={d.seller.city || '—'} />
              <Field label="Rating" value={`${(d.seller.rating || 0).toFixed(1)} ★`} />
              <div className="flex items-center justify-between"><span className="text-pale">KYC</span>{statusChip(d.seller.kyc)}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, bold, accent }: { label: string; value: any; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-pale">{label}</span>
      <span className={`truncate text-right ${bold ? 'font-extrabold text-slate' : accent ? 'font-bold text-accent' : 'font-semibold text-slate'}`}>{value}</span>
    </div>
  );
}

function Action({ label, onClick, tone, busy }: { label: string; onClick: () => void; tone?: 'rose'; busy?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy} className={`rounded-xl px-3 py-2.5 text-[12.5px] font-bold disabled:opacity-50 ${tone === 'rose' ? 'bg-alert-soft text-alert hover:bg-alert/10' : 'bg-cool text-slate hover:bg-hair/60'}`}>
      {busy ? '…' : label}
    </button>
  );
}

/** One label/value row in the money breakdown. */
function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? 'text-pale' : 'text-dim'}>{label}</span>
      <span className={muted ? 'font-semibold text-pale' : 'font-semibold text-slate'}>{value}</span>
    </div>
  );
}
