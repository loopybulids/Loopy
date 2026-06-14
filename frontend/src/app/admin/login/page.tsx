'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loop } from '@/components/icons';

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
    <main className="grid min-h-screen place-items-center bg-[#16141d] px-5">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-2 to-indigo text-white"><Loop size={30} /></div>
        <h1 className="font-serif text-[24px] font-semibold text-white">Loopy Ops</h1>
        <p className="mt-1 text-sm text-[#9C97B6]">Admin console — pre-seeded demo account.</p>
        <div className="mt-6 rounded-2xl border border-[#2a2738] bg-[#1c1a24] p-5 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wide text-[#8d88a3]">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#2a2738] bg-[#16141d] px-3 py-3 text-sm font-semibold text-white outline-none" />
          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-[#8d88a3]">OTP</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-xl border border-[#2a2738] bg-[#16141d] px-3 py-3 text-center text-xl font-extrabold tracking-[.4em] text-white outline-none" />
          <button disabled={busy} onClick={go} className="btn-pri mt-4 w-full disabled:opacity-60">{busy ? '…' : 'Enter console'}</button>
        </div>
      </div>
    </main>
  );
}
