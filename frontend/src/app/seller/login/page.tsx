'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { googleEnabled } from '@/lib/google';
import GoogleButton from '@/components/GoogleButton';
import PasswordInput from '@/components/PasswordInput';
import Logo from '@/components/Logo';
import { ArrowRight, Loop, Store } from '@/components/icons';

type Mode = 'login' | 'register';

export default function SellerAuth() {
  const router = useRouter();
  const { register, loginWithGoogle, busy } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '' });
  const [err, setErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Google Identity Services hands the ID token straight to this callback —
  // no redirect round trip, so there's no "pending OAuth" state to track.
  const onGoogleToken = async (idToken: string) => {
    setErr('');
    setGoogleBusy(true);
    try {
      const role = await loginWithGoogle(idToken);
      router.replace(role === 'admin' ? '/admin' : '/seller');
    } catch (e: any) {
      setErr(e?.message || 'Sign-in failed.');
    } finally {
      setGoogleBusy(false);
    }
  };

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

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5 py-10 text-navy">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[42vw] w-[42vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/70" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob animate-aurora absolute bottom-[-12%] left-[28%] h-[36vw] w-[36vw] bg-navy/20" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      <div className="relative w-full max-w-md animate-riseIn">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2">
          <Logo height={34} />
          <span className="ml-1 rounded-md bg-green-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green">Seller</span>
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-green-600 shadow-card"><Store size={22} /></span>
          <h1 className="mt-5 font-display text-[28px] font-bold leading-tight text-navy">
            {mode === 'login' ? 'Welcome back' : 'Open your store'}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {mode === 'login' ? 'Sign in to your seller console.' : 'Create your account — your storefront goes live instantly.'}
          </p>

          {/* Google Sign-In */}
          {googleEnabled && (
            <>
              <div className="mt-6">
                <GoogleButton onToken={onGoogleToken} onError={setErr} text={mode === 'register' ? 'signup_with' : 'signin_with'} />
              </div>
              {googleBusy && <p className="mt-2 text-center text-[12.5px] font-semibold text-muted">Signing you in…</p>}

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
            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" onEnter={submit} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
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

function Field({ label, value, onChange, placeholder, type = 'text', onEnter, autoComplete }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; onEnter?: () => void; autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      {type === 'password' ? (
        <div className="mt-1.5">
          <PasswordInput value={value} onChange={onChange} placeholder={placeholder} onEnter={onEnter} autoComplete={autoComplete || 'current-password'} />
        </div>
      ) : (
        <input type={type} value={value} onChange={onChange} onKeyDown={(e) => e.key === 'Enter' && onEnter?.()} placeholder={placeholder} autoComplete={autoComplete} className="c-input mt-1.5" />
      )}
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

