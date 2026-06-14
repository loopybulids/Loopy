'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SellerNav from '@/components/SellerNav';
import { Check } from '@/components/icons';

export default function SellerKyc() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  useEffect(() => { if (!localStorage.getItem('loopy_token')) router.push('/seller/login'); }, []);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <SellerNav />
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-indigo" /><span className="h-1.5 flex-1 rounded-full bg-indigo" /><span className="h-1.5 flex-1 rounded-full bg-line" />
        </div>
        <div className="mt-2 text-xs text-muted">Step 2 of 3 · KYC verification</div>
        <h1 className="mt-3 font-serif text-[22px] font-semibold">Verify your store</h1>

        <div className="card mt-4 space-y-3 p-5">
          <Row label="Store name" value="Riya’s Thrift Loop" />
          <Row label="Store handle" value="loopy.com/s/riyathrifts" />
          <Row label="PAN number" value="ABCDE1234F" />
          <Row label="Bank · IFSC" value="HDFC0001234" />
        </div>

        <div className="mt-4 text-sm font-bold">Documents</div>
        <div className="card mt-2 flex items-center gap-3 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-trust-soft text-trust">📄</span>
          <span className="flex-1 text-sm font-bold">PAN card.jpg</span>
          <span className="chip bg-trust-soft text-[#157a4b]">✓ Uploaded</span>
        </div>
        <div className="mt-2 rounded-2xl border border-dashed border-[#D4CEEA] bg-[#FBFAFF] p-4 text-center text-indigo">
          <div className="text-2xl">⬆️</div>
          <div className="mt-1 text-sm font-bold text-ink">Aadhaar (front &amp; back)</div>
          <div className="text-xs text-muted">JPG or PDF · up to 5 MB</div>
        </div>

        {done ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-trust-soft p-4 text-sm font-bold text-trust"><Check size={18} /> Submitted — approval within 24h</div>
        ) : (
          <button onClick={() => setDone(true)} className="btn-pri mt-4 w-full">Submit for review</button>
        )}
        <p className="mt-2 text-center text-[11px] text-faint">Demo seller is already approved — this is the onboarding UI.</p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
