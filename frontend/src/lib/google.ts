'use client';

/**
 * Google Identity Services loader.
 *
 * GIS hands us an **ID token** (a signed JWT) in the browser; we post it to the
 * backend, which verifies the signature and the `aud` claim before trusting it.
 * Nothing here is a secret — the client ID is public by design, and the OAuth
 * client secret never touches the frontend.
 */

const SRC = 'https://accounts.google.com/gsi/client';

export const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
export const googleEnabled = !!googleClientId;

let loading: Promise<any> | null = null;

export function loadGoogle(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Unavailable'));
  if (!googleClientId) return Promise.reject(new Error('Google sign-in isn’t configured yet.'));

  const ready = (window as any).google?.accounts?.id;
  if (ready) return Promise.resolve((window as any).google);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const done = () => {
      if ((window as any).google?.accounts?.id) resolve((window as any).google);
      else { loading = null; reject(new Error('Google sign-in failed to load.')); }
    };
    const fail = () => { loading = null; reject(new Error('Couldn’t reach Google. Check your connection.')); };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (existing) { existing.addEventListener('load', done); existing.addEventListener('error', fail); return; }

    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', done);
    s.addEventListener('error', fail);
    document.head.appendChild(s);
  });
  return loading;
}
