'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel } from '@/components/seller-ui';
import MediaInput from '@/components/MediaInput';
import { Verified, Check } from '@/components/icons';

export default function SellerProfile() {
  const [p, setP] = useState({ storeName: '', username: '', tagline: '', category: '', description: '', city: '', establishedYear: '', contactEmail: '', contactPhone: '', instagram: '', whatsapp: '', logoUrl: '', bannerUrl: '' });
  const [stats, setStats] = useState({ rating: 0, ratingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof p, v: string) => setP((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    api.myProfile().then((d) => {
      setP({
        storeName: d.storeName || '', username: d.username || '', tagline: d.tagline || '', category: d.category || '',
        description: d.description || '', city: d.city || '', establishedYear: d.establishedYear != null ? String(d.establishedYear) : '',
        contactEmail: d.contactEmail || '', contactPhone: d.contactPhone || '', instagram: d.instagram || '', whatsapp: d.whatsapp || '',
        logoUrl: d.logoUrl || '', bannerUrl: d.bannerUrl || '',
      });
      setStats({ rating: d.rating ?? 0, ratingCount: d.ratingCount ?? 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      await api.updateProfile({
        storeName: p.storeName, tagline: p.tagline, category: p.category, description: p.description, city: p.city,
        establishedYear: p.establishedYear === '' ? null : Number(p.establishedYear),
        contactEmail: p.contactEmail, contactPhone: p.contactPhone, instagram: p.instagram, whatsapp: p.whatsapp,
        logoUrl: p.logoUrl, bannerUrl: p.bannerUrl,
      });
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
            {p.tagline && <div className="truncate text-[13px] text-navy/80">{p.tagline}</div>}
            <div className="text-[12.5px] text-muted">{[p.category, p.city, p.establishedYear && `Since ${p.establishedYear}`].filter(Boolean).join(' · ') || '—'} · ★ {stats.rating}/5 ({stats.ratingCount})</div>
          </div>
        </div>
      </div>

      <Panel title="Edit profile">
        <div className="space-y-4">
        <Field label="Store name" value={p.storeName} onChange={(v) => set('storeName', v)} />
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Store URL</label>
          <div className="mt-1.5 c-input break-all bg-paper text-muted">{p.username ? storeUrl : '—'}</div>
        </div>
        <Field label="Tagline" value={p.tagline} onChange={(v) => set('tagline', v)} placeholder="Thrifted fashion, curated with love" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" value={p.category} onChange={(v) => set('category', v)} placeholder="Vintage & Thrift" />
          <Field label="City" value={p.city} onChange={(v) => set('city', v)} placeholder="Mumbai" />
          <Field label="Established (year)" value={p.establishedYear} onChange={(v) => set('establishedYear', v.replace(/[^0-9]/g, ''))} placeholder="2023" />
        </div>
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Bio / description</label>
          <textarea value={p.description} onChange={(e) => set('description', e.target.value)} rows={3} className="c-input mt-1.5" placeholder="Curated vintage & thrift, quality-checked." />
        </div>

        </div>

        <div className="mt-6 text-[12px] font-bold uppercase tracking-wide text-faint">Contact &amp; socials</div>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" value={p.contactEmail} onChange={(v) => set('contactEmail', v)} placeholder="hello@store.com" />
          <Field label="Contact phone" value={p.contactPhone} onChange={(v) => set('contactPhone', v)} placeholder="+91 98765 43210" />
          <Field label="Instagram" value={p.instagram} onChange={(v) => set('instagram', v)} placeholder="@yourstore" />
          <Field label="WhatsApp" value={p.whatsapp} onChange={(v) => set('whatsapp', v)} placeholder="+91 98765 43210" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

/**
 * No own margin — spacing comes from the parent (`space-y-4` or a grid `gap`).
 * It previously carried `mt-4 first:mt-0`, which broke row alignment inside a
 * grid: only the first cell got zero margin, so the other columns sat lower.
 */
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="c-input mt-1.5" />
    </div>
  );
}
