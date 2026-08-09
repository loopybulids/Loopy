import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// Single family for the whole app — geometric, dashboard-style sans matching the
// reference design. `display: 'swap'` so text paints immediately rather than
// blocking on the font download.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Loopy — Turn Instagram DMs & WhatsApp chats into orders',
  description: 'Convert conversations into sales with instant checkout links, automated order management and shipping workflows — all from one dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
