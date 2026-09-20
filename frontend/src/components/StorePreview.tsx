'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreConfig, StorePage, HERO_BG, FONT_CLASS, isVideo, safeHref } from '@/lib/store-config';
import { SizeStrip } from '@/components/sizes';
import AutoImages from '@/components/AutoImages';
import StoreAccountControls from '@/components/store/StoreAccountControls';
import { Search, ShieldLock, Truck, Star } from '@/components/icons';
import { storeHref } from '@/lib/store-url';

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
  config, products = [], storeName, mobile = false, username, page, reviews = [], collections = [],
  catalog = false, children,
}: {
  config: StoreConfig;
  products?: any[];
  storeName: string;
  mobile?: boolean;
  username?: string;        // when set, nav links point at real storefront routes
  page?: StorePage | null;  // when set, render this custom page instead of the home layout
  /**
   * Render `children` between the header and footer instead of the home
   * layout — how the All Products page borrows this store's design.
   *
   * It takes children rather than rendering the catalogue itself so that the
   * catalogue can reuse ProductCard from this file without the two importing
   * each other.
   */
  catalog?: boolean;
  children?: ReactNode;
  /**
   * Visible reviews for this store. The API filters hidden ones out before
   * they reach here, so anything in this list is meant to be public.
   */
  reviews?: any[];
  /**
   * Published collections: { title, slug, description, productIds }.
   * Products are resolved against the `products` array rather than repeated,
   * so a product in three collections is still sent once.
   */
  collections?: any[];
}) {
  const [overrideConfig, setOverrideConfig] = useState<StoreConfig | null>(null);

  // Sync draft edits live between editor and preview tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !username) return;
    const syncDraft = () => {
      try {
        const raw = localStorage.getItem(`loopy_draft_${username}`);
        if (raw) setOverrideConfig(JSON.parse(raw));
      } catch { /* ignore */ }
    };
    if (window.location.search.includes('preview=1')) syncDraft();
    window.addEventListener('storage', syncDraft);
    return () => window.removeEventListener('storage', syncDraft);
  }, [username]);

  const c = overrideConfig || config;
  const accent = c.theme.accent;
  const home = username ? storeHref(username) : '#';
  const pageLinks = (c.pages || []).filter((p) => p.showInNav).map((p) => ({ label: p.title, href: username ? storeHref(username, `/${p.slug}`) : '#' }));
  const navLinks = [
    ...c.header.nav.map((n) => {
      let href = n.href;
      if (username && (href === '#' || href === '')) href = home;
      /*
       * "All Products" shipped as an anchor to the featured strip, which shows
       * eight. Every store saved before the catalogue existed still has that
       * anchor, so it is mapped here rather than migrated: a link promising
       * all products should not stop at eight.
       */
      else if (href === '#products') href = username ? storeHref(username, '/products') : '#';
      // Internal store routes ("/orders", "/products") → this store's real URL.
      else if (username && href.startsWith('/')) href = storeHref(username, href);
      return { label: n.label, href };
    }),
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
  const [menu, setMenu] = useState(false);
  // The home layout: everything except a custom page or the catalogue, both of
  // which keep only this store's header and footer.
  const showHome = !page && !catalog;

  return (
    <div className={`bg-paper text-navy ${fontClass}`}>
      {/* header */}
      {c.header.enabled && (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/85 px-5 py-3.5 backdrop-blur-md sm:px-8">
          {/* brand: logo mark + name */}
          <Link href={home} className="flex items-center gap-2.5">
            {c.header.logoUrl
              ? <img src={c.header.logoUrl} alt={storeName} className="h-9 w-9 rounded-xl object-cover shadow-card" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
              : null}
            {!c.header.logoUrl && (
              <span className="grid h-9 w-9 place-items-center rounded-xl font-display text-[16px] font-bold text-white shadow-card" style={{ background: accent }}>{(storeName || 'S').charAt(0).toUpperCase()}</span>
            )}
            <span className="font-display text-[21px] font-bold tracking-tight text-navy">{storeName}</span>
          </Link>

          {/* nav with animated underline */}
          <nav className={`items-center gap-7 text-[14px] font-semibold text-navy/70 ${mobile ? 'hidden' : 'hidden md:flex'}`}>
            {navLinks.map((n, i) => (
              <Link key={i} href={safeHref(n.href)} className="group relative cursor-pointer transition-colors hover:text-navy">
                {n.label}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ background: accent }} />
              </Link>
            ))}
          </nav>

          {/* action icons in soft pills */}
          <div className="flex items-center gap-1.5">
            {c.header.showSearch && (
              <button className="grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-paper hover:text-navy"><Search size={18} /></button>
            )}
            <StoreAccountControls username={username} storeName={storeName} accent={accent} />

            {/*
              The nav, for narrow screens.

              Below `md` the links were simply hidden and nothing replaced
              them, so a shop on a phone — which is most of them, since these
              are shared from Instagram — had no way to reach All Products,
              Track Order or Contact at all.
            */}
            {navLinks.length > 0 && (
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-label={menu ? 'Close menu' : 'Open menu'}
                aria-expanded={menu}
                className={`grid h-9 w-9 place-items-center rounded-full text-navy/65 transition-colors hover:bg-paper hover:text-navy ${mobile ? '' : 'md:hidden'}`}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            )}
          </div>

          {menu && (
            <div className={`absolute inset-x-0 top-full border-b border-line bg-white shadow-card ${mobile ? '' : 'md:hidden'}`}>
              <nav className="flex flex-col px-5 sm:px-8">
                {navLinks.map((n, i) => (
                  <Link
                    key={i}
                    href={safeHref(n.href)}
                    onClick={() => setMenu(false)}
                    className="border-b border-line/70 py-3.5 text-[14.5px] font-semibold text-navy/80 transition-colors last:border-0 hover:text-navy"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>
      )}

      {/* custom page body — replaces the home layout when a page is selected */}
      {page && <PageBody page={page} accent={accent} />}
      {catalog && children}

      {/* hero */}
      {showHome && c.hero.enabled && (
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
            <h1 className={`mt-3 font-display text-[40px] font-bold leading-tight sm:text-[56px] ${hasHeroMedia ? 'drop-shadow' : ''}`}>{c.hero.headline}</h1>
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
      {showHome && c.banners.enabled && c.banners.images.filter(Boolean).length > 0 && (
        <section className="grid gap-3 px-5 py-6 sm:px-8 md:grid-cols-2">
          {c.banners.images.filter(Boolean).map((src, i) => (
            isVideo(src)
              ? <video key={i} src={src} className="h-48 w-full rounded-lg object-cover" muted loop autoPlay playsInline />
              : <img key={i} src={src} alt="" className="h-48 w-full rounded-lg object-cover" />
          ))}
        </section>
      )}

      {/* product tabs + grid */}
      {showHome && c.productTabs.enabled && (
        <section id="products" className="px-5 py-12 sm:px-8">
          <h2 className="text-center font-display text-[30px] font-bold">{c.productTabs.heading}</h2>
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

          {/*
            A teaser, not the catalogue. Eight keeps the home page scannable;
            the button below is how a shopper reaches the rest — without it,
            a seller's ninth product onwards was unreachable from here.
          */}
          {(() => {
            const matching = filterByTab(products, tab);
            return (
              <>
                <div className={`mx-auto mt-8 grid max-w-5xl gap-4 ${mobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                  {matching.length === 0 ? (
                    <p className="col-span-full py-10 text-center text-[13.5px] text-faint">No products in “{tab}” yet.</p>
                  ) : (
                    matching.slice(0, 8).map((p) => (
                      <ProductCard key={p.id} p={p} username={username} accent={accent} />
                    ))
                  )}
                </div>
                {products.length > 0 && (
                  <div className="mt-8 text-center">
                    <Link
                      href={username ? storeHref(username, '/products') : '#'}
                      className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-[14px] font-bold transition hover:opacity-80"
                      style={{ borderColor: accent, color: accent }}
                    >
                      {matching.length > 8 ? `View all ${products.length} products` : 'Browse all products'} →
                    </Link>
                  </div>
                )}
              </>
            );
          })()}
        </section>
      )}

      {/* policies — sliding carousel on mobile, grid on desktop */}
      {showHome && c.policies.enabled && c.policies.items.length > 0 && (
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

      {/* collections — curated rows the seller arranged in /seller/collections */}
      {showHome && c.collections?.enabled && collections.length > 0 && (
        <section className="px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-6xl">
            {c.collections.heading && (
              <h2 className="font-display text-[24px] font-bold">{c.collections.heading}</h2>
            )}

            <div className="mt-6 space-y-9">
              {collections.map((col) => {
                // Resolve ids against the catalogue, preserving the seller's order.
                const byId = new Map(products.map((p: any) => [p.id, p]));
                const items = (col.productIds || [])
                  .map((id: string) => byId.get(id))
                  .filter(Boolean)
                  .slice(0, (c.collections.perRow || 4) * 2);
                if (!items.length) return null;

                return (
                  <div key={col.id || col.slug}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="font-display text-[18px] font-bold">{col.title}</h3>
                        {col.description && (
                          <p className="mt-0.5 text-[13px] text-muted">{col.description}</p>
                        )}
                      </div>
                      <span className="text-[12px] text-muted">
                        {items.length} item{items.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div
                      className={`mt-3.5 grid gap-4 ${
                        mobile
                          ? 'grid-cols-2'
                          : (c.collections.perRow || 4) >= 4
                            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                            : 'grid-cols-2 sm:grid-cols-3'
                      }`}
                    >
                      {items.map((p: any) => (
                        <ProductCard key={p.id} p={p} username={username} accent={accent} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* what buyers said — only reviews the seller has left visible reach here */}
      {showHome && reviews.length > 0 && (
        <section className="bg-white px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[24px] font-bold">What buyers say</h2>
              <span className="text-[13px] text-muted">
                {(() => {
                  const avg = Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10;
                  return `${avg}★ from ${reviews.length} review${reviews.length === 1 ? '' : 's'}`;
                })()}
              </span>
            </div>

            <div className={`mt-5 grid gap-4 ${mobile ? '' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {reviews.slice(0, mobile ? 3 : 6).map((r) => (
                <div key={r.id} className="rounded-2xl border border-black/[0.06] bg-[#FAFAF7] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] tracking-[1px]" style={{ color: accent }}>
                      {'★'.repeat(r.rating)}
                      <span className="opacity-25">{'★'.repeat(5 - r.rating)}</span>
                    </span>
                    <span className="text-[11px] text-muted">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {r.comment && <p className="mt-2 text-[13.5px] leading-relaxed">{r.comment}</p>}
                  <div className="mt-2 text-[12px] font-semibold text-muted">{r.buyerName}</div>

                  {r.response && (
                    <div className="mt-2.5 rounded-xl bg-white p-2.5">
                      <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">
                        {storeName} replied
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed">{r.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* contact */}
      {showHome && c.contact.enabled && (c.contact.email || c.contact.phone || c.contact.address) && (
        <section id="contact" className="px-5 py-12 text-center sm:px-8">
          <h2 className="font-display text-[24px] font-bold">Get in touch</h2>
          <div className="mt-3 space-y-1 text-[14px] text-muted">
            {c.contact.email && <div>{c.contact.email}</div>}
            {c.contact.phone && <div>{c.contact.phone}</div>}
            {c.contact.address && <div>{c.contact.address}</div>}
          </div>
        </section>
      )}

      {/* socials */}
      {showHome && c.socials.enabled && (c.socials.instagram || c.socials.facebook || c.socials.whatsapp) && (
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
        if (b.type === 'heading') return <h2 key={b.id} className="mt-8 font-display text-[28px] font-bold leading-tight first:mt-0">{b.text}</h2>;
        if (b.type === 'text') return <p key={b.id} className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">{b.text}</p>;
        if (b.type === 'image') return b.url ? (
          isVideo(b.url)
            ? <video key={b.id} src={b.url} className="mt-6 w-full rounded-xl" muted loop autoPlay playsInline />
            : <img key={b.id} src={b.url} alt="" className="mt-6 w-full rounded-xl object-cover" />
        ) : null;
        if (b.type === 'button') return (
          <div key={b.id} className="mt-6">
            <a href={safeHref(b.href)} className="inline-block rounded-lg px-6 py-3 text-[15px] font-bold text-white shadow-card" style={{ background: accent }}>{b.text || 'Button'}</a>
          </div>
        );
        return null;
      })}
    </section>
  );
}

/* a single policy card */
/**
 * One product tile.
 *
 * Extracted so the product tabs and the collection rows render identically —
 * two copies of this markup would drift the moment either was touched.
 */
export function ProductCard({ p, username, accent }: { p: any; username?: string; accent: string }) {
  return (
    <Link
      href={username ? storeHref(username, `/product/${p.id}`) : '#'}
      className="block overflow-hidden rounded-lg border border-line bg-white transition hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-green-soft">
        <AutoImages images={Array.isArray(p.images) ? p.images : (firstImage(p) ? [firstImage(p)] : [])} />
      </div>
      <div className="p-3">
        <div className="truncate font-display text-[14px] font-bold">{p.title || p.name}</div>
        <div className="mt-1 leading-tight">
          <div className="font-display text-[15px] font-bold" style={{ color: accent }}>{rupees(p.price)}</div>
          {p.mrp && p.mrp > p.price && <div className="text-[12px] text-faint line-through">{rupees(p.mrp)}</div>}
        </div>
        {p.sizes?.length > 0 && <div className="mt-2"><SizeStrip sizes={p.sizes} compact /></div>}
      </div>
    </Link>
  );
}

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
