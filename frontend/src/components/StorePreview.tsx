'use client';
import { useState } from 'react';
import { StoreConfig, HERO_BG } from '@/lib/store-config';
import { Search, Heart, Bag, ShieldLock, Truck, Star } from '@/components/icons';

const rupees = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

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
  config, products = [], storeName,
}: {
  config: StoreConfig;
  products?: any[];
  storeName: string;
}) {
  const c = config;
  const accent = c.theme.accent;
  const [tab, setTab] = useState(c.productTabs.tabs[0] || 'Featured');

  return (
    <div className="bg-paper text-navy">
      {/* announcement */}
      {c.announcement.enabled && c.announcement.text && (
        <div className="bg-navy py-2 text-center text-[12.5px] font-semibold text-white">{c.announcement.text}</div>
      )}

      {/* header */}
      {c.header.enabled && (
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-4 sm:px-8">
          <div className="font-display text-[22px] font-extrabold tracking-tight" style={{ color: accent }}>{storeName}</div>
          <nav className="hidden items-center gap-5 text-[14px] font-semibold text-navy/75 md:flex">
            {c.header.nav.map((n, i) => <span key={i} className="cursor-pointer hover:text-navy">{n.label}</span>)}
          </nav>
          <div className="flex items-center gap-3 text-navy/70">
            {c.header.showSearch && <Search size={18} />}
            <Heart size={18} />
            <Bag size={18} />
          </div>
        </header>
      )}

      {/* hero */}
      {c.hero.enabled && (
        <section className={`relative px-5 py-16 text-center sm:px-8 ${HERO_BG[c.theme.heroBg]}`}>
          {c.hero.imageUrl && (
            <img src={c.hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="relative mx-auto max-w-2xl">
            {c.hero.eyebrow && <p className="text-[14px] font-bold" style={{ color: accent }}>✨ {c.hero.eyebrow} ✨</p>}
            <h1 className="mt-3 font-display text-[40px] font-extrabold leading-tight sm:text-[56px]">{c.hero.headline}</h1>
            {c.hero.subtext && <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">{c.hero.subtext}</p>}
            {c.hero.ctaLabel && (
              <button className="mt-6 rounded-lg px-6 py-3 text-[15px] font-bold text-white" style={{ background: accent }}>
                {c.hero.ctaLabel} 🛍
              </button>
            )}
          </div>
        </section>
      )}

      {/* banner images */}
      {c.banners.enabled && c.banners.images.filter(Boolean).length > 0 && (
        <section className="grid gap-3 px-5 py-6 sm:px-8 md:grid-cols-2">
          {c.banners.images.filter(Boolean).map((src, i) => (
            <img key={i} src={src} alt="" className="h-48 w-full rounded-lg object-cover" />
          ))}
        </section>
      )}

      {/* product tabs + grid */}
      {c.productTabs.enabled && (
        <section id="products" className="px-5 py-12 sm:px-8">
          <h2 className="text-center font-display text-[30px] font-extrabold">{c.productTabs.heading}</h2>
          {c.productTabs.sub && <p className="mt-1 text-center text-[14px] text-muted">{c.productTabs.sub}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {c.productTabs.tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-lg px-4 py-2 text-[13px] font-bold transition-colors"
                style={tab === t ? { background: accent, color: '#fff' } : { background: '#fff', color: '#5B6577', border: '1px solid #E8E6DE' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.length === 0 ? (
              <p className="col-span-full py-8 text-center text-[13px] text-faint">No products yet — add some in your catalog.</p>
            ) : (
              products.slice(0, 8).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="aspect-square bg-green-soft">
                    {firstImage(p) && <img src={firstImage(p)!} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <div className="truncate font-display text-[14px] font-bold">{p.title || p.name}</div>
                    <div className="mt-1 font-display text-[15px] font-extrabold" style={{ color: accent }}>{rupees(p.price)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* policies */}
      {c.policies.enabled && c.policies.items.length > 0 && (
        <section className="bg-white px-5 py-12 sm:px-8">
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
            {c.policies.items.map((p, i) => (
              <div key={i} className="rounded-lg border border-line p-6 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg" style={{ background: `${accent}1a`, color: accent }}>{POLICY_ICONS[i % 3]}</span>
                <div className="mt-3 font-display text-[15px] font-bold">{p.title}</div>
                <p className="mt-1 text-[13px] text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* contact */}
      {c.contact.enabled && (c.contact.email || c.contact.phone || c.contact.address) && (
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
      {c.socials.enabled && (c.socials.instagram || c.socials.facebook || c.socials.whatsapp) && (
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
