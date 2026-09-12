'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { rootDomain, storeUrl, storeUrlLabel } from '@/lib/store-url';
import { PageHead, AccountTabs, SettingsSection, SettingsRow } from '@/components/seller-ui';
import MediaInput from '@/components/MediaInput';
import { Verified, Check, Store, Tag } from '@/components/icons';

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

  const root = rootDomain();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = p.username ? storeUrlLabel(p.username) : '';

  if (loading) return <p className="py-10 text-center text-[13px] text-faint">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <PageHead title="Seller profile" sub="Your public store identity — shown on your storefront." action={p.username ? <a href={storeUrl(p.username)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-[13px]">View store</a> : undefined} />

      <AccountTabs active="/seller/profile" />

      {/* profile preview */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-28 bg-green-soft">
          {p.bannerUrl && <img src={p.bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex items-center gap-4 p-5">
          <span className="-mt-12 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-green-mint to-green-600 text-white ring-4 ring-white">
            {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-[22px] font-bold">{(p.storeName || 'S').charAt(0).toUpperCase()}</span>}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-display text-[19px] font-bold text-navy">{p.storeName || 'Your Store'} <Verified size={16} className="text-green-600" /></div>
            {p.tagline && <div className="truncate text-[13px] text-navy/80">{p.tagline}</div>}
            <div className="text-[12.5px] text-muted">{[p.category, p.city, p.establishedYear && `Since ${p.establishedYear}`].filter(Boolean).join(' · ') || '—'} · ★ {stats.rating}/5 ({stats.ratingCount})</div>
          </div>
        </div>
      </div>

      <SettingsSection icon={<Store size={15} />} title="Store identity" sub="How your shop introduces itself.">
        <SettingsRow label="Store name" hint="Shown in your storefront header and on every order.">
          <input value={p.storeName} onChange={(e) => set('storeName', e.target.value)} className="c-input" />
        </SettingsRow>

        <SettingsRow label="Store address" hint="Your public link. Change the handle in Settings.">
          <div className="c-input break-all bg-paper font-num text-[12.5px] text-muted">{p.username ? shopUrl : '—'}</div>
        </SettingsRow>

        <SettingsRow label="Tagline" hint="One line under your store name.">
          <input
            value={p.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            placeholder="Thrifted fashion, curated with love"
            className="c-input"
          />
        </SettingsRow>

        <SettingsRow label="Category">
          <input value={p.category} onChange={(e) => set('category', e.target.value)} placeholder="Vintage & Thrift" className="c-input" />
        </SettingsRow>

        <SettingsRow label="City">
          <input value={p.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" className="c-input" />
        </SettingsRow>

        <SettingsRow label="Trading since" hint="Shown as “Since 2023” on your storefront.">
          <input
            value={p.establishedYear}
            onChange={(e) => set('establishedYear', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="2023"
            maxLength={4}
            className="c-input"
          />
        </SettingsRow>

        <SettingsRow label="About your store" hint="A short description shoppers read before buying." stack>
          <textarea
            value={p.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Curated vintage & thrift, quality-checked."
            className="c-input"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection icon={<Verified size={15} />} title="Contact" sub="How buyers reach you. Shown on your storefront.">
        <SettingsRow label="Email">
          <input value={p.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="hello@store.com" className="c-input" />
        </SettingsRow>
        <SettingsRow label="Phone">
          <input value={p.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+91 98765 43210" className="c-input" />
        </SettingsRow>
        <SettingsRow label="Instagram">
          <input value={p.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@yourstore" className="c-input" />
        </SettingsRow>
        <SettingsRow label="WhatsApp">
          <input value={p.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+91 98765 43210" className="c-input" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection icon={<Tag size={15} />} title="Branding" sub="Your logo and banner, used across the storefront.">
        <SettingsRow label="Logo" hint="Square works best. Leave empty to use your store's initial." stack>
          <MediaInput value={p.logoUrl} onChange={(v) => set('logoUrl', v)} />
        </SettingsRow>
        <SettingsRow label="Banner" hint="Wide image behind your store name." stack>
          <MediaInput value={p.bannerUrl} onChange={(v) => set('bannerUrl', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* One save for the whole page, pinned so it's reachable from any section. */}
      <div className="sticky bottom-4 mt-6 flex items-center gap-3 rounded-xl border border-line bg-white/95 px-4 py-3 backdrop-blur">
        <button onClick={save} disabled={busy} className="btn-green disabled:opacity-60">
          {busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save profile'}
        </button>
        <span className="text-[12px] text-muted">Changes appear on your storefront straight away.</span>
      </div>
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
