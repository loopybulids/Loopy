/* Shared storefront-builder config — edited in /seller/store-editor and
   rendered by <StorePreview> both in the editor and on the public storefront. */

export type NavLink = { label: string; href: string };
export type Policy = { title: string; body: string };

/* Custom pages — sellers can add as many extra pages (About, Lookbook, FAQ…) as
   they like, each built from simple content blocks. */
export type PageBlockType = 'heading' | 'text' | 'image' | 'button';
export type PageBlock = { id: string; type: PageBlockType; text?: string; url?: string; href?: string };
export type StorePage = { id: string; title: string; slug: string; showInNav: boolean; blocks: PageBlock[] };

export const uid = () => Math.random().toString(36).slice(2, 9);
export const slugify = (s: string) =>
  (s || 'page').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page';

export function blankBlock(type: PageBlockType): PageBlock {
  const base = { id: uid(), type };
  if (type === 'heading') return { ...base, text: 'New heading' };
  if (type === 'text') return { ...base, text: 'Write something about your store…' };
  if (type === 'image') return { ...base, url: '' };
  return { ...base, text: 'Button', href: '#' }; // button
}
export function blankPage(title = 'New Page'): StorePage {
  return { id: uid(), title, slug: slugify(title), showInNav: true, blocks: [blankBlock('heading'), blankBlock('text')] };
}

export type HeroBg = 'mint' | 'navy' | 'plain' | 'sand' | 'dark' | 'accent';
export type FontChoice = 'modern' | 'bold' | 'classic';

export interface StoreConfig {
  theme: { accent: string; heroBg: HeroBg; font: FontChoice };
  announcement: { enabled: boolean; text: string };
  header: { enabled: boolean; showSearch: boolean; nav: NavLink[] };
  hero: {
    enabled: boolean;
    eyebrow: string;
    headline: string;
    subtext: string;
    ctaLabel: string;
    imageUrl: string;
    focusY: number; // 0 (top) – 100 (bottom): vertical focus point of the bg media
  };
  banners: { enabled: boolean; images: string[] };
  productTabs: { enabled: boolean; heading: string; sub: string; tabs: string[] };
  policies: { enabled: boolean; items: Policy[] };
  socials: { enabled: boolean; instagram: string; facebook: string; whatsapp: string };
  contact: { enabled: boolean; email: string; phone: string; address: string };
  footer: { text: string };
  pages: StorePage[];
}

/* The ordered section list the editor shows on the left. */
export const SECTION_ORDER: { key: keyof StoreConfig | 'theme'; label: string }[] = [
  { key: 'announcement', label: 'Top Bar / Announcement' },
  { key: 'header', label: 'Header' },
  { key: 'hero', label: 'Hero Banner' },
  { key: 'banners', label: 'Banner Images' },
  { key: 'productTabs', label: 'Product Tabs' },
  { key: 'policies', label: 'Policies' },
  { key: 'socials', label: 'Social Links' },
  { key: 'contact', label: 'Contact' },
  { key: 'footer', label: 'Footer' },
  { key: 'pages', label: 'Custom Pages' },
  { key: 'theme', label: 'Theme & Styles' },
];

export function defaultConfig(storeName = 'Your Store'): StoreConfig {
  return {
    theme: { accent: '#15784A', heroBg: 'mint', font: 'bold' },
    announcement: { enabled: true, text: `✨ Welcome to ${storeName} — every order escrow-protected ✨` },
    header: {
      enabled: true,
      showSearch: true,
      nav: [
        { label: 'Home', href: '#' },
        { label: 'All Products', href: '#products' },
        { label: 'Track Order', href: '/orders' },
        { label: 'Contact', href: '#contact' },
      ],
    },
    hero: {
      enabled: true,
      eyebrow: 'Handpicked just for you!',
      headline: storeName,
      subtext: 'Curated, authenticated finds — shipped fast and protected end-to-end.',
      ctaLabel: 'Shop Now',
      imageUrl: '',
      focusY: 50,
    },
    banners: { enabled: false, images: [] },
    productTabs: {
      enabled: true,
      heading: 'Featured',
      sub: 'Our best picks, just for you',
      tabs: ['Featured', 'On Sale', 'Bestsellers', 'Latest'],
    },
    policies: {
      enabled: true,
      items: [
        { title: 'Buyer Protection', body: 'Your payment is held in escrow until you confirm delivery.' },
        { title: 'Easy Returns', body: 'Not as described? Get a full refund within the inspection window.' },
        { title: 'Fast Shipping', body: 'Managed, tracked shipping on every order.' },
      ],
    },
    socials: { enabled: true, instagram: '', facebook: '', whatsapp: '' },
    contact: { enabled: true, email: '', phone: '', address: '' },
    footer: { text: `© ${'2026'} ${storeName} · Powered by Loopy` },
    pages: [],
  };
}

/* Merge a (possibly partial / older) saved config onto the defaults so the
   renderer never hits undefined sections. */
export function withDefaults(storeName: string, saved?: Partial<StoreConfig> | null): StoreConfig {
  const d = defaultConfig(storeName);
  if (!saved) return d;
  return {
    theme: { ...d.theme, ...saved.theme },
    announcement: { ...d.announcement, ...saved.announcement },
    header: { ...d.header, ...saved.header, nav: saved.header?.nav ?? d.header.nav },
    hero: { ...d.hero, ...saved.hero },
    banners: { ...d.banners, ...saved.banners, images: saved.banners?.images ?? d.banners.images },
    productTabs: { ...d.productTabs, ...saved.productTabs, tabs: saved.productTabs?.tabs ?? d.productTabs.tabs },
    policies: { ...d.policies, ...saved.policies, items: saved.policies?.items ?? d.policies.items },
    socials: { ...d.socials, ...saved.socials },
    contact: { ...d.contact, ...saved.contact },
    footer: { ...d.footer, ...saved.footer },
    pages: Array.isArray(saved.pages)
      ? saved.pages.map((p) => ({
          id: p.id || uid(),
          title: p.title || 'Page',
          slug: p.slug || slugify(p.title || 'page'),
          showInNav: p.showInNav ?? true,
          blocks: Array.isArray(p.blocks) ? p.blocks.map((b) => ({ id: b.id || uid(), type: b.type, text: b.text, url: b.url, href: b.href })) : [],
        }))
      : d.pages,
  };
}

/* Detect whether a media URL/data-URL is a video so the renderer picks <video> vs <img>. */
export function isVideo(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) || url.startsWith('data:video');
}

export const HERO_BG: Record<HeroBg, string> = {
  mint: 'bg-gradient-to-b from-green-mint/40 to-paper',
  navy: 'bg-navy text-white',
  plain: 'bg-paper',
  sand: 'bg-gradient-to-b from-amber-soft to-paper',
  dark: 'bg-navy-deep text-white',
  accent: '', // filled at render time from theme.accent (gradient)
};

/* Labels + swatch colors for the editor's hero-background picker. */
export const HERO_BG_OPTIONS: { key: HeroBg; label: string; swatch: string }[] = [
  { key: 'mint', label: 'Mint', swatch: '#86EFAC' },
  { key: 'sand', label: 'Sand', swatch: '#FBF1DC' },
  { key: 'plain', label: 'Plain', swatch: '#F6F5F0' },
  { key: 'navy', label: 'Navy', swatch: '#0E2A47' },
  { key: 'dark', label: 'Dark', swatch: '#091B2E' },
  { key: 'accent', label: 'Accent', swatch: '#15784A' },
];

/* Font presets — uses fonts already loaded in layout (+ a web-safe serif). */
export const FONT_OPTIONS: { key: FontChoice; label: string; className: string; preview: string }[] = [
  { key: 'bold', label: 'Bold', className: 'font-display', preview: 'font-display' },
  { key: 'modern', label: 'Modern', className: 'font-sans', preview: 'font-sans' },
  { key: 'classic', label: 'Classic', className: 'font-serif', preview: 'font-serif' },
];
export const FONT_CLASS: Record<FontChoice, string> = {
  bold: 'font-display',
  modern: 'font-sans',
  classic: 'font-serif',
};

/* One-tap design templates — set accent, font and hero background together. */
export type TemplateKey = 'kawaii' | 'boho' | 'minimal' | 'bold' | 'paper' | 'luxe' | 'ocean' | 'sunset' | 'forest' | 'mono' | 'candy';
export const TEMPLATES: { key: TemplateKey; label: string; desc: string; emoji: string; accent: string; font: FontChoice; heroBg: HeroBg }[] = [
  { key: 'kawaii', label: 'Kawaii', desc: 'Cute & playful. Pastel tones, rounded shapes.', emoji: '🌸', accent: '#DB2777', font: 'bold', heroBg: 'mint' },
  { key: 'boho', label: 'Boho', desc: 'Warm & earthy. Soft serif, sage & sand palette.', emoji: '🌿', accent: '#4D7C0F', font: 'classic', heroBg: 'sand' },
  { key: 'minimal', label: 'Minimal', desc: 'Clean & elegant. Monochrome, sharp lines.', emoji: '⬜', accent: '#0E2A47', font: 'modern', heroBg: 'plain' },
  { key: 'bold', label: 'Bold', desc: 'High-energy. Vibrant colors, urban vibes.', emoji: '🔥', accent: '#7C3AED', font: 'bold', heroBg: 'accent' },
  { key: 'paper', label: 'Paper', desc: 'Minimalist & pure. Just your brand and products.', emoji: '📄', accent: '#111827', font: 'classic', heroBg: 'plain' },
  { key: 'luxe', label: 'Luxe', desc: 'Elegant & premium. Gold accents on dark.', emoji: '👑', accent: '#A16207', font: 'classic', heroBg: 'dark' },
  { key: 'ocean', label: 'Ocean', desc: 'Cool & calm. Aqua tones, airy and fresh.', emoji: '🌊', accent: '#0891B2', font: 'modern', heroBg: 'mint' },
  { key: 'sunset', label: 'Sunset', desc: 'Warm & vibrant. Coral and amber glow.', emoji: '🌅', accent: '#EA580C', font: 'bold', heroBg: 'sand' },
  { key: 'forest', label: 'Forest', desc: 'Natural & grounded. Deep greens.', emoji: '🌲', accent: '#15803D', font: 'bold', heroBg: 'mint' },
  { key: 'mono', label: 'Mono', desc: 'Black & white. Ultra-minimal, no fuss.', emoji: '⚫', accent: '#18181B', font: 'modern', heroBg: 'plain' },
  { key: 'candy', label: 'Candy', desc: 'Sweet & bright. Bubbly purple pop.', emoji: '🍬', accent: '#9333EA', font: 'bold', heroBg: 'accent' },
];
