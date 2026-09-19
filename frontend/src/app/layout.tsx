import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Analytics from '@/components/Analytics';

// Single family for the whole app — geometric, dashboard-style sans matching the
// reference design. `display: 'swap'` so text paints immediately rather than
// blocking on the font download.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/**
 * Figures are set in a monospaced face, not the UI sans.
 *
 * Money and counts are compared down a column, so they need fixed-width
 * digits — in a proportional sans, "₹43,179" and "₹1,017" don't line up and
 * a changing figure shifts its own width as it animates. Plex Mono also draws
 * a proper ₹ and reads as data rather than as body copy, which is most of the
 * difference between a dashboard that looks designed and one that looks typed.
 */
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-num',
});

/**
 * Headlines have their own voice.
 *
 * `font-display` used to point at Plus Jakarta Sans — the same face as the
 * body — so "display" was a label with no effect: every heading was the UI
 * font at a larger size.
 *
 * Space Grotesk is the opposite choice to that: a single-storey 'a', squared
 * bowls and flat terminals, so a heading is recognisably a different typeface
 * rather than a size change. (Bricolage Grotesque was tried first and
 * rejected for exactly that reason — too close to Plus Jakarta to read as a
 * change at all.) Plus Jakarta still carries every piece of body and UI copy,
 * where its neutrality is the point.
 */
const display = Space_Grotesk({
  subsets: ['latin'],
  // 700 is the family's heaviest real weight. Headings use font-bold rather
  // than font-extrabold so the browser never has to synthesise 800 — faux
  // bold smears the outlines badly at hero sizes.
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Loopy — Turn Instagram DMs & WhatsApp chats into orders',
  description: 'Convert conversations into sales with instant checkout links, automated order management and shipping workflows — all from one dashboard.',
};

/*
 * Declared explicitly rather than relying on the framework default, because
 * two of these matter on a phone and neither is the default:
 *
 *  - `maximumScale` is deliberately absent. Locking zoom is the usual way to
 *    make a layout "look right" on mobile, and it takes pinch-zoom away from
 *    anyone who needs it. The layout has to work without that crutch.
 *  - `themeColor` paints the browser chrome, so the address bar matches the
 *    page instead of sitting on it as a grey band.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0E2A47' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
