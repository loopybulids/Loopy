'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { GA_ID, isConsolePath, trackPageView } from '@/lib/analytics';

/**
 * Loads Google Analytics, once, for public pages only.
 *
 * Two deliberate choices:
 *
 *  1. Nothing loads unless NEXT_PUBLIC_GA_ID is set. Local development and
 *     preview builds stay silent, so the numbers are real traffic rather than
 *     our own clicking.
 *  2. The seller console and admin are excluded. They are staff tools behind a
 *     login; counting a seller checking their orders as shop traffic would
 *     inflate exactly the figures this is meant to measure.
 *
 * `send_page_view` is off and views are sent per route change instead: this is
 * a single-page app, so the tag's own initial view would be the only one it
 * ever recorded.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (GA_ID) trackPageView(pathname);
  }, [pathname]);

  if (!GA_ID || isConsolePath(pathname)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: false });`}
      </Script>
    </>
  );
}
