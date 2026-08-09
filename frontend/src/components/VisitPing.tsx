'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';

// Map a referrer hostname / utm_source to a friendly channel name.
function detectSource(): { source: string; referrer: string } {
  if (typeof window === 'undefined') return { source: 'Direct', referrer: '' };
  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source') || params.get('ref') || params.get('source');
  const ref = document.referrer || '';
  const host = (() => { try { return ref ? new URL(ref).hostname.replace(/^www\./, '') : ''; } catch { return ''; } })();

  const pick = (utm || host).toLowerCase();
  let source = 'Direct';
  if (pick.includes('instagram') || pick === 'ig') source = 'Instagram';
  else if (pick.includes('whatsapp') || pick.includes('wa.me') || pick === 'wa') source = 'WhatsApp';
  else if (pick.includes('facebook') || pick.includes('fb.') || pick === 'fb') source = 'Facebook';
  else if (pick.includes('google')) source = 'Google';
  else if (pick.includes('youtube') || pick === 'yt') source = 'YouTube';
  else if (pick.includes('t.co') || pick.includes('twitter') || pick.includes('x.com')) source = 'Twitter/X';
  else if (pick.includes('tiktok')) source = 'TikTok';
  else if (pick.includes('linktr')) source = 'Linktree';
  else if (utm) source = utm.charAt(0).toUpperCase() + utm.slice(1);
  else if (host) source = host;
  return { source, referrer: ref };
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
