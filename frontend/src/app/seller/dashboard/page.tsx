'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';
import { useRequireRole } from '@/lib/useRequireRole';
import { Clock, Plus, ShieldLock, Verified } from '@/components/icons';

const CHIP: Record<string, string> = {
  Paid: 'bg-amber/15 text-amber',
  Accepted: 'bg-white/10 text-[#C7D2E0]',
  Shipped: 'bg-green-500/15 text-green-500',
  Delivered: 'bg-green-500/15 text-green-500',
  Completed: 'bg-green-500/15 text-green-500',
};

export default function SellerDashboard() {
  const { ready, role } = useRequireRole('seller');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('18:42:02');
  const router = useRouter();

  const load = () => api.myOrders().then((o) => { setOrders(o); setLoading(false); }).catch((e) => { if (String(e.message).includes('401')) router.push('/seller/login'); else setLoading(false); });
  useEffect(() => { if (ready && role === 'seller') load(); }, [ready, role]);

  // live ticking drop countdown
  useEffect(() => {
    let s = 18 * 3600 + 42 * 60 + 2;
    const t = setInterval(() => { s = s <= 0 ? 18 * 3600 : s - 1; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`); }, 1000);
    return () => clearInterval(t);
  }, []);

  const act = async (id: string, kind: 'accept' | 'ship') => {
    try {
      if (kind === 'accept') await api.acceptOrder(id);
      else {
        // Courier is required by the API — ask before shipping.
        const courier = window.prompt('Shipping agency / courier name');
        if (!courier?.trim()) return;
        await api.shipOrder(id, courier.trim());
      }
      load();
    } catch (e: any) { alert(e.message); }
  };
  const paid = orders.filter((o) => o.status !== 'PendingPayment');
  const toAccept = orders.filter((o) => o.status === 'Paid').length;
  const completed = orders.filter((o) => ['Delivered', 'Completed'].includes(o.status)).length;
  const soldRate = paid.length ? Math.round((completed / paid.length) * 100) || 94 : 94;

  if (!ready || role !== 'seller') return <main className="seller-bg min-h-screen" />;

  return (
    <main className="seller-bg min-h-screen pb-12">
      <SellerNav />
      <div className="relative">
        <div className="seller-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 animate-riseIn">
            <div>
              <h1 className="font-display text-[28px] font-extrabold tracking-tight text-white">Seller Dashboard</h1>
              <p className="text-[14px] s-muted">Operations console — inventory, drops, and integrity score.</p>
            </div>
            <Link href="/seller/list" className="s-btn"><Plus size={16} /> Batch List Items</Link>
          </div>

          {/* stats */}
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat k="Sold Out Rate" v={`${soldRate}%`} sub="↑ +2.4%" subClass="text-green-500" />
            <Stat k="Trust Score" v="9.8" sub="ELITE STATUS" subClass="text-green-500" />
            <Stat k="Avg. Sell Time" v="14h" sub="Top 5% category" subClass="text-[#8A98AD]" />
            <Stat k="Active Orders" v={String(paid.length)} sub="Automated by Loopy" subClass="text-[#8A98AD]" />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
            {/* order queue */}
            <div className="s-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold text-white">Order Queue</h2>
                {toAccept > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold text-amber">{toAccept} PENDING</span>}
              </div>
              <div className="mt-4">
                {loading ? <div className="py-10 text-center text-[13px] s-muted">Loading…</div>
                  : orders.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-[13px] s-muted">No orders yet. Place one as a buyer — <Link href="/s/riyathrifts" className="font-semibold text-green-500">open the store</Link>.</div>
                  : <div>
                      <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-3 px-1 pb-2 text-[10.5px] font-bold uppercase tracking-wide text-[#8A98AD]"><div>Item</div><div>Buyer</div><div>Status</div><div>Action</div></div>
                      {orders.map((o) => (
                        <div key={o.id} className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-3 border-t border-white/10 px-1 py-3">
                          <div><div className="text-[13px] font-bold text-white">{o.items[0]?.title}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</div><div className="text-[11px] text-[#8A98AD]">#{o.id.slice(-6).toUpperCase()} · {rupees(o.totalAmount)}</div></div>
                          <div className="text-[12.5px] text-[#C7D2E0]">{o.buyerName || 'Buyer'}</div>
                          <div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${CHIP[o.status] || 'bg-white/10 text-[#C7D2E0]'}`}>{o.status}</span></div>
                          <div className="text-right">
                            {o.status === 'Paid' && <button onClick={() => act(o.id, 'accept')} className="s-btn-ghost !px-3 !py-2 text-[12px]">Accept</button>}
                            {o.status === 'Accepted' && <button onClick={() => act(o.id, 'ship')} className="s-btn !px-3 !py-2 text-[12px]">Ship</button>}
                            {['Shipped', 'Delivered', 'Completed'].includes(o.status) && <span className="text-[11px] text-[#8A98AD]">{o.awbNumber || '—'}</span>}
                          </div>
                        </div>
                      ))}
                    </div>}
              </div>
            </div>

            {/* The Drop Zone */}
            <div className="s-card s-card-glow p-5">
              <div className="flex items-center justify-between"><h2 className="font-display text-[16px] font-bold text-white">The Drop Zone</h2><Clock size={18} className="text-green-500" /></div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#8A98AD]">Next drop in</div>
                <div className="mt-1 font-display text-[30px] font-extrabold tabular-nums tracking-tight text-green-500">{countdown}</div>
                <div className="text-[11px] text-[#8A98AD]">Sunday 7 PM</div>
              </div>
              <div className="mt-4 text-[10.5px] font-bold uppercase tracking-wide text-[#8A98AD]">Batch queue</div>
              <div className="mt-2 space-y-2">
                {[{ t: 'Vanguard Retro Z', p: 240 }, { t: 'Sahara Tote M1', p: 890 }].map((b) => (
                  <div key={b.t} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"><span className="h-8 w-8 rounded bg-white/10" /><div className="flex-1"><div className="text-[12px] font-semibold text-white">{b.t}</div><div className="text-[10.5px] text-[#8A98AD]">${b.p}.00</div></div><Verified size={15} className="text-green-500" /></div>
                ))}
              </div>
              <button className="s-btn mt-4 w-full text-[13px]">Finalize Drop Plan</button>
            </div>
          </div>

          {/* protection + inventory health */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="s-card flex flex-col items-center justify-center p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><ShieldLock size={22} /></span>
              <div className="mt-3 font-display text-[16px] font-bold text-white">Protection Active</div>
              <p className="mt-1 max-w-xs text-[12.5px] text-[#8A98AD]">Your last 100 transactions were fully protected by Loopy Escrow.</p>
              <button className="s-btn-ghost mt-4 !px-4 !py-2 text-[12px]">View Security Logs</button>
            </div>
            <div className="s-card p-6">
              <h2 className="font-display text-[16px] font-bold text-white">Inventory Health</h2>
              <Health label="Verified Authenticity Rate" value="100%" pct={100} note="Every item you listed has passed visual integrity checks." />
              <Health label="Response Time" value="12m" pct={92} note="You are faster than 98% of professional curators." />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ k, v, sub, subClass }: { k: string; v: string; sub: string; subClass: string }) {
  return <div className="s-card p-5"><div className="text-[12px] font-semibold text-[#8A98AD]">{k}</div><div className="mt-1 font-display text-[30px] font-extrabold tracking-tight text-white">{v}</div><div className={`mt-0.5 text-[11px] font-bold ${subClass}`}>{sub}</div></div>;
}
function Health({ label, value, pct, note }: { label: string; value: string; pct: number; note: string }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[13px]"><span className="text-[#8A98AD]">{label}</span><span className="font-bold text-white">{value}</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1.5 text-[11px] italic text-[#8A98AD]">{note}</p>
    </div>
  );
}
