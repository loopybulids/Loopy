'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { PageHead, Panel } from '@/components/seller-ui';
import { Share } from '@/components/icons';

/* localStorage-backed store toggles (scaffold until backed by the API) */
const TOGGLE_KEYS = {
  signin: 'loopy_set_signin',
  lowstock: 'loopy_set_lowstock',
  maintenance: 'loopy_set_maintenance',
  gst: 'loopy_set_gst',
} as const;

export default function Settings() {
  const router = useRouter();
  const { user, name, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // toggles
  const [signin, setSignin] = useState(true);
  const [lowstock, setLowstock] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [gst, setGst] = useState(false);
  const [gstPct, setGstPct] = useState('18');
  const [gstSaved, setGstSaved] = useState(false);

  // change password
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.myProfile().then(setProfile).catch(() => {});
    const b = (k: string, d: boolean) => (localStorage.getItem(k) ?? String(d)) === 'true';
    setSignin(b(TOGGLE_KEYS.signin, true));
    setLowstock(b(TOGGLE_KEYS.lowstock, true));
    setMaintenance(b(TOGGLE_KEYS.maintenance, false));
    setGst(b(TOGGLE_KEYS.gst, false));
    setGstPct(localStorage.getItem('loopy_set_gstpct') || '18');
  }, []);

  const persist = (k: string, v: boolean, set: (v: boolean) => void) => { set(v); localStorage.setItem(k, String(v)); };

  const username = profile?.username || 'yourstore';
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Subdomain once a wildcard domain is configured, else the live path-based URL.
  const storeUrl = root ? `${username}.${root}` : `${origin.replace(/^https?:\/\//, '')}/s/${username}`;
  const email = profile?.user?.email || '—';
  const storeId = user?.sellerId || profile?.id || '—';

  const updatePassword = async () => {
    setPwMsg('');
    if (pw.length < 6) { setPwMsg('Password must be at least 6 characters.'); return; }
    setPwBusy(true);
    try { await api.changePassword(pw); setPw(''); setPwMsg('Password updated.'); }
    catch (e: any) { setPwMsg(e?.message || 'Could not update password.'); }
    finally { setPwBusy(false); }
  };

  const copyUrl = async () => {
    const full = root ? `https://${username}.${root}` : `${origin}/s/${username}`;
    await navigator.clipboard.writeText(full).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const saveGst = () => { localStorage.setItem('loopy_set_gstpct', gstPct); setGstSaved(true); setTimeout(() => setGstSaved(false), 1600); };

  const deleteStore = () => {
    if (confirm('Delete your store permanently? This cannot be undone.')) {
      // wired to a real destructive endpoint in a later pass — for now sign out.
      signOut();
      router.replace('/seller/login');
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHead title="Settings" sub="Manage your store settings." />

      {/* notice */}
      <div className="mb-6 rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 text-[13px] leading-relaxed text-navy/80">
        <span className="font-bold text-amber">Notice:</span> To ensure smooth payout processing, add your bank account details (Account Holder Name, Account Number, IFSC Code) in the <b>Payments</b> tab.
      </div>

      {/* account */}
      <Panel title="Account" className="mb-6">
        <ReadField label="Email" value={email} />
        <ReadField label="Store ID" value={storeId} mono />
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Change password</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="New password"
                className="c-input pr-10"
              />
              <button onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-navy">{showPw ? '🙈' : '👁'}</button>
            </div>
            <button onClick={updatePassword} disabled={pwBusy} className="btn-navy px-4 py-3 disabled:opacity-60">{pwBusy ? 'Saving…' : 'Update Password'}</button>
          </div>
          {pwMsg && <p className={`mt-2 text-[12.5px] font-semibold ${pwMsg.includes('updated') ? 'text-green-600' : 'text-rose'}`}>{pwMsg}</p>}
        </div>
      </Panel>

      {/* store url */}
      <Panel title="Store URL" action={<button className="text-[13px] font-bold text-green-600 hover:underline">✎ Edit</button>} className="mb-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3">
          <span className="font-mono text-[14px] text-navy">{storeUrl}</span>
          <div className="ml-auto flex items-center gap-3 text-[13px] font-bold text-navy/70">
            <button onClick={copyUrl} className="hover:text-navy">{copied ? 'Copied!' : 'Copy'}</button>
            <button className="flex items-center gap-1 hover:text-navy"><Share size={14} /> Share</button>
          </div>
        </div>
      </Panel>

      {/* toggles */}
      <ToggleCard
        title="Sign-in Required for Checkout"
        desc="When enabled, customers must create an account or sign in before placing an order. Turn off to allow guest checkout (name, email, phone & address only)."
        on={signin}
        onChange={(v) => persist(TOGGLE_KEYS.signin, v, setSignin)}
      />
      <ToggleCard
        title="Low Stock Warning Badge"
        desc="Show a 🔥 low stock badge on products when stock level drops to 5 or fewer."
        on={lowstock}
        onChange={(v) => persist(TOGGLE_KEYS.lowstock, v, setLowstock)}
      />
      <ToggleCard
        title="Maintenance Mode"
        desc="Temporarily disable checkout to pause sales. Customers can still browse your store, but won't be able to place orders."
        on={maintenance}
        onChange={(v) => persist(TOGGLE_KEYS.maintenance, v, setMaintenance)}
      />

      {/* GST */}
      <Panel className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-[15px] font-bold text-navy">GST charges</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">Add GST charges to checkout. When enabled, the specified tax percentage is added to the customer's subtotal at checkout.</p>
          </div>
          <Toggle on={gst} onChange={(v) => persist(TOGGLE_KEYS.gst, v, setGst)} />
        </div>
        {gst && (
          <div className="mt-4 flex items-center gap-2">
            <input value={gstPct} onChange={(e) => setGstPct(e.target.value)} type="number" className="c-input w-28" />
            <span className="text-[14px] font-semibold text-muted">% tax</span>
          </div>
        )}
        <button onClick={saveGst} className="btn-navy mt-4 px-4 py-2.5 text-[13px]">{gstSaved ? 'Saved' : 'Save GST Settings'}</button>
      </Panel>

      {/* danger zone */}
      <div className="rounded-2xl border border-rose/40 bg-rose-soft/40 p-6">
        <h3 className="font-display text-[15px] font-extrabold text-rose">Danger Zone</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-ghost">Unpublish Store</button>
          <button onClick={deleteStore} className="btn inline-flex items-center justify-center rounded-full bg-rose px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]">Delete Store</button>
        </div>
      </div>
    </div>
  );
}

function ReadField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <div className={`mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[14px] text-muted ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</div>
    </div>
  );
}

function ToggleCard({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="card mb-6 flex items-start justify-between gap-4 p-6">
      <div>
        <h3 className="font-display text-[15px] font-bold text-navy">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-green' : 'bg-line'}`}
      aria-pressed={on}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-card transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}
