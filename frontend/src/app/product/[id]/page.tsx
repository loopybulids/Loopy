import Link from 'next/link';
import { getProductSSR } from '@/lib/server-api';
import { rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import ProductActions from '@/components/ProductActions';
import ApiDown from '@/components/ApiDown';
import { Back, Check, Heart, Shield } from '@/components/icons';

// Server-rendered product detail; the add-to-cart bar is a client island.
export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProductSSR(params.id);
  if (!p) return <ApiDown what="This product" />;

  return (
    <main className="min-h-screen bg-cream pb-28">
      <StoreNav />
      <div className="mx-auto max-w-5xl gap-10 px-5 py-6 sm:px-8 md:grid md:grid-cols-2">
        {/* gallery */}
        <div>
          <Link href={`/s/${p.seller.username}`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Back size={16} /> Back to store
          </Link>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-[#C9BCFF] to-[#7B61FF]">
            {p.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink"><Heart size={18} /></span>
          </div>
        </div>

        {/* info */}
        <div className="mt-6 md:mt-9">
          <div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{p.brand}</div>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="max-w-[14rem] font-serif text-[26px] font-semibold leading-tight">{p.title}</h1>
            <div className="font-serif text-[26px] font-semibold">{rupees(p.price)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip bg-trust-soft text-[#157a4b]">{p.condition}</span>
            <span className="chip bg-[#F0EEF4] text-muted">Size {p.size}</span>
            {p.quantity <= 1 && <span className="chip bg-amber-soft text-[#9a6406]">1 left</span>}
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#C9ECD8] bg-trust-soft px-3.5 py-3">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-white text-trust shadow"><Shield size={18} /></span>
            <p className="text-[11.5px] font-medium leading-snug text-[#176c44]">
              <b>Buyer protection included.</b> Money is released to the seller only after you confirm delivery.
            </p>
          </div>

          <div className="card mt-4 flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#FF8FB0] to-[#F2557E] font-serif font-bold text-white">{p.seller.storeName[0]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm font-bold">{p.seller.storeName}
                <span className="grid h-[13px] w-[13px] place-items-center rounded-full bg-indigo text-white"><Check size={9} /></span>
              </div>
              <div className="text-xs text-muted"><span className="text-amber">★</span> {p.seller.rating} · {p.seller.city}</div>
            </div>
          </div>

          <div className="mt-4 text-sm font-bold">The details</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.description}</p>
        </div>
      </div>

      <ProductActions product={p} />
    </main>
  );
}
