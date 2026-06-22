'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRequireRole } from '@/lib/useRequireRole';
import StoreNav from '@/components/StoreNav';
import { Back, Check } from '@/components/icons';

export default function ReviewPage() {
  const id = useParams().id as string;
  const { ready, role } = useRequireRole('buyer');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Exactly as described, came fast and packed so nicely.');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    try { await api.reviewOrder(id, rating, comment); router.push(`/orders/${id}`); }
    catch (e: any) { alert(e.message); setBusy(false); }
  };

  if (!ready || role !== 'buyer') return <main className="min-h-screen bg-paper" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[10%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav protect={false} />
      <div className="mx-auto max-w-md px-5 py-8">
        <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-navy"><Back size={16} /> Back</button>
        <h1 className="font-display text-[28px] font-extrabold text-navy">Rate your <span className="vivid-text">order</span></h1>
        <div className="glass-card mt-5 rounded-3xl p-6 text-center">
          <div className="text-[34px] tracking-[6px]">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} className={`transition-transform hover:scale-110 ${n <= rating ? 'text-amber' : 'text-line'}`}>★</button>)}</div>
          <div className="mt-1 text-xs text-muted">{rating} of 5</div>
        </div>
        <label className="glass-card mt-4 block rounded-3xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Your review</div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full resize-none bg-transparent text-sm outline-none" />
        </label>
        <div className="glass-card mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-[12px] font-semibold text-green"><Check size={15} /> Confirming this review releases the held payment to the seller.</div>
        <button disabled={busy} onClick={submit} className="btn-green mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Submit review'}</button>
      </div>
    </main>
  );
}
