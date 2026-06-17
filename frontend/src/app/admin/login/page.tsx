'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldLock } from '@/components/icons';

export default function AdminLogin() {
  const [phone, setPhone] = useState('9000000000');
  const [code, setCode] = useState('0000');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const go = async () => {
    setBusy(true);
    try {
      await api.login(phone);
      const r = await api.verify(phone, code);
      if (r.user.role !== 'admin') { alert('Not an admin account'); setBusy(false); return; }
      localStorage.setItem('loopy_token', r.accessToken);
      router.push('/admin');
    } catch (e: any) { alert(e.message); setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-navy px-5">
      <div className="w-full max-w-sm text-center">
        <div className="font-display text-[28px] font-extrabold text-white">Loopy <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[13px] text-green-mint">Admin</span></div>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/60"><ShieldLock size={14} /> Command Center</p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wide text-white/50">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-navy-deep px-3 py-3 text-sm font-semibold text-white outline-none" />
          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-white/50">OTP</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-navy-deep px-3 py-3 text-center text-xl font-extrabold tracking-[.4em] text-white outline-none" />
          <button disabled={busy} onClick={go} className="btn-mint mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Enter console'}</button>
        </div>
      </div>
    </main>
  );
}
