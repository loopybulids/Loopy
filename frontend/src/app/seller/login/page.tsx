'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { ArrowRight, Bolt, Loop, ShieldLock, Sparkle, Store, Verified } from '@/components/icons';

type Mode = 'login' | 'register';

export default function SellerAuth() {
  const router = useRouter();
  const { loginEmail, register, busy } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '' });
  const [err, setErr] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr('');
    try {
      if (mode === 'register') {
        if (!form.name || !form.email || !form.password || !form.storeName) {
          setErr('Please fill in every field.');
          return;
        }
        if (form.password.length < 6) {
          setErr('Password must be at least 6 characters.');
          return;
        }
        await register(form);
      } else {
        if (!form.email || !form.password) {
          setErr('Enter your email and password.');
          return;
        }
        await loginEmail(form.email, form.password);
      }
      router.push('/seller');
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong. Is the API running?');
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-5 py-10 text-navy">
      {/* aurora background — same language as the home page */}
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
            {mode === 'login'
              ? 'Sign in to your seller console to manage orders, links and payouts.'
              : 'Create your account and your storefront goes live instantly.'}
          </p>

          {/* mode switch */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 text-[13px] font-bold ring-1 ring-line">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); }}
                className={`rounded-lg py-2 transition-colors ${mode === m ? 'bg-green text-white shadow-card' : 'text-muted hover:text-navy'}`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {mode === 'register' && (
              <Field label="Your name" value={form.name} onChange={set('name')} placeholder="Riya Mehta" />
            )}
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@store.com" />
            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" onEnter={submit} />
            {mode === 'register' && (
              <Field label="Store name" value={form.storeName} onChange={set('storeName')} placeholder="The Vintage Loop" onEnter={submit} />
            )}
          </div>

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

          <button disabled={busy} onClick={submit} className="btn-green mt-6 w-full justify-center disabled:opacity-60">
            {busy ? 'Please wait…' : <>{mode === 'login' ? 'Enter console' : 'Create store'} <ArrowRight size={16} /></>}
          </button>

          <div className="mt-6 grid gap-2 text-[12.5px] font-semibold text-navy/75">
            <span className="flex items-center gap-2"><Bolt size={15} className="text-green-600" /> List items in seconds</span>
            <span className="flex items-center gap-2"><Sparkle size={15} className="text-green-600" /> Live order queue &amp; payouts</span>
            <span className="flex items-center gap-2"><Verified size={15} className="text-green-600" /> Escrow-backed, instant release</span>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-faint"><ShieldLock size={13} /> Secured with JWT — your session token is signed and verified on every request.</p>
      </div>
    </main>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', onEnter,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  onEnter?: () => void;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className="c-input mt-1.5"
      />
    </div>
  );
}
