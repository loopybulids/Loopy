'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { Loop } from '@/components/icons';

export default function AdminConsole() {
  const [tab, setTab] = useState<'kyc' | 'disputes'>('kyc');
  const [stats, setStats] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const router = useRouter();

  const load = () => {
    Promise.all([api.adminStats(), api.adminSellers(), api.adminDisputes()])
      .then(([s, se, d]) => { setStats(s); setSellers(se); setDisputes(d); })
      .catch(() => router.push('/admin/login'));
  };
  useEffect(() => {
    if (!localStorage.getItem('loopy_token')) { router.push('/admin/login'); return; }
    load();
  }, []);

  const kyc = async (id: string, ok: boolean) => { ok ? await api.approveSeller(id) : await api.rejectSeller(id); load(); };
  const resolve = async (id: string, r: 'refunded' | 'released') => { await api.resolveDispute(id, r); load(); };

  return (
    <main className="min-h-screen bg-paper">
      <nav className="flex h-16 items-center gap-3 border-b border-[#26222f] bg-[#16141d] px-5 text-white">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-2 to-indigo"><Loop size={18} /></span>
        <span className="font-serif text-lg font-semibold">Loopy <span className="chip bg-[#2a2738] text-[#b9b2e8]">Ops</span></span>
        <button onClick={() => { localStorage.removeItem('loopy_token'); router.push('/admin/login'); }} className="ml-auto text-sm font-semibold text-[#9C97B6]">Sign out</button>
      </nav>

      <div className="mx-auto max-w-4xl px-5 py-6">
        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat k="Pending KYC" v={stats?.pendingKyc ?? '–'} tone="text-amber" />
          <Stat k="Open disputes" v={stats?.openDisputes ?? '–'} tone="text-coral" />
          <Stat k="Payouts due" v={stats ? rupees(stats.payoutsDue) : '–'} />
          <Stat k="GMV" v={stats ? rupees(stats.gmv) : '–'} />
        </div>

        {/* tabs */}
        <div className="mt-6 inline-flex rounded-xl bg-[#EEECF3] p-1">
          <button onClick={() => setTab('kyc')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'kyc' ? 'bg-white text-ink shadow' : 'text-muted'}`}>KYC queue</button>
          <button onClick={() => setTab('disputes')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'disputes' ? 'bg-white text-ink shadow' : 'text-muted'}`}>Disputes</button>
        </div>

        {tab === 'kyc' ? (
          <div className="card mt-4 divide-y divide-line">
            {sellers.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#FF8FB0] to-[#F2557E] font-serif font-bold text-white">{s.storeName[0]}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold">{s.storeName}</div>
                  <div className="text-xs text-muted">{s.username} · {s.city || '—'}</div>
                </div>
                {s.kycStatus === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => kyc(s.id, false)} className="btn-gh !px-3 !py-2 !text-xs !text-coral">Reject</button>
                    <button onClick={() => kyc(s.id, true)} className="btn-grn !px-3 !py-2 !text-xs">Approve</button>
                  </div>
                ) : (
                  <span className={`chip ${s.kycStatus === 'approved' ? 'bg-trust-soft text-[#157a4b]' : 'bg-coral-soft text-[#c8463a]'}`}>{s.kycStatus}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {disputes.length === 0 && <div className="card p-6 text-center text-muted">No disputes.</div>}
            {disputes.map((d) => (
              <div key={d.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">#{d.orderId.slice(-6).toUpperCase()}</span>
                  <span className={`chip ${d.status === 'open' ? 'bg-coral-soft text-[#c8463a]' : 'bg-trust-soft text-[#157a4b]'}`}>{d.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted">{d.buyerName || 'Buyer'} · {d.issueType}</div>
                <p className="mt-1 text-[13px]">{d.description}</p>
                {d.status === 'open' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => resolve(d.id, 'released')} className="btn-gh !py-2 !text-xs flex-1">Release to seller</button>
                    <button onClick={() => resolve(d.id, 'refunded')} className="btn-grn !py-2 !text-xs flex-1">Refund buyer</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ k, v, tone = '' }: { k: string; v: any; tone?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{k}</div>
      <div className={`mt-1 font-serif text-[22px] font-semibold ${tone}`}>{v}</div>
    </div>
  );
}
