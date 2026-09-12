'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';
import { useRequireRole } from '@/lib/useRequireRole';
import { Clock, ShieldLock, Wallet } from '@/components/icons';

export default function Earnings() {
  const { ready, role } = useRequireRole('seller');
  const [w, setW] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const load = () => Promise.all([api.myWallet(), api.myOrders()]).then(([wallet, o]) => { setW(wallet); setOrders(o); }).catch(() => router.push('/seller/login'));
  useEffect(() => { if (ready && role === 'seller') load(); }, [ready, role]);

  const payout = async () => { const r = await api.requestPayout(); setMsg(r.ok ? `Payout of ${rupees(r.payout.amount)} requested ✓` : r.message); load(); };

  if (!ready || role !== 'seller') return <main className="seller-bg min-h-screen" />;
  if (!w) return <main className="seller-bg min-h-screen"><SellerNav /><div className="p-12 text-center text-[13px] s-muted">Loading…</div></main>;
  const tx = orders.filter((o) => o.status !== 'PendingPayment').slice(0, 8);

  return (
    <main className="seller-bg min-h-screen pb-12">
      <SellerNav />
      <div className="relative">
        <div className="seller-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3 animate-riseIn">
            <div><h1 className="font-display text-[28px] font-bold tracking-tight text-white">Earnings</h1><p className="text-[14px] s-muted">Sales revenue and secure payouts.</p></div>
            <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/[0.06] px-4 py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full ring-2 ring-green-500/60 text-[11px] font-extrabold text-green-500">98</span>
              <div><div className="flex items-center gap-1 text-[12px] font-bold text-green-500"><ShieldLock size={12} /> ELITE TRUST</div><div className="text-[10.5px] text-[#8A98AD]">Instant payouts enabled</div></div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_360px]">
            {/* balance hero */}
            <div className="s-card s-card-glow relative overflow-hidden p-6">
              <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-500/15 blur-2xl" />
              <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8A98AD]">Current Balance</div>
                <div className="mt-1 font-display text-[32px] font-bold tabular-nums tracking-tight text-white sm:text-[40px]">{rupees(w.available + w.pending)}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[11px] text-[#8A98AD]">Ready for Payout</div><div className="font-display text-[18px] font-bold text-green-500">{rupees(w.available)}</div></div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[11px] text-[#8A98AD]">Pending Escrow</div><div className="font-display text-[18px] font-bold text-white">{rupees(w.pending)}</div></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={payout} className="s-btn text-[13px]"><Wallet size={15} /> Withdraw to UPI</button>
                  <button className="s-btn-ghost text-[13px]">Payout Methods</button>
                </div>
                {msg && <div className="mt-2 text-[12px] text-green-500">{msg}</div>}
              </div>
            </div>

            {/* escrow security */}
            <div className="space-y-4">
              <div className="s-card p-5">
                <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><ShieldLock size={16} /></span><h2 className="font-display text-[16px] font-bold text-white">Escrow Security</h2></div>
                <p className="mt-2 text-[12.5px] text-[#8A98AD]">Funds are held securely until the buyer confirms receipt. Typically released in 24–48 hours.</p>
                <div className="mt-3 flex items-center justify-between text-[12px]"><span className="text-[#8A98AD]">Active Escrows</span><span className="font-bold text-white">{orders.filter((o) => ['Paid', 'Accepted', 'Shipped'].includes(o.status)).length} Orders</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-green-500" /></div>
              </div>
              <div className="rounded-xl border border-amber/30 bg-amber/[0.08] p-4"><div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber"><Clock size={13} /> Next Payout Cycle</div><div className="font-display text-[18px] font-bold text-white">Tomorrow, 10:00 AM</div></div>
            </div>
          </div>

          {/* transactions */}
          <div className="s-card mt-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="font-display text-[18px] font-bold text-white">Transaction History</h2><div className="flex gap-2"><button className="s-btn-ghost !px-3 !py-2 text-[12px]">Export CSV</button><button className="s-btn-ghost !px-3 !py-2 text-[12px]">Filter</button></div></div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 bg-white/[0.02] px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-[#8A98AD]"><div>Details</div><div>Amount</div><div>Status</div><div>Action</div></div>
            {tx.length === 0 ? <div className="p-8 text-center text-[13px] s-muted">No transactions yet.</div> : tx.map((o) => (
              <div key={o.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 border-t border-white/10 px-5 py-4">
                <div><div className="text-[13px] font-bold text-white">Sale: {o.items[0]?.title}</div><div className="text-[11px] text-[#8A98AD]">ORDER #{o.id.slice(-6).toUpperCase()}</div></div>
                <div className="font-bold text-green-500">+{rupees(o.itemsAmount)}</div>
                <div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${['Delivered', 'Completed'].includes(o.status) ? 'bg-green-500/15 text-green-500' : 'bg-amber/15 text-amber'}`}>{o.status}</span></div>
                <div className="text-[12px] font-semibold text-[#C7D2E0]">View Receipt</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
