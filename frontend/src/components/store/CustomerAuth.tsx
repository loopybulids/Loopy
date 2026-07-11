'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { custApi, setCust } from '@/lib/customer';

export default function CustomerAuth({ username, storeName, onClose, onAuthed }: {
  username: string; storeName?: string; onClose: () => void; onAuthed: (c: any) => void;
}) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // complete a Google redirect (flag was set before leaving)
  useEffect(() => {
    if (!supabase) return;
    if (sessionStorage.getItem('loopy_cust_oauth') !== username) return;
    sessionStorage.removeItem('loopy_cust_oauth');
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token;
      if (!t) return;
      try { const r = await custApi.authSupabase(username, t); setCust(username, r); onAuthed(r); }
      catch (e: any) { setErr(e?.message || 'Sign-in failed.'); }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const google = async () => {
    setErr('');
    if (!supabase) return setErr('Sign-in isn’t configured.');
    sessionStorage.setItem('loopy_cust_oauth', username);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    if (error) { sessionStorage.removeItem('loopy_cust_oauth'); setErr(error.message); }
  };
  const sendCode = async () => {
    setErr('');
    if (!supabase) return setErr('Sign-in isn’t configured.');
    if (!email) return setErr('Enter your email.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };
  const verify = async () => {
    setErr('');
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) { setBusy(false); return setErr(error.message); }
    try { const r = await custApi.authSupabase(username, data.session!.access_token); setCust(username, r); onAuthed(r); }
    catch (e: any) { setErr(e?.message || 'Sign-in failed.'); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-riseIn">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-navy">✕</button>
        <h2 className="font-display text-[22px] font-extrabold text-navy">Sign in{storeName ? ` to ${storeName}` : ''}</h2>
        <p className="mt-1 text-[13px] text-muted">Sign in to save favourites, checkout faster and track orders.</p>

        <button onClick={google} className="btn-ghost mt-5 w-full justify-center gap-3"><GoogleIcon /> Continue with Google</button>

        <div className="my-4 flex items-center gap-3 text-[12px] font-semibold text-faint"><span className="h-px flex-1 bg-line" /> or email code <span className="h-px flex-1 bg-line" /></div>

        {!sent ? (
          <>
            <input className="c-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={sendCode} disabled={busy} className="btn-green mt-2 w-full justify-center disabled:opacity-60">{busy ? 'Sending…' : 'Email me a code'}</button>
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[12px] text-muted">Code sent to <b className="text-navy">{email}</b></p>
            <input className="c-input tracking-[0.3em]" placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} />
            <button onClick={verify} disabled={busy} className="btn-green mt-2 w-full justify-center disabled:opacity-60">{busy ? 'Verifying…' : 'Verify & continue'}</button>
            <button onClick={() => { setSent(false); setCode(''); }} className="mt-1 w-full text-[12px] font-semibold text-muted hover:text-navy">Use a different email</button>
          </>
        )}
        {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
