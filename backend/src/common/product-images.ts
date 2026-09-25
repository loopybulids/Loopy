/**
 * Serve product images as files instead of inlining them in every payload.
 *
 * Images are stored as base64 data URIs inside `Product.images`. That is fine
 * as storage and ruinous as transport: the storefront payload carries the
 * whole catalogue, so a 15-product store sent 4.6 MB of base64 inside its HTML
 * on every single request. Base64 is a third larger than the bytes it encodes,
 * gzip cannot compress already-compressed JPEG data, and none of it could be
 * cached because it was part of a page that changes.
 *
 * The same bytes served from their own URL are fetched in parallel, cached by
 * the browser and the CDN forever, and never block the page from rendering.
 *
 * Public storefront payloads are rewritten to URLs; the seller console still
 * receives the raw data URIs, because its editor loads images in order to save
 * them back and would otherwise write a URL where the image used to be.
 *
 * Without PUBLIC_API_URL there is no absolute URL to point at, so payloads are
 * left exactly as they were — slow, but correct, which is the right way round
 * for a missing setting.
 */

import { createHash } from 'crypto';

/** The API's own public base, e.g. https://api.loopynow.shop/api/v1 */
const apiBase = () => (process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');

export const imagesServedAsFiles = () => !!apiBase();

const DATA_URI = /^data:([a-z]+\/[a-z0-9.+-]+)?;base64,(.+)$/i;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogg',
};

/**
 * The file extension a media URL must end with.
 *
 * Not decoration. The storefront decides whether to render `<img>` or
 * `<video>` by looking at the extension (see isVideo in lib/store-config), and
 * a data URI announced its type in the string itself. Drop the extension and
 * every seller's video hero or product clip silently renders as a broken
 * image, because nothing downstream can tell what the bytes are any more.
 */
export function extFor(mime: string | undefined): string {
  const m = (mime || '').toLowerCase();
  if (EXT[m]) return EXT[m];
  const sub = m.split('/')[1] || 'bin';
  return sub.replace(/[^a-z0-9]/g, '') || 'bin';
}

/** `data:image/webp;base64,…` → `webp`. */
export const extOfDataUri = (raw: string) => extFor(DATA_URI.exec(raw)?.[1]);

/** True for a stored image that is bytes rather than a link to somewhere else. */
export const isDataUri = (v: unknown) => typeof v === 'string' && DATA_URI.test(v);

/**
 * Swap a product's inline images for URLs pointing at `imageBytes` below.
 *
 * Anything already a URL is left alone — sellers who pasted a link should keep
 * it — and the index is positional, so the n-th URL is the n-th stored image.
 */
export function withImageUrls<T extends { id: string; images?: unknown }>(product: T): T {
  const base = apiBase();
  const images = Array.isArray(product.images) ? product.images : [];
  if (!base || !images.length) return product;

  return {
    ...product,
    images: images.map((img, i) =>
      isDataUri(img)
        ? `${base}/products/${product.id}/image/${i}.${extOfDataUri(img as string)}?v=${fingerprint(img as string)}`
        : img,
    ),
  };
}

/**
 * A short digest of the image's own bytes, used as a cache buster.
 *
 * Without it the URLs would not be safe to cache forever: a seller replacing
 * the first photo of a product puts different bytes behind
 * `/products/<id>/image/0`, and every browser and CDN that had cached it would
 * keep showing the old one. With the digest in the URL, a changed image is
 * simply a different URL and the stale entry is never asked for again.
 */
const fingerprint = (raw: string) => createHash('sha1').update(raw).digest('hex').slice(0, 12);

/**
 * The bytes of one stored image, ready to send.
 *
 * Returns null when the index is out of range or the entry is a link rather
 * than data — both are a 404 rather than an error, since neither is something
 * the caller can fix by retrying.
 */
export function imageBytes(images: unknown[], index: number | string): { body: Buffer; type: string } | null {
  // The URL ends in an extension so the storefront can tell video from image;
  // it is not part of the index.
  const i = typeof index === 'number' ? index : Number(String(index).split('.')[0]);
  if (!Number.isInteger(i) || i < 0) return null;
  const raw = images[i];
  if (typeof raw !== 'string') return null;
  const m = DATA_URI.exec(raw);
  if (!m) return null;
  try {
    return { body: Buffer.from(m[2], 'base64'), type: m[1] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

/** One of our own image URLs, capturing the index it points at. */
const OUR_URL = /\/products\/[^/]+\/image\/(\d+)(?:\.[a-z0-9]+)?(?:\?|$)/i;

/**
 * Turn any of our own image URLs back into the bytes they stand for.
 *
 * The seller's editor loads a product, then saves the whole thing back. Once
 * it is handed URLs instead of data, an untouched save would write those URLs
 * into `Product.images` — and the endpoint serving them reads that same
 * column, so every image on the site would resolve to a link to itself and
 * the originals would be gone. This maps each one back before it is stored.
 *
 * A genuinely new image arrives as a data URI and passes straight through,
 * and reordering is safe because the URL carries the index it came from.
 */
export function restoreImages(incoming: unknown[], stored: unknown[]): unknown[] {
  return incoming.map((v) => {
    const m = typeof v === 'string' ? OUR_URL.exec(v) : null;
    if (!m) return v;
    const original = stored[Number(m[1])];
    return original ?? v;
  });
}

/**
 * Cache forever — safe only because every URL carries the digest of the bytes
 * it serves (see `fingerprint`), so those bytes can never change.
 */
export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';
