'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import SellerNav from '@/components/SellerNav';

export default function SellerWallet() {
  const [w, setW] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const load = () => api.myWallet().then(setW).catch(() => router.push('/seller/login'));
  useEffect(() => {
    if (!localStorage.getItem('loopy_token')) { router.push('/seller/login'); return; }
    load();
  }, []);

  const payout = async () => {
    const r = await api.requestPayout();
    setMsg(r.ok ? `Payout of ${rupees(r.payout.amount)} requested ✓` : r.message);
    load();
  };

  if (!w) return <main className="min-h-screen bg-paper"><SellerNav /><div className="p-10 text-center text-muted">Loading…</div></main>;

  return (
    <main className="min-h-screen bg-paper">
      <SellerNav />
      <div className="mx-auto max-w-xl px-5 py-6">
        <h1 className="font-serif text-[24px] font-semibold">Wallet</h1>

        <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5246C9] via-indigo-2 to-[#8a6cf0] p-5 text-white">
          <div className="text-[11px] opacity-85">Available to withdraw</div>
          <div className="font-serif text-[34px] font-semibold">{rupees(w.available)}</div>
          <button onClick={payout} className="btn mt-4 bg-white/16 text-white backdrop-blur">Request payout</button>
          {msg && <div className="mt-2 text-xs">{msg}</div>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="card p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-muted">Held in escrow</div><div className="font-serif text-[22px] font-semibold">{rupees(w.held)}</div><div className="text-[11px] text-muted">released after delivery</div></div>
          <div className="card p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-muted">Paid out</div><div className="font-serif text-[22px] font-semibold">{rupees(w.paidOut)}</div></div>
        </div>

        <h2 className="mt-6 font-bold">Payout history</h2>
        {w.payouts.length === 0 ? (
          <div className="card mt-2 p-6 text-center text-sm text-muted">No payouts yet.</div>
        ) : (
          <div className="card mt-2 divide-y divide-line">
            {w.payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div><div className="text-sm font-bold">{rupees(p.amount)}</div><div className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString()}</div></div>
                <span className={`chip ${p.status === 'paid' ? 'bg-trust-soft text-[#157a4b]' : 'bg-amber-soft text-[#9a6406]'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
