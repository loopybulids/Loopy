'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Analytics now lives on the dashboard — redirect any old links there.
export default function AnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/seller'); }, [router]);
  return <p className="py-10 text-center text-[13px] text-faint">Analytics moved to your dashboard…</p>;
}
