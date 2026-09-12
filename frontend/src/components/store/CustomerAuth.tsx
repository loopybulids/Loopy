'use client';
import { useState } from 'react';
import GoogleButton from '@/components/GoogleButton';
import PasswordInput from '@/components/PasswordInput';
import { custApi, setCust } from '@/lib/customer';

type Mode = 'login' | 'register';

export default function CustomerAuth({ username, storeName, onClose, onAuthed }: {
  username: string; storeName?: string; onClose: () => void; onAuthed: (c: any) => void;
}) {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Set once a signup code has been emailed — switches the modal to code entry.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const finish = (r: any) => { setCust(username, r); onAuthed(r); };

  const withGoogle = async (idToken: string) => {
    setErr(''); setBusy(true);
    try { finish(await custApi.authGoogle(username, idToken)); }
    catch (e: any) { setErr(e?.message || 'Sign-in failed.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    setErr('');
    if (!form.email.trim()) return setErr('Enter your email.');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    try {
      if (mode === 'login') {
        finish(await custApi.login(username, form.email, form.password));
      } else {
        // Signup doesn't create the account yet — it emails a code first.
        const r = await custApi.register(username, { name: form.name, email: form.email, password: form.password });
        setDevCode(r?.devCode || '');
        setCodeSent(true);
      }
    } catch (e: any) { setErr(e?.message || 'Sign-in failed.'); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setErr('');
    if (code.trim().length !== 6) return setErr('Enter the 6-digit code.');
    setBusy(true);
    try { finish(await custApi.verifySignup(username, form.email, code.trim())); }
    catch (e: any) { setErr(e?.message || 'Verification failed.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setErr(''); setCode(''); setBusy(true);
    try {
      const r = await custApi.register(username, { name: form.name, email: form.email, password: form.password });
      setDevCode(r?.devCode || '');
    } catch (e: any) { setErr(e?.message || 'Could not resend.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-riseIn">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-navy">✕</button>

        {codeSent ? (
          <>
            <h2 className="font-display text-[22px] font-bold text-navy">Check your email</h2>
            <p className="mt-1 text-[13px] text-muted">
              We sent a 6-digit code to <b className="text-navy">{form.email}</b>. It expires in 10 minutes.
            </p>
            {devCode && (
              <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-[12.5px] text-muted">
                Email isn’t configured yet, so here’s your code: <b className="tracking-[0.2em] text-navy">{devCode}</b>
              </p>
            )}
            <input
              className="c-input mt-4 text-center text-lg font-bold tracking-[0.4em]"
              placeholder="••••••" inputMode="numeric" maxLength={6} autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
            />
            <button onClick={verify} disabled={busy} className="btn-green mt-3 w-full justify-center disabled:opacity-60">
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>
            <div className="mt-2 flex items-center justify-between text-[12px] font-semibold">
              <button onClick={() => { setCodeSent(false); setCode(''); setErr(''); }} className="text-muted hover:text-navy">← Back</button>
              <button onClick={resend} disabled={busy} className="text-green-600 hover:underline disabled:opacity-60">Resend code</button>
            </div>
            {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
          </>
        ) : (
        <>
        <h2 className="font-display text-[22px] font-bold text-navy">
          {mode === 'login' ? 'Sign in' : 'Create account'}{storeName ? ` · ${storeName}` : ''}
        </h2>
        <p className="mt-1 text-[13px] text-muted">Save favourites, check out faster and track your orders.</p>

        <div className="mt-5">
          <GoogleButton onToken={withGoogle} onError={setErr} text={mode === 'register' ? 'signup_with' : 'signin_with'} />
        </div>

        <div className="my-4 flex items-center gap-3 text-[12px] font-semibold text-faint">
          <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1 text-[13px] font-bold">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setErr(''); }}
              className={`rounded-lg py-2 transition-colors ${mode === m ? 'bg-green text-white shadow-card' : 'text-muted hover:text-navy'}`}>
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {mode === 'register' && (
            <input className="c-input" placeholder="Your name" value={form.name} onChange={set('name')} />
          )}
          <input className="c-input" type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
          <PasswordInput
            placeholder="Password (min 6 characters)"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={form.password} onChange={set('password')} onEnter={submit}
          />
        </div>

        <button onClick={submit} disabled={busy} className="btn-green mt-3 w-full justify-center disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
        </>
        )}
      </div>
    </div>
  );
}
