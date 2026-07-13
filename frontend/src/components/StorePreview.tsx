'use client';
import { useEffect, useState } from 'react';
import { StoreConfig, StorePage, HERO_BG, FONT_CLASS, isVideo } from '@/lib/store-config';
import { SizeStrip } from '@/components/sizes';
import { Search, Heart, Bag, ShieldLock, Truck, Star } from '@/components/icons';

const rupees = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

// Filter the product grid by the selected tab label (Featured / On Sale / Latest / …).
function filterByTab(products: any[], tab: string): any[] {
  const t = (tab || '').toLowerCase();
  if (t.includes('sale') || t.includes('deal') || t.includes('off')) return products.filter((p) => p.mrp && p.mrp > p.price);
  if (t.includes('latest') || t.includes('new')) return [...products].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  if (t.includes('best')) return [...products].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0)); // lowest stock ≈ best-selling proxy
  return products; // Featured / All
}

function firstImage(p: any): string | null {
  try {
    if (Array.isArray(p.images)) return p.images[0] || null;
    if (typeof p.images === 'string') return JSON.parse(p.images)[0] || null;
  } catch { /* ignore */ }
  return p.image || null;
}

const POLICY_ICONS = [<ShieldLock key="0" size={20} />, <Truck key="1" size={20} />, <Star key="2" size={20} />];

/**
 * Renders a storefront from a StoreConfig. Used live in the editor preview and
 * on the public /s/[username] page. `interactive=false` disables tab clicks for
 * the editor preview.
 */
export default function StorePreview({
  config, products = [], storeName, mobile = false, username, page,
}: {
  config: StoreConfig;
  products?: any[];
  storeName: string;
  mobile?: boolean;
  username?: string;        // when set, nav links point at real storefront routes
  page?: StorePage | null;  // when set, render this custom page instead of the home layout
}) {
  const c = config;
  const accent = c.theme.accent;
  const home = username ? `/s/${username}` : '#';
  const pageLinks = (c.pages || []).filter((p) => p.showInNav).map((p) => ({ label: p.title, href: username ? `/s/${username}/${p.slug}` : '#' }));
  const navLinks = [
    ...c.header.nav.map((n) => ({ label: n.label, href: username && (n.href === '#' || n.href === '') ? home : n.href })),
    ...pageLinks,
  ];
  const hasHeroMedia = !!c.hero.imageUrl;
  const fontClass = FONT_CLASS[c.theme.font] || 'font-display';
  // 'accent' hero bg builds a gradient from the store's accent colour.
  const heroBgClass = HERO_BG[c.theme.heroBg] || HERO_BG.mint;
  const heroAccentStyle = c.theme.heroBg === 'accent' && !hasHeroMedia
    ? { background: `linear-gradient(160deg, ${accent}, ${accent}22)`, color: '#fff' }
    : undefined;
  const [tab, setTab] = useState(c.productTabs.tabs[0] || 'Featured');

  return (
    <div className={`bg-paper text-navy ${fontClass}`}>
      {/* announcement */}
      {c.announcement.enabled && c.announcement.text && (
        <div className="bg-navy py-2 text-center text-[12.5px] font-semibold text-white">{c.announcement.text}</div>
      )}

      {/* header */}
      {c.header.enabled && (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/85 px-5 py-3.5 backdrop-blur-md sm:px-8">
          {/* brand: logo mark + name */}
          <a href={home} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl font-display text-[16px] font-extrabold text-white shadow-card" style={{ background: accent }}>
              {storeName.charAt(0).toUpperCase()}
            </span>
            <span className="font-display text-[21px] font-extrabold tracking-tight text-navy">{storeName}</span>
          </a>

          {/* nav with animated underline */}
          <nav className={`items-center gap-7 text-[14px] font-semibold text-navy/70 ${mobile ? 'hidden' : 'hidden md:flex'}`}>
            {navLinks.map((n, i) => (
              <a key={i} href={n.href || '#'} className="group relative cursor-pointer transition-colors hover:text-navy">
                {n.label}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ background: accent }} />
              </a>
            ))}
          </nav>

          {/* action icons in soft pills */}
          <div className="flex items-center gap-1.5">
            {c.header.showSearch && (
              <button className="grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-paper hover:text-navy"><Search size={18} /></button>
            )}
            <button className="grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-paper hover:text-navy"><Heart size={18} /></button>
            <button className="relative grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-paper hover:text-navy">
              <Bag size={18} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white" style={{ background: accent }}>0</span>
            </button>
          </div>
        </header>
      )}

      {/* custom page body — replaces the home layout when a page is selected */}
      {page && <PageBody page={page} accent={accent} />}

      {/* hero */}
      {!page && c.hero.enabled && (
        <section style={heroAccentStyle} className={`relative grid min-h-[420px] place-items-center overflow-hidden px-5 py-16 text-center sm:px-8 ${hasHeroMedia ? 'text-white' : heroAccentStyle ? '' : heroBgClass}`}>
          {hasHeroMedia && (
            <div className="absolute inset-0">
              {isVideo(c.hero.imageUrl)
                ? <video src={c.hero.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${c.hero.focusY ?? 50}%` }} muted loop autoPlay playsInline />
                : <img src={c.hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${c.hero.focusY ?? 50}%` }} />}
              {/* dark gradient so white hero text stays legible over any photo/video */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/45" />
            </div>
          )}
          <div className="relative mx-auto max-w-2xl">
            {c.hero.eyebrow && (
              <p className="text-[14px] font-bold" style={hasHeroMedia ? { color: '#fff' } : { color: accent }}>✨ {c.hero.eyebrow} ✨</p>
            )}
            <h1 className={`mt-3 font-display text-[40px] font-extrabold leading-tight sm:text-[56px] ${hasHeroMedia ? 'drop-shadow' : ''}`}>{c.hero.headline}</h1>
            {c.hero.subtext && <p className={`mx-auto mt-3 max-w-md text-[15px] ${hasHeroMedia ? 'text-white/85' : 'text-muted'}`}>{c.hero.subtext}</p>}
            {c.hero.ctaLabel && (
              <a href="#products" className="mt-6 inline-block rounded-lg px-6 py-3 text-[15px] font-bold text-white shadow-card transition hover:opacity-90" style={{ background: accent }}>
                {c.hero.ctaLabel} 🛍
              </a>
            )}
          </div>
        </section>
      )}

      {/* banner images */}
      {!page && c.banners.enabled && c.banners.images.filter(Boolean).length > 0 && (
        <section className="grid gap-3 px-5 py-6 sm:px-8 md:grid-cols-2">
          {c.banners.images.filter(Boolean).map((src, i) => (
            isVideo(src)
              ? <video key={i} src={src} className="h-48 w-full rounded-lg object-cover" muted loop autoPlay playsInline />
              : <img key={i} src={src} alt="" className="h-48 w-full rounded-lg object-cover" />
          ))}
        </section>
      )}

      {/* product tabs + grid */}
      {!page && c.productTabs.enabled && (
        <section id="products" className="px-5 py-12 sm:px-8">
          <h2 className="text-center font-display text-[30px] font-extrabold">{c.productTabs.heading}</h2>
          {c.productTabs.sub && <p className="mt-1 text-center text-[14px] text-muted">{c.productTabs.sub}</p>}
          <div className="no-sb mt-6 flex justify-start gap-2 overflow-x-auto px-1 sm:flex-wrap sm:justify-center">
            {c.productTabs.tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-[13px] font-bold transition-colors"
                style={tab === t ? { background: accent, color: '#fff' } : { background: '#fff', color: '#5B6577', border: '1px solid #E8E6DE' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={`mx-auto mt-8 grid max-w-5xl gap-4 ${mobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {filterByTab(products, tab).length === 0 ? (
              <p className="col-span-full py-10 text-center text-[13.5px] text-faint">No products in “{tab}” yet.</p>
            ) : (
              filterByTab(products, tab).slice(0, 8).map((p) => (
                <a key={p.id} href={username ? `/s/${username}/product/${p.id}` : undefined} className="block overflow-hidden rounded-lg border border-line bg-white transition hover:shadow-card">
                  <div className="aspect-square bg-green-soft">
                    {firstImage(p) && <img src={firstImage(p)!} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <div className="truncate font-display text-[14px] font-bold">{p.title || p.name}</div>
                    <div className="mt-1 leading-tight">
                      <div className="font-display text-[15px] font-extrabold" style={{ color: accent }}>{rupees(p.price)}</div>
                      {p.mrp && p.mrp > p.price && <div className="text-[12px] text-faint line-through">{rupees(p.mrp)}</div>}
                    </div>
                    {p.sizes?.length > 0 && <div className="mt-2"><SizeStrip sizes={p.sizes} compact /></div>}
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      )}

      {/* policies — sliding carousel on mobile, grid on desktop */}
      {!page && c.policies.enabled && c.policies.items.length > 0 && (
        <section className="bg-white px-5 py-12 sm:px-8">
          <div className={mobile ? 'block' : 'lg:hidden'}>
            <PolicyCarousel items={c.policies.items} accent={accent} />
          </div>
          {!mobile && (
            <div className="mx-auto hidden max-w-5xl gap-4 lg:grid lg:grid-cols-3">
              {c.policies.items.map((p, i) => <PolicyCard key={i} p={p} i={i} accent={accent} />)}
            </div>
          )}
        </section>
      )}

      {/* contact */}
      {!page && c.contact.enabled && (c.contact.email || c.contact.phone || c.contact.address) && (
        <section id="contact" className="px-5 py-12 text-center sm:px-8">
          <h2 className="font-display text-[24px] font-extrabold">Get in touch</h2>
          <div className="mt-3 space-y-1 text-[14px] text-muted">
            {c.contact.email && <div>{c.contact.email}</div>}
            {c.contact.phone && <div>{c.contact.phone}</div>}
            {c.contact.address && <div>{c.contact.address}</div>}
          </div>
        </section>
      )}

      {/* socials */}
      {!page && c.socials.enabled && (c.socials.instagram || c.socials.facebook || c.socials.whatsapp) && (
        <div className="flex justify-center gap-4 pb-6 text-[13px] font-semibold" style={{ color: accent }}>
          {c.socials.instagram && <span>Instagram</span>}
          {c.socials.facebook && <span>Facebook</span>}
          {c.socials.whatsapp && <span>WhatsApp</span>}
        </div>
      )}

      {/* footer */}
      <footer className="border-t border-line bg-white py-6 text-center text-[12.5px] text-faint">
        {c.footer.text}
      </footer>
    </div>
  );
}

/* renders a custom page's content blocks */
function PageBody({ page, accent }: { page: StorePage; accent: string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {page.blocks.length === 0 && <p className="py-8 text-center text-[13px] text-faint">This page is empty — add some content blocks.</p>}
      {page.blocks.map((b) => {
        if (b.type === 'heading') return <h2 key={b.id} className="mt-8 font-display text-[28px] font-extrabold leading-tight first:mt-0">{b.text}</h2>;
        if (b.type === 'text') return <p key={b.id} className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">{b.text}</p>;
        if (b.type === 'image') return b.url ? (
          isVideo(b.url)
            ? <video key={b.id} src={b.url} className="mt-6 w-full rounded-xl" muted loop autoPlay playsInline />
            : <img key={b.id} src={b.url} alt="" className="mt-6 w-full rounded-xl object-cover" />
        ) : null;
        if (b.type === 'button') return (
          <div key={b.id} className="mt-6">
            <a href={b.href || '#'} className="inline-block rounded-lg px-6 py-3 text-[15px] font-bold text-white shadow-card" style={{ background: accent }}>{b.text || 'Button'}</a>
          </div>
        );
        return null;
      })}
    </section>
  );
}

/* a single policy card */
function PolicyCard({ p, i, accent }: { p: { title: string; body: string }; i: number; accent: string }) {
  return (
    <div className="h-full rounded-lg border border-line bg-white p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg" style={{ background: `${accent}1a`, color: accent }}>{POLICY_ICONS[i % 3]}</span>
      <div className="mt-3 font-display text-[15px] font-bold">{p.title}</div>
      <p className="mt-1 text-[13px] text-muted">{p.body}</p>
    </div>
  );
}

/* auto-advancing horizontal carousel — one card slides to the next */
function PolicyCarousel({ items, accent }: { items: { title: string; body: string }[]; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  return (
    <div className="mx-auto max-w-sm" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((p, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              <PolicyCard p={p} i={i} accent={accent} />
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: idx === i ? 20 : 8, background: accent, opacity: idx === i ? 1 : 0.35 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
