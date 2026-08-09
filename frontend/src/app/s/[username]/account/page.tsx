'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { custApi, getCust, setCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import { Check } from '@/components/icons';

export default function AccountProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    if (!getCust(username)) { setLoading(false); return; }
    custApi.me(username)
      .then((d: any) => { setMe(d); setForm({ name: d?.name || '', phone: d?.phone || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); window.addEventListener('cust-change', load); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setErr(''); setSaved(false); setBusy(true);
    try {
      const updated = await custApi.updateMe(username, form);
      setMe((m: any) => ({ ...m, ...updated }));
      // keep the header's name in sync with what was just saved
      const session = getCust(username);
      if (session) setCust(username, { token: session.token, customer: { ...session.customer, ...updated } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setErr(e?.message || 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  };

  const dirty = !!me && (form.name !== (me.name || '') || form.phone !== (me.phone || ''));

  return (
    <AccountShell username={username} title="Profile">
      {loading ? (
        <p className="py-8 text-center text-[13px] text-faint">Loading your details…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Full name</label>
            <input
              className="c-input mt-1.5"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />

            <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Phone</label>
            <input
              className="c-input mt-1.5"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Used for delivery updates"
              onKeyDown={(e) => e.key === 'Enter' && dirty && save()}
            />

            <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Email</label>
            <input className="c-input mt-1.5 bg-paper text-muted" value={me?.email || ''} readOnly disabled />
            <p className="mt-1.5 text-[12px] text-faint">
              Your email identifies this account and is how you sign in, so it can&apos;t be changed here.
            </p>

            {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

            <button onClick={save} disabled={busy || !dirty} className="btn-green mt-5 disabled:opacity-50">
              {busy ? 'Saving…' : saved ? <><Check size={15} /> Saved</> : 'Save changes'}
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h3 className="font-display text-[14px] font-extrabold text-navy">Account</h3>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Store</dt>
                <dd className="truncate font-semibold text-navy">{username}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Member since</dt>
                <dd className="font-semibold text-navy">
                  {me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Saved addresses</dt>
                <dd className="font-semibold text-navy">{me?.addresses?.length ?? 0}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
              This account belongs to <b className="text-navy">{username}</b> only. Each store you shop with keeps its own separate account.
            </p>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
