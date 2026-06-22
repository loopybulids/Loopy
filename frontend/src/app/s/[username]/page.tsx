import { getStoreSSR } from '@/lib/server-api';
import StoreNav from '@/components/StoreNav';
import ProductCard from '@/components/ProductCard';
import ApiDown from '@/components/ApiDown';
import { Clock, Share, Star, Verified } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function StorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const store = await getStoreSSR(username);
  if (!store) return <ApiDown what="This store" />;
  const cats = ['All Items', 'Outerwear', 'Denim', 'Accessories', 'Knitwear'];

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[6%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* profile card */}
        <div className="glass-card flex flex-col items-start gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="h-[76px] w-[76px] overflow-hidden rounded-full bg-gradient-to-br from-green-mint to-green-600 ring-4 ring-white/70 shadow-card">
              {store.logoUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-green-600 text-white shadow"><Verified size={12} /></span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-extrabold text-navy">{store.storeName}</h1>
              <span className="chip-amber"><Clock size={12} /> NEXT DROP: 2D 14H</span>
            </div>
            <p className="mt-1 text-[13.5px] text-muted">{store.description}</p>
            <div className="mt-2.5 flex gap-6 text-[13px]">
              <div><span className="font-bold text-navy">{store.ratingCount >= 1000 ? (store.ratingCount / 1000).toFixed(1) + 'k' : store.ratingCount}+</span> <span className="text-muted">Followers</span></div>
              <div><span className="font-bold text-navy">{store.rating}/5</span> <span className="text-muted">Rating</span></div>
              <div><span className="font-bold text-navy">{store.products.length}+</span> <span className="text-muted">Listed</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="btn-green !cursor-default !px-3.5 !py-2.5 text-[13px]"><Verified size={15} /> Verified Curator</span>
            <button className="btn-navy !px-5 !py-2.5 text-[13px]">Follow</button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/70 text-navy backdrop-blur transition-colors hover:text-green-600"><Share size={16} /></button>
          </div>
        </div>

        {/* filters */}
        <div className="mt-7 flex items-center gap-2 overflow-x-auto no-sb">
          {cats.map((c, i) => (
            <button key={c} className={`chip whitespace-nowrap !px-4 !py-2 text-[12.5px] transition-colors ${i === 0 ? 'bg-navy text-white' : 'border border-white/60 bg-white/70 text-muted backdrop-blur hover:text-navy'}`}>{c}</button>
          ))}
          <div className="ml-auto hidden items-center gap-1.5 whitespace-nowrap text-[12.5px] text-muted sm:flex">Sort by: <b className="text-navy">Recently Added</b></div>
        </div>

        {/* grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {store.products.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>

        <div className="mt-9 flex justify-center">
          <button className="btn-outline">Load More Curated Items</button>
        </div>
      </div>
    </main>
  );
}
