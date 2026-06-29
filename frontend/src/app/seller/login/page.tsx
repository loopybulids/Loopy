'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { supabase, supabaseEnabled } from '@/lib/supabase';
import { ArrowRight, Loop, Store } from '@/components/icons';

type Mode = 'login' | 'register';

export default function SellerAuth() {
  const router = useRouter();
  const { register, loginWithSupabase, busy } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '' });
  const [err, setErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  // email-OTP flow
  const [showCode, setShowCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [supaBusy, setSupaBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Only auto-complete a Google login right after the user clicked "Continue with
  // Google" (we set a one-shot flag before redirecting). Otherwise a lingering
  // Supabase session would silently log the user in on every page visit.
  useEffect(() => {
    if (!supabase) return;
    if (sessionStorage.getItem('loopy_oauth_pending') !== '1') return;
    sessionStorage.removeItem('loopy_oauth_pending');
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        try { await loginWithSupabase(token); router.replace('/seller'); }
        catch (e: any) { setErr(e?.message || 'Sign-in failed.'); }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setErr('');
    if (mode === 'register') {
      if (!form.name || !form.email || !form.password || !form.storeName) return setErr('Please fill in every field.');
      if (form.password.length < 6) return setErr('Password must be at least 6 characters.');
      try { await register(form); router.push('/seller'); }
      catch (e: any) { setErr(e?.message || 'Something went wrong. Is the API running?'); }
      return;
    }
    // login — route by role: admins go to /admin, sellers to /seller (no rejection line)
    if (!form.email || !form.password) return setErr('Enter your email and password.');
    setPwBusy(true);
    try {
      const r = await api.loginEmail(form.email, form.password);
      localStorage.setItem('loopy_token', r.accessToken);
      localStorage.setItem('loopy_user', JSON.stringify(r.user));
      if (r.user?.role === 'admin') {
        localStorage.setItem('loopy_role', 'admin');
        try { const cmd = await api.adminCommand(); localStorage.setItem('loopy_admin_command', JSON.stringify(cmd)); } catch {}
        window.location.href = '/admin'; // hard nav so the page loads with the token set
        return;
      }
      if (r.user?.role !== 'seller') {
        localStorage.removeItem('loopy_token'); localStorage.removeItem('loopy_user');
        setPwBusy(false);
        return setErr('This account can’t access the console.');
      }
      localStorage.setItem('loopy_role', 'seller');
      localStorage.setItem('loopy_name', r.user?.name?.trim() || 'Your Store');
      window.location.href = '/seller';
    } catch (e: any) {
      setPwBusy(false);
      setErr(e?.message || 'Something went wrong. Is the API running?');
    }
  };

  const google = async () => {
    setErr('');
    if (!supabase) return setErr('Google sign-in isn’t configured yet.');
    sessionStorage.setItem('loopy_oauth_pending', '1'); // one-shot: auth the session on return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/seller/login` },
    });
    if (error) { sessionStorage.removeItem('loopy_oauth_pending'); setErr(error.message); }
  };

  const sendCode = async () => {
    setErr('');
    if (!supabase) return setErr('Email code isn’t configured yet.');
    if (!otpEmail) return setErr('Enter your email.');
    setSupaBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: true } });
    setSupaBusy(false);
    if (error) setErr(error.message); else setCodeSent(true);
  };

  const verifyCode = async () => {
    setErr('');
    if (!supabase) return;
    setSupaBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token: otpCode, type: 'email' });
    if (error) { setSupaBusy(false); return setErr(error.message); }
    const token = data.session?.access_token;
    if (!token) { setSupaBusy(false); return setErr('No session returned.'); }
    try { await loginWithSupabase(token); router.push('/seller'); }
    catch (e: any) { setErr(e?.message || 'Sign-in failed.'); }
    finally { setSupaBusy(false); }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5 py-10 text-navy">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[42vw] w-[42vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/70" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob animate-aurora absolute bottom-[-12%] left-[28%] h-[36vw] w-[36vw] bg-navy/20" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      <div className="relative w-full max-w-md animate-riseIn">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-display text-[26px] font-extrabold tracking-tight text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-green-mint"><Loop size={20} /></span> Loopy
          <span className="ml-1 rounded-md bg-green-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green">Seller</span>
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-green-600 shadow-card"><Store size={22} /></span>
          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-tight text-navy">
            {mode === 'login' ? 'Welcome back' : 'Open your store'}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {mode === 'login' ? 'Sign in to your seller console.' : 'Create your account — your storefront goes live instantly.'}
          </p>

          {/* Google + email-code (Supabase) */}
          {supabaseEnabled && (
            <>
              <button onClick={google} className="btn-ghost mt-6 w-full justify-center gap-3">
                <GoogleIcon /> Continue with Google
              </button>

              {!showCode ? (
                <button onClick={() => setShowCode(true)} className="mt-2 w-full rounded-lg py-2 text-[13px] font-bold text-navy/70 transition-colors hover:text-navy">
                  Email me a sign-in code instead
                </button>
              ) : (
                <div className="mt-3 rounded-xl border border-line bg-white/70 p-3">
                  {!codeSent ? (
                    <>
                      <input className="c-input" type="email" placeholder="you@store.com" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} />
                      <button onClick={sendCode} disabled={supaBusy} className="btn-navy mt-2 w-full justify-center disabled:opacity-60">{supaBusy ? 'Sending…' : 'Send code'}</button>
                    </>
                  ) : (
                    <>
                      <p className="mb-1.5 text-[12px] text-muted">We emailed a 6-digit code to <b className="text-navy">{otpEmail}</b>.</p>
                      <input className="c-input tracking-[0.3em]" placeholder="••••••" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                      <button onClick={verifyCode} disabled={supaBusy} className="btn-green mt-2 w-full justify-center disabled:opacity-60">{supaBusy ? 'Verifying…' : 'Verify & enter'}</button>
                      <button onClick={() => { setCodeSent(false); setOtpCode(''); }} className="mt-1 w-full text-[12px] font-semibold text-muted hover:text-navy">Use a different email</button>
                    </>
                  )}
                </div>
              )}

              <div className="my-5 flex items-center gap-3 text-[12px] font-semibold text-faint">
                <span className="h-px flex-1 bg-line" /> or with password <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          {/* email / password */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 text-[13px] font-bold ring-1 ring-line">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }} className={`rounded-lg py-2 transition-colors ${mode === m ? 'bg-green text-white shadow-card' : 'text-muted hover:text-navy'}`}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {mode === 'register' && <Field label="Your name" value={form.name} onChange={set('name')} placeholder="Riya Mehta" />}
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@store.com" />
            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" onEnter={submit} />
            {mode === 'register' && <Field label="Store name" value={form.storeName} onChange={set('storeName')} placeholder="The Vintage Loop" onEnter={submit} />}
          </div>

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <button disabled={busy || pwBusy} onClick={submit} className="btn-green mt-5 w-full justify-center disabled:opacity-60">
            {busy || pwBusy ? 'Please wait…' : <>{mode === 'login' ? 'Enter console' : 'Create store'} <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', onEnter }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; onEnter?: () => void;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input type={type} value={value} onChange={onChange} onKeyDown={(e) => e.key === 'Enter' && onEnter?.()} placeholder={placeholder} className="c-input mt-1.5" />
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
