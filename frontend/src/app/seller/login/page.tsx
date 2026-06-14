'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loop } from '@/components/icons';

export default function SellerLogin() {
  const [phone, setPhone] = useState('9876500210');
  const [code, setCode] = useState('0000');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const sendCode = async () => {
    setBusy(true);
    try {
      const r = await api.login(phone);
      setHint(r.hint || '');
      setStep('code');
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const verify = async () => {
    setBusy(true);
    try {
      const r = await api.verify(phone, code);
      localStorage.setItem('loopy_token', r.accessToken);
      localStorage.setItem('loopy_user', JSON.stringify(r.user));
      router.push('/seller/dashboard');
    } catch (e: any) { alert(e.message); setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-2 to-indigo text-white shadow-soft"><Loop size={30} /></div>
        <h1 className="text-center font-serif text-[25px] font-semibold">Seller sign in</h1>
        <p className="mt-1 text-center text-sm text-muted">Demo seller is pre-seeded — just continue.</p>

        <div className="card mt-6 p-5">
          {step === 'phone' ? (
            <>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-sm font-semibold outline-none focus:border-indigo" />
              <button disabled={busy} onClick={sendCode} className="btn-pri mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Send code'}</button>
            </>
          ) : (
            <>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted">Enter code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={4} className="mt-1 w-full rounded-xl border border-indigo px-3 py-3 text-center text-2xl font-extrabold tracking-[.4em] outline-none" />
              {hint && <p className="mt-2 text-center text-[11px] text-faint">{hint}</p>}
              <button disabled={busy} onClick={verify} className="btn-pri mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Verify & continue'}</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
