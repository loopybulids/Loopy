'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldLock } from '@/components/icons';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

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
      router.push('/admin');
    } catch (e: any) { setErr(e?.message || 'Login failed.'); setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-navy px-5">
      <div className="w-full max-w-sm text-center">
        <div className="font-display text-[28px] font-extrabold text-white">
          Loopy <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[13px] text-green-mint">Admin</span>
        </div>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/60"><ShieldLock size={14} /> Command Center</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wide text-white/50">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@loopy.in"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[15px] font-semibold text-white outline-none focus:border-green-500"
          />
          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-white/50">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[15px] font-semibold text-white outline-none focus:border-green-500"
          />

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <button
            onClick={go}
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-green-500 py-2.5 text-[14px] font-bold text-[#07140A] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Enter Command Center'}
          </button>
        </div>
        <p className="mt-4 text-[11px] text-white/40">Admins only · access is logged</p>
      </div>
    </main>
  );
}
