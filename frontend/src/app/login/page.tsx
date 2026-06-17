'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Reveal, Magnetic } from '@/components/motion';
import { ArrowRight, Bag, Loop, ShieldLock, Truck, Verified } from '@/components/icons';

export default function BuyerLogin() {
  const router = useRouter();
  const { signIn, busy } = useAuth();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const go = async () => {
    setErr('');
    try {
      await signIn('buyer', name);
      router.push('/shop');
    } catch (e: any) {
      setErr(e?.message || 'Could not sign you in. Is the API running?');
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5 py-10 text-navy">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 top-[-10%] h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-12%] bottom-[-10%] h-[38vw] w-[38vw] bg-green-600/60" style={{ animationDelay: '-7s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      <Reveal className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-display text-[26px] font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-green-mint"><Loop size={20} /></span> Loopy
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-green-600 shadow-card"><Bag size={22} /></span>
          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-tight text-navy">Shop the loop</h1>
          <p className="mt-1.5 text-[14px] text-muted">No passwords, no codes. Tell us your name and start browsing protected thrift.</p>

          <label className="mt-6 block text-[12px] font-bold uppercase tracking-wide text-muted">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="e.g. Aanya"
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3.5 text-[15px] font-semibold text-navy outline-none backdrop-blur transition-colors focus:border-green-600 focus:shadow-glow"
          />

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <Magnetic className="mt-6">
            <button disabled={busy} onClick={go} className="btn-green w-full justify-center disabled:opacity-60">
              {busy ? 'Setting up…' : <>Enter the marketplace <ArrowRight size={16} /></>}
            </button>
          </Magnetic>

          <div className="mt-6 grid gap-2 text-[12.5px] font-semibold text-navy/70">
            <span className="flex items-center gap-2"><ShieldLock size={15} className="text-green-600" /> Escrow-protected checkout</span>
            <span className="flex items-center gap-2"><Verified size={15} className="text-green-600" /> Verified, authenticated stores</span>
            <span className="flex items-center gap-2"><Truck size={15} className="text-green-600" /> Tracked, managed delivery</span>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-muted">
          Want to sell instead? <Link href="/seller/login" className="font-bold text-navy underline-offset-2 hover:underline">Open a store →</Link>
        </p>
      </Reveal>
    </main>
  );
}
