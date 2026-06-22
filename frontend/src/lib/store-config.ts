/* Shared storefront-builder config — edited in /seller/store-editor and
   rendered by <StorePreview> both in the editor and on the public storefront. */

export type NavLink = { label: string; href: string };
export type Policy = { title: string; body: string };

export interface StoreConfig {
  theme: { accent: string; heroBg: 'mint' | 'navy' | 'plain' };
  announcement: { enabled: boolean; text: string };
  header: { enabled: boolean; showSearch: boolean; nav: NavLink[] };
  hero: {
    enabled: boolean;
    eyebrow: string;
    headline: string;
    subtext: string;
    ctaLabel: string;
    imageUrl: string;
  };
  banners: { enabled: boolean; images: string[] };
  productTabs: { enabled: boolean; heading: string; sub: string; tabs: string[] };
  policies: { enabled: boolean; items: Policy[] };
  socials: { enabled: boolean; instagram: string; facebook: string; whatsapp: string };
  contact: { enabled: boolean; email: string; phone: string; address: string };
  footer: { text: string };
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
  { key: 'theme', label: 'Theme & Styles' },
];

export function defaultConfig(storeName = 'Your Store'): StoreConfig {
  return {
    theme: { accent: '#15784A', heroBg: 'mint' },
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
  };
}

/* Detect whether a media URL/data-URL is a video so the renderer picks <video> vs <img>. */
export function isVideo(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) || url.startsWith('data:video');
}

export const HERO_BG: Record<StoreConfig['theme']['heroBg'], string> = {
  mint: 'bg-gradient-to-b from-green-mint/40 to-paper',
  navy: 'bg-navy text-white',
  plain: 'bg-paper',
};
