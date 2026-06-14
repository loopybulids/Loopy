'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import { Back } from '@/components/icons';

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Exactly as described, came fast and packed so nicely 🤍');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    try {
      await api.reviewOrder(params.id, rating, comment);
      router.push(`/orders/${params.id}`);
    } catch (e: any) { alert(e.message); setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-cream">
      <StoreNav />
      <div className="mx-auto max-w-md px-5 py-6">
        <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted"><Back size={16} /> Back</button>
        <h1 className="font-serif text-[24px] font-semibold">Rate your order</h1>

        <div className="card mt-4 p-6 text-center">
          <div className="text-[34px] tracking-[6px]">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={n <= rating ? 'text-amber' : 'text-[#E4E0EC]'}>★</button>
            ))}
          </div>
          <div className="mt-1 text-xs text-muted">{rating} of 5</div>
        </div>

        <label className="card mt-4 block p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Your review</div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full resize-none bg-transparent text-sm outline-none" />
        </label>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#C9ECD8] bg-trust-soft px-3.5 py-3 text-[12px] text-[#176c44]">
          ✓ Confirming this review releases the held payment to the seller.
        </div>

        <button disabled={busy} onClick={submit} className="btn-pri mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Submit review'}</button>
      </div>
    </main>
  );
}
