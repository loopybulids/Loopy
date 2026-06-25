'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { Search, Verified } from '@/components/icons';

export default function AdminConsole() {
  const [tab, setTab] = useState<'sellers' | 'kyc' | 'disputes'>('sellers');
  const [overview, setOverview] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const router = useRouter();

  const load = () =>
    Promise.all([api.adminOverview(), api.adminStats(), api.adminSellers(), api.adminDisputes()])
      .then(([ov, s, se, d]) => { setOverview(ov); setStats(s); setSellers(se); setDisputes(d); setLoadErr(''); })
      .catch((e: any) => {
        // Only kick back to login on an auth failure — not on a transient error.
        if (String(e?.message || '').match(/401|403|Unauthorized|Admins only/i)) {
          localStorage.removeItem('loopy_token'); localStorage.removeItem('loopy_role');
          router.replace('/admin/login');
        } else {
          setLoadErr(e?.message || 'Could not load data.');
        }
      });

  useEffect(() => {
    const token = localStorage.getItem('loopy_token');
    const role = localStorage.getItem('loopy_role');
    if (!token || role !== 'admin') { router.replace('/admin/login'); return; }
    setReady(true);
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <main className="grid min-h-screen place-items-center bg-paper text-muted"><span className="animate-pulse font-display text-sm font-bold">Loading admin…</span></main>;

  const kyc = async (id: string, ok: boolean) => { ok ? await api.approveSeller(id) : await api.rejectSeller(id); load(); };
  const resolve = async (id: string, r: 'refunded' | 'released') => { await api.resolveDispute(id, r); load(); };
  const pending = sellers.filter((s) => s.kycStatus === 'pending');

  const shown = q
    ? sellers.filter((s) => `${s.storeName} ${s.username} ${s.email || ''}`.toLowerCase().includes(q.toLowerCase()))
    : sellers;

  return (
    <main className="min-h-screen bg-paper">
      <nav className="flex h-16 items-center gap-4 bg-navy px-5 sm:px-8">
        <span className="font-display text-[22px] font-extrabold text-white">Loopy</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-mint">Admin Panel</span>
        <button onClick={() => { localStorage.removeItem('loopy_token'); localStorage.removeItem('loopy_role'); router.push('/admin/login'); }} className="ml-auto text-sm font-semibold text-white/70 hover:text-white">Sign out</button>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[28px] font-extrabold text-navy sm:text-[34px]">Platform Overview</h1>
        <p className="mt-1 text-muted">Every seller and their performance, in one place.</p>
        {loadErr && <div className="mt-3 rounded-lg border border-rose/30 bg-rose-soft/50 px-4 py-2 text-[13px] font-semibold text-rose">{loadErr} <button onClick={load} className="ml-2 underline">Retry</button></div>}

        {/* platform overview cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Sellers" value={overview?.sellers ?? '–'} />
          <Stat label="Products" value={overview?.products ?? '–'} />
          <Stat label="Orders" value={overview?.orders ?? '–'} />
          <Stat label="Customers" value={overview?.customers ?? '–'} />
          <Stat label="Revenue" value={overview ? rupees(overview.revenue) : '–'} accent />
          <Stat label="Commission" value={overview ? rupees(overview.commission) : '–'} accent />
        </div>

        {/* tabs */}
        <div className="mt-7 inline-flex rounded-xl bg-white p-1 shadow-card">
          {(['sellers', 'kyc', 'disputes'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-navy text-white' : 'text-muted'}`}>
              {t === 'kyc' ? 'KYC queue' : t}
              {t === 'kyc' && stats?.pendingKyc ? ` (${stats.pendingKyc})` : ''}
              {t === 'disputes' && stats?.openDisputes ? ` (${stats.openDisputes})` : ''}
            </button>
          ))}
        </div>

        {/* SELLERS ANALYTICS */}
        {tab === 'sellers' && (
          <div className="card mt-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Search size={16} className="text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sellers by name, username or email…" className="w-full bg-transparent text-[14px] outline-none placeholder:text-faint" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-4 py-3 font-bold">Seller</th>
                    <th className="py-3 font-bold">Products</th>
                    <th className="py-3 font-bold">Orders</th>
                    <th className="py-3 font-bold">Delivered</th>
                    <th className="py-3 font-bold">Customers</th>
                    <th className="py-3 font-bold">Revenue</th>
                    <th className="py-3 font-bold">Commission</th>
                    <th className="py-3 font-bold">KYC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((s) => (
                    <tr key={s.id} className="hover:bg-paper/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy text-[11px] font-extrabold text-white">{(s.storeName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-navy">{s.storeName}</div>
                            <div className="truncate text-[11px] text-muted">{s.email || s.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-navy">{s.stats.products}</td>
                      <td className="py-3 text-navy">{s.stats.orders} <span className="text-faint">({s.stats.paidOrders} paid)</span></td>
                      <td className="py-3 text-navy">{s.stats.delivered}</td>
                      <td className="py-3 text-navy">{s.stats.customers}</td>
                      <td className="py-3 font-semibold text-navy">{rupees(s.stats.revenue)}</td>
                      <td className="py-3 text-green-600">{rupees(s.stats.commission)}</td>
                      <td className="py-3">{s.kycStatus === 'approved' ? <span className="chip-green">Approved</span> : s.kycStatus === 'rejected' ? <span className="chip-rose">Rejected</span> : <span className="chip-amber">Pending</span>}</td>
                    </tr>
                  ))}
                  {shown.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">No sellers found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-[12px] text-muted">{shown.length} of {sellers.length} sellers</div>
          </div>
        )}

        {/* KYC QUEUE */}
        {tab === 'kyc' && (
          <div className="card mt-4 overflow-hidden">
            <div className="grid grid-cols-[1.8fr_1fr_auto] gap-3 border-b border-line bg-paper px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-faint"><div>Storefront & Seller</div><div>Status</div><div>Actions</div></div>
            {sellers.map((s) => (
              <div key={s.id} className="grid grid-cols-[1.8fr_1fr_auto] items-center gap-3 border-b border-line px-5 py-4 last:border-0">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-[12px] font-extrabold text-white">{(s.storeName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span><div><div className="text-[14px] font-bold text-navy">{s.storeName}</div><div className="text-[11px] text-muted">{s.email || s.username} · {s.city || '—'}</div></div></div>
                <div>{s.kycStatus === 'approved' ? <span className="chip-green">Approved</span> : s.kycStatus === 'rejected' ? <span className="chip-rose">Rejected</span> : <span className="chip-amber">Pending</span>}</div>
                <div className="text-right">{s.kycStatus !== 'approved' ? <button onClick={() => kyc(s.id, true)} className="btn-navy !px-4 !py-2 text-[12px]">Approve</button> : <button onClick={() => kyc(s.id, false)} className="btn-ghost !px-3 !py-2 text-[12px] !text-rose">Suspend</button>}</div>
              </div>
            ))}
            <div className="px-5 py-3 text-[12px] text-muted">{sellers.length} sellers · {pending.length} pending</div>
          </div>
        )}

        {/* DISPUTES */}
        {tab === 'disputes' && (
          <div className="mt-4 space-y-3">
            {disputes.length === 0 && <div className="card p-8 text-center text-muted">No disputes.</div>}
            {disputes.map((d) => (
              <div key={d.id} className="card p-5">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-navy">Order #{d.orderId.slice(-6).toUpperCase()}</span><span className={d.status === 'open' ? 'chip-rose' : 'chip-green'}>{d.status}</span></div>
                <div className="mt-1 text-xs text-muted">{d.buyerName || 'Buyer'} · {d.issueType}</div>
                <p className="mt-1.5 text-[13px] text-navy">{d.description}</p>
                {d.status === 'open' && <div className="mt-3 flex gap-2"><button onClick={() => resolve(d.id, 'released')} className="btn-ghost flex-1 !py-2 text-[12px]">Release to seller</button><button onClick={() => resolve(d.id, 'refunded')} className="btn-green flex-1 !py-2 text-[12px]">Refund buyer</button></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? 'ring-1 ring-green/20' : ''}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">{label}</div>
      <div className={`mt-1 font-display text-[22px] font-extrabold ${accent ? 'text-green-600' : 'text-navy'}`}>{value}</div>
    </div>
  );
}
