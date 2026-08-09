'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Store, Check, Share, Cog, Verified } from '@/components/icons';

/** Chevron up/down — the standard "this opens a menu" affordance. */
const ChevronUpDown = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
  </svg>
);

/**
 * Store identity card for the seller sidebar — store name over its public URL,
 * with a menu for the things you actually want from it (open the storefront,
 * copy the link to paste into a DM, jump to settings).
 *
 * Loopy is one store per seller, so this deliberately isn't an account
 * switcher — it identifies the store you're working on and gets you to its link
 * fast, which is the whole product loop.
 */
export default function StoreSwitcher({ storeName, username, logoUrl, published }: {
  storeName: string;
  username: string;
  logoUrl?: string | null;
  published?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, []);

  // Built at click time — `window` isn't there during the server render.
  const storeUrl = () => `${window.location.origin}/s/${username}`;
  const prettyUrl = username ? `/s/${username}` : 'Set a store handle';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked — the menu still links out */ }
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
          open ? 'border-green-600/40 ring-2 ring-green-600/10' : 'border-line hover:border-green-600/30 hover:shadow-card'
        }`}
      >
        {/* the store's own logo when it has one, else its initial */}
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-line" />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-green-600 to-green text-[15px] font-extrabold text-white">
            {(storeName || 'S').trim().charAt(0).toUpperCase()}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-extrabold leading-tight text-navy">{storeName || 'Your Store'}</span>
            {username && (
              <span
                title={published ? 'Store is live' : 'Not published yet'}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${published ? 'bg-green-500' : 'bg-amber'}`}
              />
            )}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-faint">{prettyUrl}</span>
        </span>

        <span className="shrink-0 text-faint"><ChevronUpDown /></span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-line bg-white shadow-lift">
          {username ? (
            <>
              <a
                href={`/s/${username}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-paper"
              >
                <Store size={15} /> View storefront
              </a>
              <button onClick={copy} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-navy hover:bg-paper">
                {copied ? <><Check size={15} /> Link copied</> : <><Share size={15} /> Copy store link</>}
              </button>
            </>
          ) : (
            <Link href="/seller/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-paper">
              <Verified size={15} /> Set your store handle
            </Link>
          )}
          <Link
            href="/seller/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-t border-line px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-paper"
          >
            <Cog size={15} /> Store settings
          </Link>
        </div>
      )}
    </div>
  );
}
