'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { ArrowRight, Bolt, Loop, ShieldLock, Sparkle, Store, Verified } from '@/components/icons';

export default function SellerLogin() {
  const router = useRouter();
  const { signIn, busy } = useAuth();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const go = async () => {
    setErr('');
    try {
      await signIn('seller', name);
      router.push('/seller/dashboard');
    } catch (e: any) {
      setErr(e?.message || 'Could not sign you in. Is the API running?');
    }
  };

  return (
    <main className="seller-bg relative grid min-h-screen place-items-center overflow-hidden px-5 py-10">
      <div className="seller-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-[-10%] h-[40vw] w-[40vw] rounded-full bg-green-500/20 blur-[90px]" />
        <div className="absolute right-[-10%] bottom-[-12%] h-[36vw] w-[36vw] rounded-full bg-green-600/15 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-riseIn">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-display text-[26px] font-extrabold tracking-tight text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Loop size={20} /></span> Loopy
          <span className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8A98AD]">Seller</span>
        </Link>

        <div className="s-card s-card-glow p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Store size={22} /></span>
          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-tight text-white">Open your store</h1>
          <p className="mt-1.5 text-[14px] text-[#8A98AD]">No OTP, no friction. Name your store and step straight into your seller console.</p>

          <label className="mt-6 block text-[12px] font-bold uppercase tracking-wide text-[#8A98AD]">Store / your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="e.g. The Vintage Loop"
            autoFocus
            className="s-input mt-1.5 w-full px-4 py-3.5 text-[15px] font-semibold"
          />

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <button disabled={busy} onClick={go} className="s-btn mt-6 w-full disabled:opacity-60">
            {busy ? 'Opening console…' : <>Enter seller console <ArrowRight size={16} /></>}
          </button>

          <div className="mt-6 grid gap-2 text-[12.5px] font-semibold text-[#C7D2E0]">
            <span className="flex items-center gap-2"><Bolt size={15} className="text-green-500" /> List items in seconds</span>
            <span className="flex items-center gap-2"><Sparkle size={15} className="text-green-500" /> Live order queue &amp; payouts</span>
            <span className="flex items-center gap-2"><Verified size={15} className="text-green-500" /> Escrow-backed, instant release</span>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-[#8A98AD]">
          Here to buy instead? <Link href="/login" className="font-bold text-white underline-offset-2 hover:underline">Shop the loop →</Link>
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#5E6B80]"><ShieldLock size={13} /> Demo store is pre-verified — products you list appear live to shoppers.</p>
      </div>
    </main>
  );
}
