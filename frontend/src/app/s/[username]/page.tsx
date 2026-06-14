import { getStoreSSR } from '@/lib/server-api';
import StoreNav from '@/components/StoreNav';
import ProductCard from '@/components/ProductCard';
import ApiDown from '@/components/ApiDown';
import { Check, Shield } from '@/components/icons';

// Server-rendered: products are in the HTML on first paint (PRD: SSR storefront).
export default async function StorePage({ params }: { params: { username: string } }) {
  const store = await getStoreSSR(params.username);
  if (!store) return <ApiDown what="This store" />;

  return (
    <main className="min-h-screen bg-cream">
      <StoreNav />

      {/* hero */}
      <div className="relative h-[300px] overflow-hidden bg-[#2a2018]">
        {store.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,14,10,.1)] via-[rgba(20,14,10,.3)] to-[rgba(20,14,10,.78)]" />
        <div className="absolute inset-x-6 bottom-7 z-10 flex items-end gap-5 text-white sm:inset-x-10">
          <div className="h-[78px] w-[78px] flex-none overflow-hidden rounded-full border-[3px] border-white/90 shadow-lg">
            {store.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[.26em] text-white/80">Curated vintage · {store.city}</div>
            <h1 className="mt-2 font-serif text-[40px] font-semibold leading-none tracking-tight">{store.storeName}</h1>
            <div className="mt-2.5 flex items-center gap-2 text-[13px] text-white/90">
              <span className="inline-flex items-center gap-1 font-bold">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-indigo"><Check size={11} /></span>Verified
              </span>
              <span className="opacity-50">·</span>
              <span className="text-amber">★</span> {store.rating} ({store.ratingCount})
              <span className="opacity-50">·</span> ships in 2 days
            </div>
          </div>
        </div>
      </div>

      {/* trust line */}
      <div className="trustline border-b border-[#EBE2D2] bg-[#F4EEE3] px-6 py-3 sm:px-10">
        <Shield size={17} className="text-trust" />
        <span><b className="text-[#2c271d]">Protected by Loopy.</b> Your payment is held in escrow until you confirm delivery — managed shipping &amp; returns on every order.</span>
      </div>

      {/* products */}
      <div className="flex items-center px-6 pb-1 pt-6 sm:px-10">
        <div className="flex items-center gap-2 font-serif text-[19px] tracking-tight">
          <span className="h-[7px] w-[7px] rounded-full bg-coral shadow-[0_0_0_3px_rgba(255,107,94,.22)]" />
          New drop · {store.products.length} pieces
        </div>
        <div className="ml-auto hidden gap-5 text-[12.5px] font-semibold text-faint sm:flex">
          <a className="text-ink underline-offset-4">All</a><a>Dresses</a><a>Outerwear</a><a>Bags</a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 px-6 pb-16 pt-4 sm:px-10 md:grid-cols-3 lg:grid-cols-4">
        {store.products.map((p: any, i: number) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </main>
  );
}
