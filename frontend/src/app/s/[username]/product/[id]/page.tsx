'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { isVideo } from '@/lib/store-config';
import { addToCart, custApi, getCart, getCust } from '@/lib/customer';
import { SIZES } from '@/components/sizes';
import CustomerAuth from '@/components/store/CustomerAuth';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import ImageCarousel from '@/components/ImageCarousel';
import { Heart, ShieldLock, Truck, ArrowRight } from '@/components/icons';

export default function ProductPage() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.getProduct(id).then(setP).catch((e) => setErr(e?.message || 'Not found'));
    if (getCust(username)) custApi.wishlistIds(username).then((ids: string[]) => setWished(ids.includes(id))).catch(() => {});
  }, [id, username]);

  if (err) return <main className="grid min-h-screen place-items-center bg-paper text-center"><div><p className="text-rose">{err}</p><Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Back to store</Link></div></main>;
  if (!p) return <main className="grid min-h-screen place-items-center bg-paper text-muted">Loading…</main>;

  const images: string[] = p.images || [];
  const availSizes: string[] = p.sizes || [];
  const needSize = availSizes.length > 0;

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const add = (buyNow = false) => {
    if (needSize && !size) { notify('Please select a size'); return; }
    const sz = size || undefined;
    const alreadyIn = getCart(username).some((c) => c.productId === p.id && c.size === sz);
    if (buyNow) {
      // Buy now: don't stack a duplicate if it's already in the cart — just go there.
      if (!alreadyIn) addToCart(username, { productId: p.id, title: p.title, price: p.price, image: images[0], size: sz, qty });
      router.push(`/s/${username}/cart`);
    } else {
      addToCart(username, { productId: p.id, title: p.title, price: p.price, image: images[0], size: sz, qty });
      notify('Added to cart ✓');
    }
  };

  const toggleWish = async () => {
    if (!getCust(username)) { setAuthOpen(true); return; }
    try {
      if (wished) { await custApi.removeWishlist(username, p.id); setWished(false); }
      else { await custApi.addWishlist(username, p.id); setWished(true); notify('Saved to wishlist ♥'); }
    } catch { /* ignore */ }
  };

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} storeName={p.seller?.storeName} />
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        <Link href={`/s/${username}`} className="text-[13px] font-semibold text-muted hover:text-navy">← {p.seller?.storeName || 'Store'}</Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {/* gallery */}
          <div>
            {images.length ? (
              <ImageCarousel
                media={images}
                index={active}
                onIndexChange={setActive}
                fit="cover"
                showDots={false}
                className="aspect-square w-full"
                rounded="rounded-2xl border border-line bg-paper"
              />
            ) : (
              <div className="grid aspect-square place-items-center rounded-2xl border border-line bg-white text-faint">No image</div>
            )}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((im, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? 'border-green-600' : 'border-line'}`}>
                    {isVideo(im) ? <video src={im} className="h-full w-full object-cover" muted /> : <img src={im} alt="" className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* info */}
          <div>
            <h1 className="font-display text-[26px] font-extrabold leading-tight text-navy">{p.title}</h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[26px] font-extrabold text-navy">{rupees(p.price)}</span>
              {p.mrp && p.mrp > p.price && <><span className="text-[15px] text-faint line-through">{rupees(p.mrp)}</span><span className="chip-green">{Math.round((1 - p.price / p.mrp) * 100)}% OFF</span></>}
            </div>
            {p.brand && <div className="mt-1 text-[13px] text-muted">{p.brand}</div>}

            {/* sizes */}
            {needSize && (
              <div className="mt-5">
                <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-faint">Select size</div>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => {
                    const avail = availSizes.includes(s);
                    return (
                      <button key={s} disabled={!avail} onClick={() => setSize(s)}
                        className={`min-w-[46px] rounded-lg border px-3 py-2 text-[13px] font-bold transition ${size === s ? 'border-green bg-green text-white' : avail ? 'border-line bg-white text-navy hover:border-green/50' : 'cursor-not-allowed border-line bg-paper text-faint line-through opacity-60'}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* variants */}
            {p.variants?.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-faint">Options</div>
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((v: any, i: number) => <span key={i} className="rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold text-navy">{v.label}{v.price ? ` · ${rupees(v.price)}` : ''}</span>)}
                </div>
              </div>
            )}

            {/* qty */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-[12px] font-bold uppercase tracking-wide text-faint">Qty</span>
              <div className="flex items-center gap-3 rounded-lg border border-line px-2 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 text-lg text-muted">−</button>
                <span className="w-6 text-center font-bold text-navy">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-2 text-lg text-muted">+</button>
              </div>
              <span className={`text-[12px] font-semibold ${p.quantity > 0 ? 'text-green-600' : 'text-rose'}`}>{p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}</span>
            </div>

            {/* actions */}
            <div className="mt-6 flex gap-3">
              <button onClick={() => add(false)} disabled={p.quantity <= 0} className="btn-ghost flex-1 justify-center disabled:opacity-50">Add to cart</button>
              <button onClick={() => add(true)} disabled={p.quantity <= 0} className="btn-green flex-1 justify-center disabled:opacity-50">Buy now <ArrowRight size={15} /></button>
              <button onClick={toggleWish} className={`grid h-11 w-11 place-items-center rounded-xl border ${wished ? 'border-rose bg-rose-soft text-rose' : 'border-line text-muted hover:text-rose'}`}><Heart size={18} /></button>
            </div>

            {/* trust */}
            <div className="mt-5 flex flex-wrap gap-4 text-[12.5px] text-muted">
              <span className="flex items-center gap-1.5"><ShieldLock size={14} className="text-green-600" /> Loopy-protected payment</span>
              <span className="flex items-center gap-1.5"><Truck size={14} className="text-green-600" /> Tracked shipping</span>
            </div>

            {p.sizeChartUrl && (
              <details className="mt-4">
                <summary className="cursor-pointer text-[13px] font-bold text-green-600">View size chart</summary>
                <img src={p.sizeChartUrl} alt="Size chart" className="mt-2 w-full max-w-sm rounded-lg border border-line" />
              </details>
            )}
          </div>
        </div>

        {/* full-width product details — keeps the page full on mobile & desktop */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-6 lg:col-span-2">
            <h2 className="font-display text-[16px] font-extrabold text-navy">Product details</h2>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-navy/80">
              {p.description?.trim() ? p.description : 'No description provided for this product.'}
            </p>
            {(p.brand || p.category || p.condition || availSizes.length > 0) && (
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-3">
                {p.brand && <Attr label="Brand" value={p.brand} />}
                {p.category && <Attr label="Category" value={p.category} />}
                {p.condition && <Attr label="Condition" value={p.condition} />}
                {availSizes.length > 0 && <Attr label="Sizes" value={availSizes.join(', ')} />}
                <Attr label="Availability" value={p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'} />
              </dl>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="font-display text-[15px] font-extrabold text-navy">Why buy here</h3>
            <ul className="mt-3 space-y-3 text-[13px] text-navy/80">
              <li className="flex items-start gap-2.5"><ShieldLock size={16} className="mt-0.5 shrink-0 text-green-600" /> Payment held in Loopy escrow until you confirm delivery.</li>
              <li className="flex items-start gap-2.5"><Truck size={16} className="mt-0.5 shrink-0 text-green-600" /> Tracked shipping on every order.</li>
              <li className="flex items-start gap-2.5"><Heart size={16} className="mt-0.5 shrink-0 text-green-600" /> Save items to your wishlist and buy later.</li>
            </ul>
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-bold text-white shadow-lift">{toast}</div>}
      {authOpen && <CustomerAuth username={username} storeName={p.seller?.storeName} onClose={() => setAuthOpen(false)} onAuthed={() => { setAuthOpen(false); toggleWish(); }} />}
    </main>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold text-navy">{value}</dd>
    </div>
  );
}
