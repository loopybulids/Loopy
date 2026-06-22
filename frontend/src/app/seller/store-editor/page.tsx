'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StoreConfig, SECTION_ORDER, withDefaults } from '@/lib/store-config';
import StorePreview from '@/components/StorePreview';
import MediaInput from '@/components/MediaInput';
import { Check } from '@/components/icons';

type SectionKey = (typeof SECTION_ORDER)[number]['key'];

export default function StoreEditor() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('Your Store');
  const [username, setUsername] = useState('');
  const [active, setActive] = useState<SectionKey>('hero');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.myProfile().catch(() => null), api.myProducts().catch(() => [])]).then(([p, prods]) => {
      const name = p?.storeName || 'Your Store';
      setStoreName(name);
      setUsername(p?.username || '');
      const parsed = typeof p?.storeConfig === 'string' ? safeParse(p.storeConfig) : p?.storeConfig;
      setConfig(withDefaults(name, parsed));
      setProducts(prods || []);
    });
  }, []);

  // generic deep-ish setter for a section field
  const set = (section: keyof StoreConfig, field: string, value: any) =>
    setConfig((c) => (c ? { ...c, [section]: { ...(c as any)[section], [field]: value } } : c));

  const publish = async () => {
    if (!config) return;
    setSaving(true); setSaved(false);
    try { await api.updateStoreConfig(config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { /* surfaced below */ }
    finally { setSaving(false); }
  };

  const previewWidth = useMemo(() => (device === 'mobile' ? 'max-w-[400px]' : 'max-w-none'), [device]);

  if (!config) return <p className="py-10 text-center text-[13px] text-faint">Loading store editor…</p>;

  return (
    <div className="-mx-5 -my-6 flex flex-col sm:-mx-8 sm:-my-8 lg:h-[calc(100vh-69px)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
        <div>
          <h1 className="font-display text-[16px] font-extrabold text-navy">Store Editor</h1>
          <p className="text-[12px] text-faint">Customize your storefront, then publish.</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-paper p-1 text-[13px] font-bold ring-1 ring-line">
          {(['desktop', 'mobile'] as const).map((d) => (
            <button key={d} onClick={() => setDevice(d)} className={`rounded-md px-3 py-1.5 capitalize transition-colors ${device === d ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}>{d}</button>
          ))}
        </div>
        {username && <Link href={`/s/${username}`} target="_blank" className="btn-ghost px-3 py-2 text-[13px]">View store</Link>}
        <button onClick={publish} disabled={saving} className="btn-green px-4 py-2 text-[13px] disabled:opacity-60">
          {saving ? 'Publishing…' : saved ? <><Check size={15} /> Published</> : 'Publish'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* sections list */}
        <aside className="order-1 w-full shrink-0 border-b border-line bg-white p-3 lg:w-52 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Page Sections</div>
          {SECTION_ORDER.map((s) => {
            const on = active === s.key;
            const sec = (config as any)[s.key];
            const toggleable = s.key !== 'theme' && s.key !== 'footer' && 'enabled' in (sec || {});
            return (
              <div key={s.key} className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold ${on ? 'bg-green-soft text-green' : 'text-navy/70 hover:bg-paper'}`}>
                <button onClick={() => setActive(s.key)} className="flex-1 text-left">{s.label}</button>
                {toggleable && (
                  <button
                    onClick={() => set(s.key as keyof StoreConfig, 'enabled', !sec.enabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${sec.enabled ? 'bg-green' : 'bg-line'}`}
                    title={sec.enabled ? 'Visible' : 'Hidden'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${sec.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                )}
              </div>
            );
          })}
        </aside>

        {/* live preview */}
        <main className="order-3 min-w-0 flex-1 bg-paper p-4 lg:order-2 lg:overflow-y-auto">
          <div className={`mx-auto overflow-hidden rounded-lg border border-line shadow-card transition-all ${previewWidth}`}>
            <StorePreview config={config} products={products} storeName={storeName} mobile={device === 'mobile'} />
          </div>
        </main>

        {/* field editor */}
        <aside className="order-2 w-full shrink-0 border-t border-line bg-white p-5 lg:order-3 lg:w-80 lg:border-t-0 lg:border-l lg:overflow-y-auto">
          <Fields active={active} config={config} set={set} setConfig={setConfig} storeName={storeName} />
        </aside>
      </div>
    </div>
  );
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return null; } }

/* ───── per-section field editors ───── */
function Fields({ active, config, set, setConfig, storeName }: {
  active: SectionKey;
  config: StoreConfig;
  set: (section: keyof StoreConfig, field: string, value: any) => void;
  setConfig: React.Dispatch<React.SetStateAction<StoreConfig | null>>;
  storeName: string;
}) {
  const label = SECTION_ORDER.find((s) => s.key === active)?.label;
  return (
    <div>
      <h2 className="mb-4 font-display text-[15px] font-extrabold text-navy">{label}</h2>

      {active === 'announcement' && (
        <Text label="Announcement text" value={config.announcement.text} onChange={(v) => set('announcement', 'text', v)} />
      )}

      {active === 'header' && (
        <>
          <Toggle label="Show search icon" value={config.header.showSearch} onChange={(v) => set('header', 'showSearch', v)} />
          <div className="mt-4 text-[12px] font-bold uppercase tracking-wide text-faint">Nav links</div>
          {config.header.nav.map((n, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input className="c-input" value={n.label} onChange={(e) => {
                const nav = [...config.header.nav]; nav[i] = { ...nav[i], label: e.target.value };
                setConfig((c) => c ? { ...c, header: { ...c.header, nav } } : c);
              }} />
              <button className="rounded-md px-2 text-rose" onClick={() => {
                const nav = config.header.nav.filter((_, j) => j !== i);
                setConfig((c) => c ? { ...c, header: { ...c.header, nav } } : c);
              }}>✕</button>
            </div>
          ))}
          <button className="btn-ghost mt-2 w-full py-2 text-[13px]" onClick={() => {
            const nav = [...config.header.nav, { label: 'New link', href: '#' }];
            setConfig((c) => c ? { ...c, header: { ...c.header, nav } } : c);
          }}>+ Add link</button>
        </>
      )}

      {active === 'hero' && (
        <>
          <Text label="Tagline (eyebrow)" value={config.hero.eyebrow} onChange={(v) => set('hero', 'eyebrow', v)} />
          <Text label="Hero headline" value={config.hero.headline} onChange={(v) => set('hero', 'headline', v)} />
          <Area label="Hero subtext" value={config.hero.subtext} onChange={(v) => set('hero', 'subtext', v)} />
          <Text label="CTA button label" value={config.hero.ctaLabel} onChange={(v) => set('hero', 'ctaLabel', v)} />
          <div className="mt-4">
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Background image / video (optional)</label>
            <div className="mt-1.5">
              <MediaInput value={config.hero.imageUrl} onChange={(v) => set('hero', 'imageUrl', v)} />
            </div>
          </div>
          {config.hero.imageUrl && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold uppercase tracking-wide text-faint">Image position</label>
                <span className="text-[11px] text-faint">{config.hero.focusY ?? 50}%</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => set('hero', 'focusY', Math.max(0, (config.hero.focusY ?? 50) - 10))} className="grid h-9 w-9 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft" title="Show higher part">↑</button>
                <input type="range" min={0} max={100} value={config.hero.focusY ?? 50} onChange={(e) => set('hero', 'focusY', Number(e.target.value))} className="flex-1 accent-green-600" />
                <button onClick={() => set('hero', 'focusY', Math.min(100, (config.hero.focusY ?? 50) + 10))} className="grid h-9 w-9 place-items-center rounded-lg bg-white text-navy ring-1 ring-line hover:bg-green-soft" title="Show lower part">↓</button>
              </div>
              <p className="mt-1.5 text-[11px] text-faint">Slide up/down to frame the part of the image you want visible.</p>
            </div>
          )}
        </>
      )}

      {active === 'banners' && (
        <>
          {config.banners.images.map((src, i) => (
            <div key={i} className="mt-3 rounded-lg border border-line p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-faint">Banner {i + 1}</span>
                <button className="text-[12px] font-semibold text-rose" onClick={() => {
                  const images = config.banners.images.filter((_, j) => j !== i);
                  setConfig((c) => c ? { ...c, banners: { ...c.banners, images } } : c);
                }}>Remove</button>
              </div>
              <MediaInput value={src} onChange={(v) => {
                const images = [...config.banners.images]; images[i] = v;
                setConfig((c) => c ? { ...c, banners: { ...c.banners, images } } : c);
              }} />
            </div>
          ))}
          <button className="btn-ghost mt-2 w-full py-2 text-[13px]" onClick={() => {
            const images = [...config.banners.images, ''];
            setConfig((c) => c ? { ...c, banners: { ...c.banners, images } } : c);
          }}>+ Add banner</button>
        </>
      )}

      {active === 'productTabs' && (
        <>
          <Text label="Section heading" value={config.productTabs.heading} onChange={(v) => set('productTabs', 'heading', v)} />
          <Text label="Subheading" value={config.productTabs.sub} onChange={(v) => set('productTabs', 'sub', v)} />
          <div className="mt-4 text-[12px] font-bold uppercase tracking-wide text-faint">Tabs (comma separated)</div>
          <input className="c-input mt-1.5" value={config.productTabs.tabs.join(', ')} onChange={(e) => set('productTabs', 'tabs', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
        </>
      )}

      {active === 'policies' && (
        <>
          {config.policies.items.map((p, i) => (
            <div key={i} className="mt-3 rounded-lg border border-line p-3">
              <input className="c-input" value={p.title} onChange={(e) => {
                const items = [...config.policies.items]; items[i] = { ...items[i], title: e.target.value };
                setConfig((c) => c ? { ...c, policies: { ...c.policies, items } } : c);
              }} />
              <textarea className="c-input mt-2" rows={2} value={p.body} onChange={(e) => {
                const items = [...config.policies.items]; items[i] = { ...items[i], body: e.target.value };
                setConfig((c) => c ? { ...c, policies: { ...c.policies, items } } : c);
              }} />
            </div>
          ))}
        </>
      )}

      {active === 'socials' && (
        <>
          <Text label="Instagram URL" value={config.socials.instagram} onChange={(v) => set('socials', 'instagram', v)} />
          <Text label="Facebook URL" value={config.socials.facebook} onChange={(v) => set('socials', 'facebook', v)} />
          <Text label="WhatsApp number" value={config.socials.whatsapp} onChange={(v) => set('socials', 'whatsapp', v)} />
        </>
      )}

      {active === 'contact' && (
        <>
          <Text label="Email" value={config.contact.email} onChange={(v) => set('contact', 'email', v)} />
          <Text label="Phone" value={config.contact.phone} onChange={(v) => set('contact', 'phone', v)} />
          <Area label="Address" value={config.contact.address} onChange={(v) => set('contact', 'address', v)} />
        </>
      )}

      {active === 'footer' && (
        <Text label="Footer text" value={config.footer.text} onChange={(v) => set('footer', 'text', v)} />
      )}

      {active === 'theme' && (
        <>
          <div className="text-[12px] font-bold uppercase tracking-wide text-faint">Accent colour</div>
          <div className="mt-1.5 flex items-center gap-2">
            <input type="color" value={config.theme.accent} onChange={(e) => set('theme', 'accent', e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-line" />
            <input className="c-input" value={config.theme.accent} onChange={(e) => set('theme', 'accent', e.target.value)} />
          </div>
          <div className="mt-4 text-[12px] font-bold uppercase tracking-wide text-faint">Hero background</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['mint', 'navy', 'plain'] as const).map((bg) => (
              <button key={bg} onClick={() => set('theme', 'heroBg', bg)} className={`rounded-md border py-2 text-[12px] font-bold capitalize ${config.theme.heroBg === bg ? 'border-green bg-green-soft text-green' : 'border-line text-muted'}`}>{bg}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <input className="c-input mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-4">
      <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">{label}</label>
      <textarea className="c-input mt-1.5" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-[13px] font-semibold text-navy">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green' : 'bg-line'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-card transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
