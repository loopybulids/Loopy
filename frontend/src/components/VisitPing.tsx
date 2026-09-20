'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';

/** Where the session's first real source is remembered. */
const SOURCE_KEY = 'loopy_src';

/**
 * Referrers that are not a traffic source.
 *
 * Two kinds of hop arrive with a referrer but represent nobody new: a shopper
 * coming back from the payment gateway, and one moving between pages of the
 * store. Counting them put "famgateway.in" among a store's biggest channels,
 * which told the seller nothing except that somebody had paid — and worse, it
 * overwrote the Instagram link that had actually brought them.
 *
 * Matched as substrings, so `api.razorpay.com` and `l.instagram.com` both land
 * where they should.
 */
const NOT_A_SOURCE = [
  // payment gateways — a return trip, not an arrival
  'famgateway', 'razorpay', 'payu', 'cashfree', 'phonepe', 'paytm', 'billdesk', 'ccavenue',
  // ourselves
  'loopynow.shop', 'localhost', 'vercel.app',
];

/** Named channels, in the order they're tested. */
const CHANNELS: [string[], string][] = [
  [['instagram', 'ig'], 'Instagram'],
  [['whatsapp', 'wa.me', 'wa'], 'WhatsApp'],
  [['facebook', 'fb.', 'fb'], 'Facebook'],
  [['google'], 'Google'],
  [['youtube', 'yt'], 'YouTube'],
  [['t.co', 'twitter', 'x.com'], 'Twitter/X'],
  [['tiktok'], 'TikTok'],
  [['linktr'], 'Linktree'],
  [['snapchat'], 'Snapchat'],
  [['pinterest'], 'Pinterest'],
  [['telegram', 't.me'], 'Telegram'],
];

const channelFor = (pick: string) =>
  CHANNELS.find(([keys]) => keys.some((k) => (k.length <= 3 ? pick === k : pick.includes(k))))?.[1] || null;

/**
 * Map a referrer / utm_source to a channel name.
 *
 * The first real source of a session is remembered and reused, so a shopper
 * who arrives from Instagram, browses for an hour and comes back from the
 * payment page is still counted as Instagram — not as two visits from two
 * different places.
 */
function detectSource(): { source: string; referrer: string } {
  if (typeof window === 'undefined') return { source: 'Direct', referrer: '' };

  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source') || params.get('ref') || params.get('source');
  const ref = document.referrer || '';
  const host = (() => { try { return ref ? new URL(ref).hostname.replace(/^www\./, '') : ''; } catch { return ''; } })();

  const remembered = (() => { try { return localStorage.getItem(SOURCE_KEY) || ''; } catch { return ''; } })();
  const keep = (source: string) => {
    try { if (source !== 'Direct') localStorage.setItem(SOURCE_KEY, source); } catch { /* private window */ }
    return { source, referrer: ref };
  };

  // An explicit tag always wins — the seller put it in the link on purpose.
  if (utm) return keep(channelFor(utm.toLowerCase()) || utm.charAt(0).toUpperCase() + utm.slice(1));

  const pick = host.toLowerCase();
  if (!pick || NOT_A_SOURCE.some((h) => pick.includes(h))) {
    return { source: remembered || 'Direct', referrer: ref };
  }

  // A real referrer: a channel we know, or the bare hostname.
  return keep(channelFor(pick) || host);
}

/** Records a storefront page view for seller traffic analytics (deduped per browser session). */
export default function VisitPing({ username }: { username: string }) {
  useEffect(() => {
    if (!username) return;
    const timer = setTimeout(() => {
      let sid = localStorage.getItem('loopy_sid');
      if (!sid) { sid = Math.random().toString(36).slice(2); localStorage.setItem('loopy_sid', sid); }
      const { source, referrer } = detectSource();
      api.recordVisit(username, sid, source, referrer).catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, [username]);
  return null;
}
