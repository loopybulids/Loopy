'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, StatCard, Panel, Empty, money } from '@/components/seller-ui';
import { Wallet } from '@/components/icons';

export default function Payments() {
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([
    api.myWallet().catch(() => null),
    api.myOrders().catch(() => []),
  ]).then(([w, o]) => { setWallet(w); setOrders(o || []); });

  useEffect(() => { load(); }, []);

  const payout = async () => {
    setBusy(true); setMsg('');
    try { await api.requestPayout(); setMsg('Payout requested — it’ll settle to your bank shortly.'); await load(); }
    catch (e: any) { setMsg(e?.message || 'Could not request payout.'); }
    finally { setBusy(false); }
  };

  const txns = orders.filter((o) => ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'].includes(o.status));

  return (
    <div>
      <PageHead title="Payments & payouts" sub="Track balances and move money to your bank." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={money(wallet?.available ?? 0)} icon={<Wallet size={18} />} accent />
        <StatCard label="Pending (escrow)" value={money(wallet?.pending ?? 0)} />
        <StatCard label="Settled" value={money(wallet?.settled ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Panel title="Withdraw">
          <p className="text-[13px] leading-relaxed text-muted">Move your available balance to your linked bank account. Funds held in escrow release automatically on delivery.</p>
          <button onClick={payout} disabled={busy || !(wallet?.available > 0)} className="btn-green mt-5 w-full justify-center disabled:opacity-50">
            {busy ? 'Requesting…' : 'Request payout'}
          </button>
          {msg && <p className="mt-3 text-[12.5px] font-semibold text-green-600">{msg}</p>}
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
