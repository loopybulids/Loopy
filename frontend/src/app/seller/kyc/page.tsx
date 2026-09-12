'use client';
import { useState } from 'react';
import SellerNav from '@/components/SellerNav';
import { useRequireRole } from '@/lib/useRequireRole';
import { Camera, Check, Verified } from '@/components/icons';

export default function SellerKyc() {
  const { ready, role } = useRequireRole('seller');
  const [done, setDone] = useState(false);

  if (!ready || role !== 'seller') return <main className="seller-bg min-h-screen" />;

  return (
    <main className="seller-bg min-h-screen pb-12">
      <SellerNav />
      <div className="relative">
        <div className="seller-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-md px-5 py-8">
          <div className="animate-riseIn">
            <div className="flex gap-1.5"><span className="h-1.5 flex-1 rounded-full bg-green-500" /><span className="h-1.5 flex-1 rounded-full bg-green-500" /><span className="h-1.5 flex-1 rounded-full bg-white/10" /></div>
            <div className="mt-2 text-xs s-muted">Step 2 of 3 · KYC verification</div>
            <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-white">Verify your store</h1>
          </div>

          <div className="s-card mt-4 space-y-3 p-5">
            <Row label="Store name" value="The Vintage Loop" />
            <Row label="Store handle" value="loopy.com/s/riyathrifts" />
            <Row label="PAN number" value="ABCDE1234F" verified />
            <Row label="Aadhaar" value="•••• •••• 8821" verified />
            <Row label="Bank · IFSC" value="HDFC0001234" verified />
          </div>

          <div className="mt-4 text-sm font-bold text-white">Documents</div>
          <div className="s-card mt-2 flex items-center gap-3 p-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/15 text-green-500 ring-1 ring-green-500/30">📄</span><span className="flex-1 text-sm font-bold text-white">PAN card.jpg</span><span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-500"><Check size={11} /> Uploaded</span></div>
          <label className="mt-2 block cursor-pointer rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] p-5 text-center transition-colors hover:border-green-500/40"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Camera size={18} /></span><div className="mt-2 text-sm font-bold text-white">Aadhaar (front & back)</div><div className="text-xs s-muted">JPG or PDF · up to 5 MB</div></label>

          {done ? <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-500/15 p-4 text-sm font-bold text-green-500"><Verified size={18} /> Submitted — approval within 24h</div>
            : <button onClick={() => setDone(true)} className="s-btn mt-4 w-full">Submit for review</button>}
          <p className="mt-2 text-center text-[11px] s-muted">Demo seller is already approved — this is the onboarding UI.</p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-wide text-[#8A98AD]">{label}</div>{verified && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500"><Verified size={11} /> Verified</span>}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
