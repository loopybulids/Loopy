import type { Metadata } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'Loopy — Turn Instagram DMs & WhatsApp chats into orders',
  description: 'Convert conversations into sales with instant checkout links, automated order management and shipping workflows — all from one dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
