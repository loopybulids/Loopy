'use client';

/**
 * Downscale + re-encode an image in the browser before we store it.
 *
 * Images are kept inline as data-URLs in Postgres, so an untouched 2.5MB photo
 * becomes ~3.4MB of base64 that has to cross the wire from Neon on *every*
 * storefront render. Re-encoding to WebP at a sane resolution typically cuts
 * that by 90-95% with no visible difference at the sizes we display.
 *
 * Videos are returned untouched — canvas can't transcode them.
 */

const MAX_DIM = 1600; // plenty for full-bleed hero art on a 2x display
const QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be decoded.'));
    img.src = src;
  });
}

export async function compressImage(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return original; // animation would be flattened

  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, w, h);

    // WebP keeps alpha, so logos with transparent backgrounds survive.
    let out = canvas.toDataURL('image/webp', QUALITY);
    if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', QUALITY);

    // A tiny or already-optimised source can come out bigger — keep the smaller.
    return out.length < original.length ? out : original;
  } catch {
    return original; // never block an upload because compression failed
  }
}
