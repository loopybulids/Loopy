import Link from 'next/link';
import { getDiscoverSSR } from '@/lib/server-api';
import { rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import ApiDown from '@/components/ApiDown';
import { ArrowRight, Star, Verified } from '@/components/icons';

// Storefront data is live — render per-request on the server, never prebuilt.
export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const stores = await getDiscoverSSR();
  if (!stores) return <ApiDown what="The shop" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight text-navy sm:text-[42px]">Discover <span className="vivid-text">verified stores</span></h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted">Every store is KYC-verified and every order is escrow-protected. Curated resale, beautifully boring trust.</p>

        <div className="mt-9 space-y-8">
          {stores.map((s: any) => (
            <section key={s.id} className="glass-card overflow-hidden rounded-3xl">
              <div className="flex items-center gap-4 border-b border-white/40 p-5">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-green-mint to-green-600 ring-2 ring-white/70 shadow-card">
                  {s.logoUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-display text-[18px] font-extrabold text-navy">{s.storeName} <Verified size={15} className="text-green-600" /></div>
                  <div className="flex items-center gap-2 text-[12.5px] text-muted"><span className="inline-flex items-center gap-0.5 text-amber"><Star size={11} /> {s.rating}</span> · {s.city} · {s.ratingCount >= 1000 ? (s.ratingCount / 1000).toFixed(1) + 'k' : s.ratingCount} followers</div>
                </div>
                <Link href={`/s/${s.username}`} className="btn-green !px-4 !py-2.5 text-[13px]">Visit store <ArrowRight size={15} /></Link>
              </div>
              <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
                {s.preview.map((p: any) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#caa07a] to-[#6b4a2f] shadow-card transition-shadow duration-500 group-hover:shadow-soft">
                      {p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />}
                      <span className="absolute left-2 top-2 rounded-full bg-green/90 px-2 py-0.5 text-[8.5px] font-bold uppercase text-white shadow backdrop-blur">Protected</span>
                    </div>
                    <div className="mt-2 truncate text-[12.5px] font-semibold text-navy">{p.title}</div>
                    <div className="font-display text-[14px] font-extrabold text-navy">{rupees(p.price)}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
