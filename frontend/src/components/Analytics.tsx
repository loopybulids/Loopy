'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GA_ID, isConsolePath, startAnalytics, trackPageView } from '@/lib/analytics';

/**
 * Loads Google Analytics, once, for public pages only.
 *
 * Three deliberate choices:
 *
 *  1. Nothing loads unless NEXT_PUBLIC_GA_ID is set. Local development and
 *     preview builds stay silent, so the numbers are real traffic rather than
 *     our own clicking.
 *  2. The seller console and admin are excluded. They are staff tools behind a
 *     login; counting a seller checking their orders as shop traffic would
 *     inflate exactly the figures this is meant to measure.
 *  3. That decision is made in an effect, not during render. Telling a
 *     console apart from a shop needs the hostname — www.loopynow.shop/cpaybara
 *     is a console, cpaybara.loopynow.shop/summer-sale is a shop — and there
 *     is no hostname during a server render. Deciding in render would mean the
 *     server and the browser disagreeing about whether to emit the tag, which
 *     is a hydration mismatch. So the first paint carries no tag either way,
 *     and the browser adds it a moment later.
 *
 * Page views are sent per route change rather than by the tag itself: this is
 * a single-page app, so its own initial view would be the only one it ever
 * recorded.
 */
export default function Analytics() {
  const pathname = usePathname();
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!GA_ID || isConsolePath(pathname)) {
      setTracking(false);
      return;
    }
    setTracking(true);
    startAnalytics();
    trackPageView(pathname);
  }, [pathname]);

  if (!GA_ID || !tracking) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
