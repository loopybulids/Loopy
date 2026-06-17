'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { Search, Verified } from '@/components/icons';

export default function AdminConsole() {
  const [tab, setTab] = useState<'kyc' | 'disputes'>('kyc');
  const [stats, setStats] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const router = useRouter();

  const load = () => Promise.all([api.adminStats(), api.adminSellers(), api.adminDisputes()]).then(([s, se, d]) => { setStats(s); setSellers(se); setDisputes(d); }).catch(() => router.push('/admin/login'));
  useEffect(() => { if (!localStorage.getItem('loopy_token')) { router.push('/admin/login'); return; } load(); }, []);

  const kyc = async (id: string, ok: boolean) => { ok ? await api.approveSeller(id) : await api.rejectSeller(id); load(); };
  const resolve = async (id: string, r: 'refunded' | 'released') => { await api.resolveDispute(id, r); load(); };
  const pending = sellers.filter((s) => s.kycStatus === 'pending');

  return (
    <main className="min-h-screen bg-paper">
      <nav className="flex h-16 items-center gap-4 bg-navy px-5 sm:px-8">
        <span className="font-display text-[22px] font-extrabold text-white">Loopy</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-mint">Admin Panel</span>
        <div className="ml-4 hidden items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-2 text-[13px] text-white/50 md:flex"><Search size={15} /> Search sellers by name or ID…</div>
        <button onClick={() => { localStorage.removeItem('loopy_token'); router.push('/admin/login'); }} className="ml-auto text-sm font-semibold text-white/70">Sign out</button>
      </nav>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-extrabold text-navy">Pending KYC Verifications</h1>
            <p className="mt-1 text-muted">Review and approve seller identities to maintain platform integrity.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-card"><div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">Pending</div><div className="font-display text-[24px] font-extrabold text-navy">{stats?.pendingKyc ?? '–'}</div></div>
            <div className="rounded-2xl bg-green-mint px-5 py-3 text-center"><div className="text-[10.5px] font-bold uppercase tracking-wide text-green">Approved Today</div><div className="font-display text-[24px] font-extrabold text-green">142</div></div>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-xl bg-white p-1 shadow-card">
          <button onClick={() => setTab('kyc')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'kyc' ? 'bg-navy text-white' : 'text-muted'}`}>KYC queue</button>
          <button onClick={() => setTab('disputes')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'disputes' ? 'bg-navy text-white' : 'text-muted'}`}>Disputes {stats?.openDisputes ? `(${stats.openDisputes})` : ''}</button>
        </div>

        {tab === 'kyc' ? (
          <div className="card mt-4 overflow-hidden">
            <div className="grid grid-cols-[1.8fr_1.4fr_1fr_auto] gap-3 border-b border-line bg-paper px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-faint"><div>Storefront & Seller</div><div>Verification</div><div>Status</div><div>Actions</div></div>
            {sellers.map((s) => (
              <div key={s.id} className="grid grid-cols-[1.8fr_1.4fr_1fr_auto] items-center gap-3 border-b border-line px-5 py-4 last:border-0">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-[12px] font-extrabold text-white">{s.storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</span><div><div className="text-[14px] font-bold text-navy">{s.storeName}</div><div className="text-[11px] text-muted">{s.username} · {s.city || '—'}</div></div></div>
                <div className="space-y-0.5 text-[12px] font-semibold text-green-600"><div className="flex items-center gap-1"><Verified size={13} /> Aadhaar Linked</div><div className={`flex items-center gap-1 ${s.kycStatus === 'pending' ? 'text-amber' : ''}`}><Verified size={13} /> PAN {s.kycStatus === 'pending' ? 'Pending' : 'Verified'}</div></div>
                <div>{s.kycStatus === 'approved' ? <span className="chip-green">Approved</span> : s.kycStatus === 'rejected' ? <span className="chip-rose">Rejected</span> : <span className="chip-amber">Pending</span>}</div>
                <div className="text-right">{s.kycStatus === 'pending' ? <div className="flex gap-2"><button onClick={() => kyc(s.id, false)} className="btn-ghost !px-3 !py-2 text-[12px] !text-rose">Reject</button><button onClick={() => kyc(s.id, true)} className="btn-navy !px-4 !py-2 text-[12px]">Review</button></div> : <span className="text-[11px] text-faint">—</span>}</div>
              </div>
            ))}
            <div className="px-5 py-3 text-[12px] text-muted">Showing {sellers.length} sellers · {pending.length} pending</div>
          </div>
        ) : (
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
