'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';

/** Records a storefront page view for seller traffic analytics (deduped per browser session). */
export default function VisitPing({ username }: { username: string }) {
  useEffect(() => {
    if (!username) return;
    let sid = localStorage.getItem('loopy_sid');
    if (!sid) { sid = Math.random().toString(36).slice(2); localStorage.setItem('loopy_sid', sid); }
    api.recordVisit(username, sid).catch(() => {});
  }, [username]);
  return null;
}
