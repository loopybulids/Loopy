'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { PageHead, StatCard, Panel, Empty, money } from '@/components/seller-ui';
import { Wallet, Check } from '@/components/icons';

export default function Payments() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  // Success, a refusal the seller needs to read, or a genuine error.
  const [msgTone, setMsgTone] = useState<'ok' | 'note' | 'bad'>('ok');
  const [pd, setPd] = useState({ payoutEmail: '', payoutMethod: 'upi', payoutName: '', payoutUpi: '', payoutAccount: '', payoutPhone: '' });
  const [savingPd, setSavingPd] = useState(false);
  const [savedPd, setSavedPd] = useState(false);
  const setP = (k: keyof typeof pd, v: string) => setPd((s) => ({ ...s, [k]: v }));

  // Painted from the last visit on the first frame, then refreshed.
  const { data, reload: load } = useApiData('seller:payments', () =>
    Promise.all([
      api.myWallet().catch(() => null),
      api.myOrders().catch(() => []),
      api.myProfile().catch(() => null),
    ]).then(([w, o, p]) => ({ wallet: w, orders: o || [], profile: p })),
  );

  const wallet = data?.wallet ?? null;
  const orders: any[] = data?.orders ?? [];

  // The payout form is editable, so it is seeded from the fetch rather than
  // driven by it — otherwise a background refresh would wipe what's typed.
  const seeded = useRef(false);
  useEffect(() => {
    const p = (data as any)?.profile;
    if (!p || seeded.current) return;
    seeded.current = true;
    setPd({ payoutEmail: p.payoutEmail || '', payoutMethod: p.payoutMethod || 'upi', payoutName: p.payoutName || '', payoutUpi: p.payoutUpi || '', payoutAccount: p.payoutAccount || '', payoutPhone: p.payoutPhone || '' });
  }, [data]);

  const savePd = async () => {
    setSavingPd(true); setSavedPd(false);
    try { await api.updateProfile(pd); setSavedPd(true); setTimeout(() => setSavedPd(false), 2000); }
    catch { /* ignore */ } finally { setSavingPd(false); }
  };

  /*
   * The endpoint answers 200 whether or not it raised a request — "nothing
   * available" and "it is all already in flight" are states, not failures.
   * This used to announce "Payout requested" on every 200 without reading the
   * body, so a click that created nothing still reported success and the
   * seller was left watching a balance that never moved.
   *
   * The message is set after the reload, so the button and the text change in
   * the same frame. Setting it first meant the card read "Payout requested"
   * while the button still said "Requesting…", which looked like a hang.
   */
  const payout = async () => {
    setBusy(true); setMsg(''); setMsgTone('ok');
    try {
      const r = await api.requestPayout();
      await load();
      if (r?.ok) {
        setMsg(`Payout of ${money(r.amount ?? 0)} requested — Loopy will review it and it settles to your bank once approved.`);
        setMsgTone('ok');
      } else {
        setMsg(r?.message || 'Could not request payout.');
        setMsgTone('note');
      }
    } catch (e: any) {
      setMsg(e?.message || 'Could not request payout.');
      setMsgTone('bad');
    } finally { setBusy(false); }
  };

  const txns = orders.filter((o) => ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'].includes(o.status));

  return (
    <div>
      <PageHead title="Payments & payouts" sub="Track balances and move money to your bank." />

      {/* The four states money passes through, in the order it passes through
          them, so the page explains itself. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending (escrow)" value={money(wallet?.pending ?? 0)} delta="Ordered, not yet delivered" />
        <StatCard label="Available" value={money(wallet?.available ?? 0)} icon={<Wallet size={18} />} accent delta="Delivered — ready to withdraw" />
        <StatCard label="Awaiting approval" value={money(wallet?.requested ?? 0)} delta="Requested from Loopy" />
        <StatCard label="Settled" value={money(wallet?.settled ?? 0)} delta="Paid to your bank" />
      </div>

      <p className="mt-3 text-[12px] text-faint">
        Lifetime earnings {money(wallet?.lifetime ?? 0)} · money moves left to right as orders are delivered and payouts approved.
      </p>

      {wallet?.requested > 0 && (
        <div className="mt-3 rounded-xl border border-amber/40 bg-amber-soft/40 px-4 py-3">
          <div className="text-[13px] font-bold text-navy">
            {money(wallet.requested)} withdrawal awaiting approval
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Loopy is reviewing it. Once approved it moves to Settled — usually within 1–2 working days.
          </p>
        </div>
      )}

      {/* payout section — kept as a focused column */}
      <div className="mt-6 max-w-xl">
        <Panel title="Payout details">
          <div className="space-y-5">
            <PField label="Email for payment queries" hint="Business or personal email — we'll use this for invoices, payouts and payment-related questions.">
              <input type="email" value={pd.payoutEmail} onChange={(e) => setP('payoutEmail', e.target.value)} placeholder="payments@yourbusiness.com" className="c-input mt-1.5" />
            </PField>

            <div>
              <label className="block text-[14px] font-bold text-navy">Payout Method</label>
              <div className="mt-2 inline-flex rounded-xl bg-paper p-1 text-[13px] font-bold ring-1 ring-line">
                {([['upi', 'UPI ID'], ['bank', 'Bank Account']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setP('payoutMethod', k)} className={`rounded-lg px-4 py-2 transition-colors ${pd.payoutMethod === k ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'}`}>{label}</button>
                ))}
              </div>
            </div>

            {pd.payoutMethod === 'upi' ? (
              <PField label="UPI ID" hint="Payouts from your store will be sent to this UPI ID.">
                <input value={pd.payoutUpi} onChange={(e) => setP('payoutUpi', e.target.value)} placeholder="yourname@okhdfcbank" className="c-input mt-1.5" />
              </PField>
            ) : (
              <PField label="Bank account & IFSC" hint="Account number and IFSC of the account to receive payouts.">
                <input value={pd.payoutAccount} onChange={(e) => setP('payoutAccount', e.target.value)} placeholder="Account number · IFSC" className="c-input mt-1.5" />
              </PField>
            )}

            <PField label="Account holder name" hint="Must match the name registered with your bank / UPI ID.">
              <input value={pd.payoutName} onChange={(e) => setP('payoutName', e.target.value)} placeholder="Full name as on bank account" className="c-input mt-1.5" />
            </PField>

            <PField label="Mobile number" hint="Used to verify payouts and create your payout beneficiary.">
              <input value={pd.payoutPhone} onChange={(e) => setP('payoutPhone', e.target.value)} placeholder="9995559990" className="c-input mt-1.5" />
            </PField>

            <button onClick={savePd} disabled={savingPd} className="btn-green disabled:opacity-60">{savingPd ? 'Saving…' : savedPd ? <><Check size={16} /> Saved</> : 'Save payout details'}</button>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Panel title="Withdraw">
          <p className="text-[13px] leading-relaxed text-muted">Move your available balance to your linked bank account. Funds held in escrow release automatically on delivery.</p>
          {/* Naming the amount is the difference between a button you trust and
              one you press to find out what it does. */}
          <button onClick={payout} disabled={busy || !(wallet?.available > 0)} className="btn-green mt-5 w-full justify-center disabled:opacity-50">
            {busy ? 'Requesting…' : wallet?.available > 0 ? `Request ${money(wallet.available)} payout` : 'Request payout'}
          </button>

          {/* Why the button is dead, rather than leaving it to be guessed. */}
          {!(wallet?.available > 0) && (
            <p className="mt-2 text-[12px] text-faint">
              {wallet?.requested > 0
                ? 'Your available balance is already awaiting approval.'
                : wallet?.pending > 0
                  ? 'Nothing to withdraw yet — funds release when your orders are delivered.'
                  : 'Nothing to withdraw yet.'}
            </p>
          )}

          {msg && (
            <p className={`mt-3 text-[12.5px] font-semibold ${
              msgTone === 'ok' ? 'text-green-600' : msgTone === 'bad' ? 'text-rose' : 'text-navy/70'
            }`}>{msg}</p>
          )}
        </Panel>

        <Panel title="Transactions">
          {txns.length === 0 ? (
            <Empty icon={<Wallet size={24} />} title="No transactions yet" hint="Payments from your orders will show up here as they’re collected and settled." />
          ) : (
            <div className="divide-y divide-line">
              {txns.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-3 text-[14px]">
                  <div>
                    <div className="font-display font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                    <div className="text-[12px] text-faint">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{money(o.total || o.amount || 0)}</div>
                    <div className="text-[12px] text-faint">{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function PField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[14px] font-bold text-navy">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
