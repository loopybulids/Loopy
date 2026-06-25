'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight, Loop, ShieldLock } from '@/components/icons';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const go = async () => {
    setErr('');
    if (!email || !password) { setErr('Enter email and password.'); return; }
    setBusy(true);
    try {
      const r = await api.loginEmail(email, password);
      if (r.user?.role !== 'admin') { setErr('This account is not an admin.'); setBusy(false); return; }
      localStorage.setItem('loopy_token', r.accessToken);
      localStorage.setItem('loopy_user', JSON.stringify(r.user));
      localStorage.setItem('loopy_role', 'admin');
      // hard nav so /admin loads fresh with the token already in localStorage
      window.location.href = '/admin';
    } catch (e: any) { setErr(e?.message || 'Login failed.'); setBusy(false); }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5 py-10 text-navy">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[42vw] w-[42vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/70" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob animate-aurora absolute bottom-[-12%] left-[28%] h-[36vw] w-[36vw] bg-navy/20" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      <div className="relative w-full max-w-md animate-riseIn">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-display text-[26px] font-extrabold tracking-tight text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-green-mint"><Loop size={20} /></span> Loopy
          <span className="ml-1 rounded-md bg-navy px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green-mint">Admin</span>
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-navy shadow-card"><ShieldLock size={22} /></span>
          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-tight text-navy">Command Center</h1>
          <p className="mt-1.5 text-[14px] text-muted">Admin access to platform analytics and seller management.</p>

          <div className="mt-6 space-y-3">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@loopy.in" className="c-input mt-1.5" />
            </div>
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder="••••••••" className="c-input mt-1.5" />
            </div>
          </div>

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <button onClick={go} disabled={busy} className="btn-navy mt-6 w-full justify-center disabled:opacity-60">
            {busy ? 'Signing in…' : <>Enter Command Center <ArrowRight size={16} /></>}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-faint"><ShieldLock size={12} className="mb-0.5 inline" /> Admins only · access is logged</p>
      </div>
    </main>
  );
}
