import { createHash } from 'crypto';
import { extOfDataUri } from './product-images';

/**
 * A store's own images — logo, banner, hero background, banner strip, custom
 * page pictures — served as files rather than inlined.
 *
 * Same problem as product images (see common/product-images) and the other
 * half of it: those live on `Product`, these live on `Seller`, so fixing one
 * left the other. A store with three products was still shipping a 599 KB
 * page, nearly all of it the hero photograph, and the hero is the first thing
 * a shopper waits to see.
 *
 * Addressed by content rather than by field name, because these blobs are not
 * all in named columns: `logoUrl` and `bannerUrl` are, but the hero image, the
 * banner strip and any picture a seller put in a custom page are buried
 * wherever they happen to sit inside the `storeConfig` JSON. A digest of the
 * bytes identifies any of them without this module needing to know the shape
 * of that document — which also means a new image field added to the editor
 * tomorrow is served without touching this file.
 *
 * As with products, only PUBLIC payloads are rewritten. The Store Editor
 * loads `storeConfig` in order to save it back, and would otherwise write
 * these URLs over the images they stand for.
 */

const apiBase = () => (process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');

const DATA_URI = /^data:([a-z]+\/[a-z0-9.+-]+)?;base64,(.+)$/i;

/** Long enough that two of a seller's own images cannot collide. */
const digest = (raw: string) => createHash('sha1').update(raw).digest('hex').slice(0, 16);

/**
 * Replace every base64 image inside `value` with a URL, however deeply nested.
 *
 * Returns the value untouched when PUBLIC_API_URL is unset, so a missing
 * setting is slow rather than broken.
 */
export function withMediaUrls<T>(username: string, value: T): T {
  const base = apiBase();
  if (!base || !username) return value;

  const walk = (v: any): any => {
    if (typeof v === 'string') {
      if (!DATA_URI.test(v)) return v;
      // The extension is what tells the storefront a hero is a video rather
      // than a picture — see extFor in common/product-images.
      return `${base}/sellers/${encodeURIComponent(username)}/media/${digest(v)}.${extOfDataUri(v)}`;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      const out: Record<string, any> = {};
      for (const k of Object.keys(v)) out[k] = walk(v[k]);
      return out;
    }
    // Dates, numbers, null and anything class-based are left alone.
    return v;
  };

  return walk(value);
}

/** Every base64 image held anywhere in a seller's record. */
function collect(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') {
    if (DATA_URI.test(value)) into.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collect(v, into));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collect(v, into));
  }
  return into;
}

export interface SellerMedia {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  /** The raw JSON string as stored, or an already-parsed object. */
  storeConfig?: unknown;
}

/**
 * The bytes of whichever of this seller's images has the given digest.
 *
 * A miss is a 404: either the image was replaced — in which case the digest in
 * the URL no longer exists and no cache will ask for it again — or somebody
 * guessed, and there is nothing to say either way.
 */
export function mediaByDigest(seller: SellerMedia, hashWithExt: string): { body: Buffer; type: string } | null {
  const hash = String(hashWithExt).split('.')[0];
  if (!/^[0-9a-f]{8,40}$/.test(hash)) return null;

  const config = typeof seller.storeConfig === 'string'
    ? (() => { try { return JSON.parse(seller.storeConfig as string); } catch { return null; } })()
    : seller.storeConfig;

  for (const raw of collect([seller.logoUrl, seller.bannerUrl, config])) {
    if (digest(raw) !== hash) continue;
    const m = DATA_URI.exec(raw);
    if (!m) return null;
    try {
      return { body: Buffer.from(m[2], 'base64'), type: m[1] || 'application/octet-stream' };
    } catch {
      return null;
    }
  }
  return null;
}
