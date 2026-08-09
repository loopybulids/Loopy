'use client';
import { useEffect, useRef, useState } from 'react';
import { googleClientId, googleEnabled, loadGoogle } from '@/lib/google';

/**
 * Renders Google's own sign-in button and hands the resulting ID token up.
 *
 * We render *their* button rather than styling our own: One Tap / `prompt()` is
 * silently suppressed in plenty of browsers (third-party-cookie blocking,
 * incognito), whereas the rendered button always works — and it keeps us on the
 * right side of Google's branding rules.
 */
export default function GoogleButton({
  onToken,
  onError,
  text = 'continue_with',
}: {
  onToken: (idToken: string) => void;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const [failed, setFailed] = useState('');

  useEffect(() => {
    if (!googleEnabled) { setFailed('Google sign-in isn’t configured yet.'); return; }
    let dead = false;

    loadGoogle()
      .then((google) => {
        if (dead || !box.current) return;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res: any) => {
            if (res?.credential) cb.current(res.credential);
            else onError?.('Google didn’t return a sign-in token.');
          },
        });
        // renderButton wants a number; the container can measure 0 if it's still
        // hidden, so fall back to a sane width.
        const width = Math.min(Math.max(box.current.offsetWidth || 320, 200), 400);
        google.accounts.id.renderButton(box.current, {
          type: 'standard', theme: 'outline', size: 'large',
          shape: 'pill', logo_alignment: 'center', text, width,
        });
      })
      .catch((e: Error) => {
        if (dead) return;
        setFailed(e.message);
        onError?.(e.message);
      });

    return () => { dead = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) return <p className="rounded-lg bg-paper px-3 py-2.5 text-center text-[12.5px] font-semibold text-muted">{failed}</p>;
  return <div ref={box} className="flex min-h-[44px] justify-center [color-scheme:light]" />;
}
