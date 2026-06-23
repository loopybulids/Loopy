'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel } from '@/components/seller-ui';
import MediaInput from '@/components/MediaInput';
import { Verified, Check } from '@/components/icons';

export default function SellerProfile() {
  const [p, setP] = useState({ storeName: '', username: '', description: '', city: '', logoUrl: '', bannerUrl: '' });
  const [stats, setStats] = useState({ rating: 0, ratingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof p, v: string) => setP((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    api.myProfile().then((d) => {
      setP({
        storeName: d.storeName || '', username: d.username || '', description: d.description || '',
        city: d.city || '', logoUrl: d.logoUrl || '', bannerUrl: d.bannerUrl || '',
      });
      setStats({ rating: d.rating ?? 0, ratingCount: d.ratingCount ?? 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      await api.updateProfile({ storeName: p.storeName, description: p.description, city: p.city, logoUrl: p.logoUrl, bannerUrl: p.bannerUrl });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const storeUrl = root ? `${p.username}.${root}` : `${origin.replace(/^https?:\/\//, '')}/s/${p.username}`;

  if (loading) return <p className="py-10 text-center text-[13px] text-faint">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <PageHead title="Seller profile" sub="Your public store identity — shown on your storefront." action={p.username ? <Link href={`/s/${p.username}`} target="_blank" className="btn-ghost px-3 py-2 text-[13px]">View store</Link> : undefined} />

      {/* profile preview */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-28 bg-green-soft">
          {p.bannerUrl && <img src={p.bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex items-center gap-4 p-5">
          <span className="-mt-12 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-green-mint to-green-600 text-white ring-4 ring-white">
            {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-[22px] font-extrabold">{(p.storeName || 'S').charAt(0).toUpperCase()}</span>}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-display text-[19px] font-extrabold text-navy">{p.storeName || 'Your Store'} <Verified size={16} className="text-green-600" /></div>
            <div className="text-[13px] text-muted">{p.city || '—'} · ★ {stats.rating}/5 ({stats.ratingCount})</div>
          </div>
        </div>
      </div>

      <Panel title="Edit profile">
        <Field label="Store name" value={p.storeName} onChange={(v) => set('storeName', v)} />
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Store URL</label>
          <div className="mt-1.5 c-input break-all bg-paper text-muted">{p.username ? storeUrl : '—'}</div>
        </div>
        <Field label="City" value={p.city} onChange={(v) => set('city', v)} placeholder="Mumbai" />
        <div className="mt-4">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Bio / description</label>
          <textarea value={p.description} onChange={(e) => set('description', e.target.value)} rows={3} className="c-input mt-1.5" placeholder="Curated vintage & thrift, quality-checked." />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Logo</label>
            <div className="mt-1.5"><MediaInput value={p.logoUrl} onChange={(v) => set('logoUrl', v)} /></div>
          </div>
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Banner</label>
            <div className="mt-1.5"><MediaInput value={p.bannerUrl} onChange={(v) => set('bannerUrl', v)} /></div>
          </div>
        </div>
        <button onClick={save} disabled={busy} className="btn-green mt-5 disabled:opacity-60">{busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save profile'}</button>
      </Panel>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="c-input mt-1.5" />
    </div>
  );
}
