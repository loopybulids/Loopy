'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { storeUrl } from '@/lib/store-url';
import { StoreConfig, StorePage, PageBlockType, SECTION_ORDER, TEMPLATES, withDefaults, HERO_BG_OPTIONS, FONT_OPTIONS, blankPage, blankBlock, slugify } from '@/lib/store-config';

const ACCENT_PRESETS = ['#15784A', '#0E2A47', '#7C3AED', '#DB2777', '#EA580C', '#0891B2', '#CA8A04', '#E11D48'];
import StorePreview from '@/components/StorePreview';
import MediaInput from '@/components/MediaInput';
import { Check } from '@/components/icons';

type SectionKey = (typeof SECTION_ORDER)[number]['key'];
type LeftTab = 'themes' | 'sections' | 'styles';

export default function StoreEditor() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('Your Store');
  const [username, setUsername] = useState('');
  const [active, setActive] = useState<SectionKey>('hero');
  const [leftTab, setLeftTab] = useState<LeftTab>('sections');
  const [pageId, setPageId] = useState<string | null>(null); // which custom page is open in the Pages editor
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishErr, setPublishErr] = useState('');

  // undo / redo history
  const hist = useRef<{ past: StoreConfig[]; future: StoreConfig[] }>({ past: [], future: [] });
  const prevCfg = useRef<StoreConfig | null>(null);
  const skipHist = useRef(false);
  const [, bumpHist] = useState(0);
  useEffect(() => {
    if (!config) return;
    if (skipHist.current) { skipHist.current = false; prevCfg.current = config; return; }
    if (prevCfg.current && prevCfg.current !== config) {
      hist.current.past.push(prevCfg.current);
      if (hist.current.past.length > 60) hist.current.past.shift();
      hist.current.future = [];
    }
    prevCfg.current = config;
    bumpHist((v) => v + 1);
  }, [config]);
  const undo = () => {
    const h = hist.current;
    if (!h.past.length || !config) return;
    skipHist.current = true; h.future.push(config);
    const prev = h.past.pop()!; prevCfg.current = prev; setConfig(prev); bumpHist((v) => v + 1);
  };
  const redo = () => {
    const h = hist.current;
    if (!h.future.length || !config) return;
    skipHist.current = true; h.past.push(config);
    const nxt = h.future.pop()!; prevCfg.current = nxt; setConfig(nxt); bumpHist((v) => v + 1);
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number]) =>
    setConfig((c) => (c ? { ...c, theme: { ...c.theme, accent: t.accent, font: t.font, heroBg: t.heroBg } } : c));
  const activeTemplate = TEMPLATES.find((t) => config?.theme.accent === t.accent && config?.theme.font === t.font && config?.theme.heroBg === t.heroBg);

  // Logo already persisted on the server — lets Preview skip re-uploading a
  // multi-hundred-KB base64 data URI when nothing about it changed.
  const savedLogo = useRef<string | null>(null);

  /**
   * Autosave.
   *
   * The editor previously wrote to the server only when you hit Preview or
   * Publish; every other edit lived in local state and a localStorage draft
   * that `load()` never read back. So removing your logo, then reloading,
   * restored it from the server — the removal had never been saved anywhere
   * that survived a refresh.
   *
   * `lastSaved` holds the serialised config as the server has it, so an edit
   * that changes nothing costs no request. The delay matters: this payload
   * carries base64 images, so saving on every keystroke would be expensive.
   */
  const lastSaved = useRef<string | null>(null);
  const [autoSave, setAutoSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    Promise.all([api.myProfile().catch(() => null), api.myProducts().catch(() => [])]).then(([p, prods]) => {
      const name = p?.storeName || 'Your Store';
      setStoreName(name);
      setUsername(p?.username || '');
      const parsed = typeof p?.storeConfig === 'string' ? safeParse(p.storeConfig) : p?.storeConfig;
      const initial = withDefaults(name, parsed, p?.logoUrl);
      setConfig(initial);
      setProducts(prods || []);
      savedLogo.current = p?.logoUrl || null;
      // Baseline for the autosave comparison — nothing to save until this changes.
      lastSaved.current = JSON.stringify(initial);
    });
  }, []);

  // generic deep-ish setter for a section field
  const set = (section: keyof StoreConfig, field: string, value: any) =>
    setConfig((c) => (c ? { ...c, [section]: { ...(c as any)[section], [field]: value } } : c));

  useEffect(() => {
    if (config && username) {
      try { localStorage.setItem(`loopy_draft_${username}`, JSON.stringify(config)); } catch { /* ignore */ }
    }
  }, [config, username]);

  // Persist edits to the server shortly after you stop making them, so a
  // refresh shows what's on screen rather than what was last published.
  useEffect(() => {
    if (!config || lastSaved.current === null) return;
    const serialised = JSON.stringify(config);
    if (serialised === lastSaved.current) return;

    setAutoSave('saving');
    const t = setTimeout(async () => {
      try {
        await api.updateStoreConfig(config);

        // Keep the store's avatar (Seller.logoUrl) in step, including when it
        // has been cleared — this is the other half of the removal bug.
        const logo = config.header?.logoUrl ?? '';
        if (logo !== (savedLogo.current ?? '')) {
          savedLogo.current = logo;
          await api.updateProfile({ logoUrl: logo || null }).catch(() => {});
        }

        lastSaved.current = serialised;
        setAutoSave('saved');
      } catch {
        setAutoSave('error');
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [config]);

  /**
   * Open the preview tab *synchronously*, then save in the background.
   *
   * Two reasons this must not await first: the tab has to be opened inside the
   * click's own call stack or popup blockers kill it, and waiting on two Neon
   * round trips (one of them re-uploading a base64 logo) made the button feel
   * dead for seconds.
   *
   * Nothing is lost by not waiting — `?preview=1` makes the storefront read the
   * draft out of localStorage, which is already written on every edit.
   */
  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (config && username) {
      try { localStorage.setItem(`loopy_draft_${username}`, JSON.stringify(config)); } catch { /* ignore */ }
    }
    // Opens the seller's own address when a wildcard domain is configured.
    window.open(storeUrl(username, '?preview=1'), '_blank');

    if (!config) return;
    // Persist in the background so a reload of the preview still shows this design.
    api.updateStoreConfig(config).catch(() => {});
    // Sync the brand logo in both directions. The old condition required a
    // truthy value, so clearing the logo never reached the profile and the
    // storefront avatar kept showing the removed image.
    const logo = config.header?.logoUrl ?? '';
    if (logo !== (savedLogo.current ?? '')) {
      const previous = savedLogo.current;
      savedLogo.current = logo;
      api.updateProfile({ logoUrl: logo || null }).catch(() => { savedLogo.current = previous; });
    }
  };

  const publish = async () => {
    if (!config) return;
    setSaving(true); setSaved(false); setPublishErr('');
    try {
      await api.updateStoreConfig(config); // always save the design
      // keep the store's brand logo/avatar (Seller.logoUrl) in sync with the header logo
      await api.updateProfile({ logoUrl: config.header.logoUrl || null }).catch(() => {});
      // gate going LIVE on shipping + payout being configured
      const p = await api.myProfile().catch(() => null);
      const hasShipping = p?.shippingFee !== null && p?.shippingFee !== undefined;
      const hasPayout = !!(p?.payoutUpi || p?.payoutAccount);
      if (!hasShipping || !hasPayout) {
        const missing = [!hasShipping && 'shipping', !hasPayout && 'payout'].filter(Boolean).join(' & ');
        setPublishErr(`Design saved. Add your ${missing} details to make your store live.`);
        return;
      }
      await api.updateProfile({ published: true });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    }
    catch { setPublishErr('Could not publish — please try again.'); }
    finally { setSaving(false); }
  };

  /**
   * The viewport each mode is pretending to be.
   *
   * The preview used to render at whatever width the middle pane happened to
   * be — about 500px — so "Desktop" showed a desktop layout squeezed into a
   * tablet: nav items wrapping onto two lines, a hero the wrong shape. It now
   * renders at a real desktop width and is scaled down to fit, which is what
   * the seller's shoppers will actually see.
   */
  const frameWidth = device === 'mobile' ? 390 : 1280;

  if (!config) return <p className="py-10 text-center text-[13px] text-faint">Loading store editor…</p>;

  const tabs: [LeftTab, string, JSX.Element][] = [
    ['themes', 'Themes', <ISparkle key="t" />],
    ['sections', 'Sections', <ILayers key="s" />],
    ['styles', 'Styles', <IPalette key="y" />],
  ];

  return (
    <div className="-mx-5 -my-6 flex flex-col sm:-mx-8 sm:-my-8 lg:h-[calc(100vh-69px)]">
      {/* toolbar */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-4 py-1.5 sm:px-6">
        {/* No heading here — the console topbar already says "Store Editor". */}
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-paper p-0.5 text-[12px] font-semibold">
          {(['desktop', 'mobile'] as const).map((d) => (
            <button key={d} onClick={() => setDevice(d)} className={`rounded-md px-2.5 py-1 capitalize transition-colors ${device === d ? 'bg-white text-navy shadow-sm' : 'text-faint hover:text-navy'}`}>{d}</button>
          ))}
        </div>
        {username
          ? <button onClick={handlePreview} className="flex items-center gap-1 text-[12.5px] font-semibold text-muted transition-colors hover:text-navy">Preview <IExternal /></button>
          : <Link href="/seller/settings" className="flex items-center gap-1 text-[12.5px] font-semibold text-amber transition-colors hover:text-navy">Set a handle to preview <IExternal /></Link>}
        <div className="flex items-center gap-0.5">
          <button onClick={undo} disabled={!hist.current.past.length} className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-paper hover:text-navy disabled:opacity-25" title="Undo"><IUndo /></button>
          <button onClick={redo} disabled={!hist.current.future.length} className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-paper hover:text-navy disabled:opacity-25" title="Redo"><IRedo /></button>
        </div>
        {/* Autosave is invisible work; say so, or "Publish" looks like the only
            thing that keeps a change. */}
        <span className="mr-1 min-w-[68px] text-right text-[11.5px] text-faint">
          {autoSave === 'saving' ? 'Saving…'
            : autoSave === 'saved' ? 'Changes saved'
            : autoSave === 'error' ? <span className="text-rose">Not saved</span>
            : ''}
        </span>
        <button onClick={publish} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-green px-3.5 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-60">
          {saving ? 'Publishing…' : saved ? <><Check size={14} /> Published</> : <><ISend /> Publish</>}
        </button>
      </div>

      {publishErr && (
        <div className="flex items-center gap-2 border-b border-amber/30 bg-amber-soft px-4 py-2 text-[12.5px] font-semibold text-navy/80 sm:px-6">
          ⚠️ {publishErr}
          <Link href="/seller/shipping" className="ml-auto rounded-md bg-white px-2.5 py-1 text-[11.5px] font-bold text-navy hover:bg-paper">Shipping</Link>
          <Link href="/seller/payments" className="rounded-md bg-white px-2.5 py-1 text-[11.5px] font-bold text-navy hover:bg-paper">Payments</Link>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left panel with tabs */}
        <aside className="order-1 w-full shrink-0 border-b border-line bg-white lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <div className="grid grid-cols-3 border-b border-line">
            {tabs.map(([key, label, icon]) => (
              <button key={key} onClick={() => setLeftTab(key)} className={`flex flex-col items-center gap-1 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors ${leftTab === key ? 'border-b-2 border-navy text-navy' : 'text-faint hover:text-muted'}`}>
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="p-3">
            {leftTab === 'themes' && (
              <>
                <div className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Choose a design</div>
                <div className="space-y-2.5">
                  {TEMPLATES.map((t) => {
                    const on = activeTemplate?.key === t.key;
                    return (
                      <button key={t.key} onClick={() => applyTemplate(t)} className={`w-full rounded-xl border p-3 text-left transition ${on ? 'border-violet-500 ring-2 ring-violet-200' : 'border-line hover:border-navy/30'}`}>
                        <div className="mb-2 grid h-14 place-items-center rounded-lg text-2xl" style={{ background: `linear-gradient(135deg, ${t.accent}20, ${t.accent}06)` }}>{t.emoji}</div>
                        <div className="flex items-center justify-between"><span className="font-display text-[14px] font-bold text-navy">{t.label}</span>{on && <Check size={15} className="text-violet-600" />}</div>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {leftTab === 'sections' && (
              <>
                <div className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Page sections</div>
                {SECTION_ORDER.filter((s) => s.key !== 'theme').map((s) => {
                  const on = active === s.key;
                  const sec = (config as any)[s.key];
                  const toggleable = s.key !== 'footer' && s.key !== 'pages' && 'enabled' in (sec || {});
                  return (
                    <div key={s.key} className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold ${on ? 'bg-green-soft text-green' : 'text-navy/70 hover:bg-paper'}`}>
                      <button onClick={() => setActive(s.key)} className="flex-1 text-left">{s.label}</button>
                      {toggleable && (
                        <button onClick={() => set(s.key as keyof StoreConfig, 'enabled', !sec.enabled)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${sec.enabled ? 'bg-green' : 'bg-line'}`} title={sec.enabled ? 'Visible' : 'Hidden'}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${sec.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {leftTab === 'styles' && (
              <Fields active="theme" config={config} set={set} setConfig={setConfig} storeName={storeName} pageId={pageId} setPageId={setPageId} />
            )}
          </div>
        </aside>

        {/* live preview — rendered at device size, scaled to fit the pane */}
        <main className="order-3 min-w-0 flex-1 bg-paper p-4 lg:order-2 lg:overflow-y-auto">
          <DevicePreview width={frameWidth} label={device === 'mobile' ? '390 × mobile' : '1280 × desktop'}>
            <StorePreview
              config={config}
              products={products}
              storeName={storeName}
              mobile={device === 'mobile'}
              page={active === 'pages' && pageId ? (config.pages || []).find((p) => p.id === pageId) : null}
            />
          </DevicePreview>
        </main>

        {/* field editor — only when editing a section */}
        {leftTab === 'sections' && (
          <aside className="order-2 w-full shrink-0 border-t border-line bg-white p-5 lg:order-3 lg:w-80 lg:border-t-0 lg:border-l lg:overflow-y-auto">
            <Fields active={active} config={config} set={set} setConfig={setConfig} storeName={storeName} pageId={pageId} setPageId={setPageId} />
          </aside>
        )}
      </div>
    </div>
  );
}

/* small toolbar / tab icons */
const IExternal = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></svg>;
const IUndo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></svg>;
const IRedo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h4" /></svg>;
const ISend = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
const ISparkle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2Z" /></svg>;
const ILayers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
const IPalette = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" /></svg>;

function safeParse(s: string) { try { return JSON.parse(s); } catch { return null; } }

/* ───── per-section field editors ───── */
/**
 * Renders its children at a fixed pixel width, then scales the whole thing
 * down to fit the space available.
 *
 * A preview that reflows to the pane's width isn't a preview — it shows a
 * layout nobody will ever see. Scaling keeps every breakpoint, font size and
 * column count exactly as a visitor gets them, just smaller.
 *
 * The height has to be measured and scaled too, or the scaled content either
 * leaves a gap beneath it or overflows the scroll container.
 */
function DevicePreview({ width, label, children }: { width: number; label: string; children: React.ReactNode }) {
  const pane = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const available = pane.current?.clientWidth ?? width;
      // Never scale up — a 390px mobile frame in a wide pane stays 390px.
      const s = Math.min(1, available / width);
      setScale(s);
      setHeight((frame.current?.offsetHeight ?? 0) * s);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (pane.current) ro.observe(pane.current);
    if (frame.current) ro.observe(frame.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={pane} className="mx-auto">
      <div className="mb-1.5 text-center font-num text-[10.5px] text-faint">{label}</div>
      <div
        className="mx-auto overflow-hidden rounded-lg border border-line bg-white shadow-card"
        style={{ width: width * scale, height: height || undefined }}
      >
        <div
          ref={frame}
          style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Fields({ active, config, set, setConfig, storeName, pageId, setPageId }: {
  active: SectionKey;
  config: StoreConfig;
  set: (section: keyof StoreConfig, field: string, value: any) => void;
  setConfig: React.Dispatch<React.SetStateAction<StoreConfig | null>>;
  storeName: string;
  pageId: string | null;
  setPageId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const label = SECTION_ORDER.find((s) => s.key === active)?.label;
  return (
    <div>
      <h2 className="mb-4 font-display text-[15px] font-bold text-navy">{label}</h2>

      {active === 'announcement' && (
        <Text label="Announcement text" value={config.announcement.text} onChange={(v) => set('announcement', 'text', v)} />
      )}

      {active === 'header' && (
        <>
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Store logo</label>
          <div className="mt-1.5"><MediaInput value={config.header.logoUrl || ''} onChange={(v) => set('header', 'logoUrl', v)} /></div>
          <p className="mb-4 mt-1 text-[11px] text-faint">Your store logo — shown in the storefront header and as your store avatar. Upload an image or paste a URL. Leave empty to use the first letter of your store name.</p>
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

      {active === 'collections' && (
        <>
          <Text
            label="Heading above the rows"
            value={config.collections.heading}
            onChange={(v) => set('collections', 'heading', v)}
          />

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Products per row</label>
          <select
            value={config.collections.perRow}
            onChange={(e) => set('collections', 'perRow', Number(e.target.value))}
            className="c-input mt-1.5"
          >
            <option value={3}>3 across</option>
            <option value={4}>4 across</option>
          </select>

          {/* The collections themselves are managed elsewhere — this section
              only controls how they're presented. */}
          <p className="mt-3 rounded-lg border border-line bg-paper/60 p-3 text-[12.5px] leading-relaxed text-muted">
            Build your collections in{' '}
            <a href="/seller/collections" className="font-semibold text-green-600 underline decoration-line">Collections</a>
            . Every published one appears here, in the order you arranged them.
          </p>
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

      {active === 'pages' && <PagesEditor config={config} setConfig={setConfig} openId={pageId} setOpenId={setPageId} />}

      {active === 'theme' && (
        <>
          <div className="text-[12px] font-bold uppercase tracking-wide text-faint">Accent colour</div>
          <div className="mt-1.5 flex items-center gap-2">
            <input type="color" value={config.theme.accent} onChange={(e) => set('theme', 'accent', e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-line" />
            <input className="c-input" value={config.theme.accent} onChange={(e) => set('theme', 'accent', e.target.value)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACCENT_PRESETS.map((hex) => (
              <button key={hex} onClick={() => set('theme', 'accent', hex)} className="h-7 w-7 rounded-full ring-2 ring-white shadow-card" style={{ background: hex }} title={hex} />
            ))}
          </div>

          <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-faint">Hero background</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {HERO_BG_OPTIONS.map((bg) => (
              <button key={bg.key} onClick={() => set('theme', 'heroBg', bg.key)} className={`flex items-center gap-1.5 rounded-md border px-2 py-2 text-[12px] font-bold ${config.theme.heroBg === bg.key ? 'border-green bg-green-soft text-green' : 'border-line text-muted'}`}>
                <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: bg.key === 'accent' ? config.theme.accent : bg.swatch }} />
                {bg.label}
              </button>
            ))}
          </div>

          <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-faint">Font style</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {FONT_OPTIONS.map((ft) => (
              <button key={ft.key} onClick={() => set('theme', 'font', ft.key)} className={`rounded-md border py-2.5 text-[15px] font-extrabold ${ft.className} ${config.theme.font === ft.key ? 'border-green bg-green-soft text-green' : 'border-line text-navy'}`}>
                {ft.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───── custom pages manager ───── */
const BLOCK_TYPES: { type: PageBlockType; label: string }[] = [
  { type: 'heading', label: '+ Heading' },
  { type: 'text', label: '+ Text' },
  { type: 'image', label: '+ Image / Video' },
  { type: 'button', label: '+ Button' },
];

function PagesEditor({ config, setConfig, openId, setOpenId }: {
  config: StoreConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoreConfig | null>>;
  openId: string | null;
  setOpenId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const pages = config.pages || [];
  const setPages = (next: StorePage[]) => setConfig((c) => (c ? { ...c, pages: next } : c));
  const patchPage = (id: string, patch: Partial<StorePage>) => setPages(pages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const open = pages.find((p) => p.id === openId) || null;

  // editing one page's content blocks
  if (open) {
    const setBlocks = (blocks: typeof open.blocks) => patchPage(open.id, { blocks });
    const move = (i: number, dir: -1 | 1) => {
      const j = i + dir; if (j < 0 || j >= open.blocks.length) return;
      const b = [...open.blocks];[b[i], b[j]] = [b[j], b[i]]; setBlocks(b);
    };
    return (
      <div>
        <button onClick={() => setOpenId(null)} className="mb-3 text-[13px] font-semibold text-muted hover:text-navy">← All pages</button>
        <Text label="Page title" value={open.title} onChange={(v) => patchPage(open.id, { title: v, slug: slugify(v) })} />
        <div className="mt-3">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">URL slug</label>
          <input className="c-input mt-1.5" value={open.slug} onChange={(e) => patchPage(open.id, { slug: slugify(e.target.value) })} />
          <p className="mt-1 text-[11px] text-faint">/s/yourstore/<b>{open.slug}</b></p>
        </div>
        <div className="mt-3"><Toggle label="Show in navigation" value={open.showInNav} onChange={(v) => patchPage(open.id, { showInNav: v })} /></div>

        <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-faint">Content blocks</div>
        <div className="mt-2 space-y-3">
          {open.blocks.map((b, i) => (
            <div key={b.id} className="rounded-lg border border-line p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-faint capitalize">{b.type}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} className="px-1 text-muted hover:text-navy" title="Move up">↑</button>
                  <button onClick={() => move(i, 1)} className="px-1 text-muted hover:text-navy" title="Move down">↓</button>
                  <button onClick={() => setBlocks(open.blocks.filter((x) => x.id !== b.id))} className="px-1 text-rose" title="Remove">✕</button>
                </div>
              </div>
              {b.type === 'heading' && <input className="c-input" value={b.text || ''} onChange={(e) => setBlocks(open.blocks.map((x) => x.id === b.id ? { ...x, text: e.target.value } : x))} />}
              {b.type === 'text' && <textarea className="c-input" rows={4} value={b.text || ''} onChange={(e) => setBlocks(open.blocks.map((x) => x.id === b.id ? { ...x, text: e.target.value } : x))} />}
              {b.type === 'image' && <MediaInput value={b.url || ''} onChange={(v) => setBlocks(open.blocks.map((x) => x.id === b.id ? { ...x, url: v } : x))} />}
              {b.type === 'button' && (
                <div className="space-y-2">
                  <input className="c-input" placeholder="Button label" value={b.text || ''} onChange={(e) => setBlocks(open.blocks.map((x) => x.id === b.id ? { ...x, text: e.target.value } : x))} />
                  <input className="c-input" placeholder="Link (https://… or #products)" value={b.href || ''} onChange={(e) => setBlocks(open.blocks.map((x) => x.id === b.id ? { ...x, href: e.target.value } : x))} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} onClick={() => setBlocks([...open.blocks, blankBlock(bt.type)])} className="btn-ghost py-2 text-[12.5px]">{bt.label}</button>
          ))}
        </div>
      </div>
    );
  }

  // list of pages
  return (
    <div>
      <p className="text-[12.5px] text-muted">Add extra pages like About, Lookbook or FAQ. Pages set to “show in nav” appear in your storefront menu.</p>
      <div className="mt-3 space-y-2">
        {pages.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-line p-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold text-navy">{p.title}</div>
              <div className="truncate text-[11px] text-faint">/{p.slug} · {p.blocks.length} block{p.blocks.length === 1 ? '' : 's'}{p.showInNav ? ' · in nav' : ''}</div>
            </div>
            <button onClick={() => setOpenId(p.id)} className="rounded-md bg-paper px-2.5 py-1.5 text-[12px] font-bold text-navy hover:bg-green-soft">Edit</button>
            <button onClick={() => setPages(pages.filter((x) => x.id !== p.id))} className="rounded-md px-1.5 text-rose" title="Delete">✕</button>
          </div>
        ))}
        {!pages.length && <div className="rounded-lg border border-dashed border-line py-6 text-center text-[12.5px] text-faint">No custom pages yet.</div>}
      </div>
      <button onClick={() => { const np = blankPage(); setPages([...pages, np]); setOpenId(np.id); }} className="btn-green mt-3 w-full py-2.5 text-[13px]">+ Add page</button>
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
