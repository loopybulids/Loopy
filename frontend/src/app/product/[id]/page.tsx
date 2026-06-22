import Link from 'next/link';
import { getProductSSR } from '@/lib/server-api';
import { rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import ProductActions from '@/components/ProductActions';
import ApiDown from '@/components/ApiDown';
import { Back, Shield, ShieldLock, Star, Truck, Verified } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductSSR(id);
  if (!p) return <ApiDown what="This product" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[40vw] w-[40vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-12%] top-[12%] h-[34vw] w-[34vw] bg-green-600/60" style={{ animationDelay: '-6s' }} />
        <div className="absolute inset-0 grain" />
      </div>
      <StoreNav />
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-8 sm:px-8 md:grid-cols-2">
        <div>
          <Link href={`/s/${p.seller.username}`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-navy"><Back size={16} /> Back to store</Link>
          <div className="group relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#caa07a] to-[#6b4a2f] shadow-soft">
            {p.images?.[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow backdrop-blur"><Shield size={11} /> Loopy Protected</span>
          </div>
        </div>

        <div className="md:pt-8">
          <div className="text-[11px] font-bold uppercase tracking-[.16em] text-muted">{p.brand}</div>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="font-display text-[28px] font-extrabold leading-tight text-navy">{p.title}</h1>
            <div className="font-display text-[28px] font-extrabold vivid-text">{rupees(p.price)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip-green">{p.condition}</span>
            <span className="chip-navy">Size {p.size}</span>
            {p.quantity <= 1 && <span className="chip-amber">1 left · one-of-one</span>}
          </div>

          <div className="glass-card mt-5 flex items-start gap-3 rounded-2xl p-4">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white text-green-600 shadow-sm"><ShieldLock size={18} /></span>
            <p className="text-[12.5px] leading-snug text-green"><b>Buyer protection included.</b> Your payment stays in Loopy Escrow and is released to the seller only after you confirm delivery, with a 48h inspection window.</p>
          </div>

          <div className="glass-card mt-4 flex items-center gap-3 rounded-2xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-green-mint to-green-600 font-display font-bold text-white shadow-card">{p.seller.storeName[0]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm font-bold text-navy">{p.seller.storeName} <Verified size={14} className="text-green-600" /></div>
              <div className="flex items-center gap-2 text-xs text-muted"><span className="inline-flex items-center gap-0.5 text-amber"><Star size={11} /> {p.seller.rating}</span> · KYC Verified · {p.seller.city}</div>
            </div>
            <Link href={`/s/${p.seller.username}`} className="btn-ghost !px-3 !py-2 text-[12px]">Visit</Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[12.5px] text-muted"><Truck size={16} className="text-navy" /> Managed shipping · auto-generated label · delivered in 3–5 days</div>

          <div className="mt-5 text-sm font-bold text-navy">The details</div>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.description}</p>
        </div>
      </div>
      <ProductActions product={p} />
    </main>
  );
}
