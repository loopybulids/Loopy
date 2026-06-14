import Link from 'next/link';
import { Loop, Shield } from '@/components/icons';

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      <nav className="flex h-[74px] items-center gap-7 px-5 sm:px-12">
        <div className="flex items-center gap-2.5 font-serif text-[22px] font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-2 to-indigo text-white"><Loop size={18} /></span>
          Loopy
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/admin/login" className="hidden text-sm font-bold text-ink2 sm:block">Admin</Link>
          <Link href="/seller/login" className="text-sm font-bold text-ink2">Seller login</Link>
          <Link href="/s/riyathrifts" className="btn-pri">Visit a live store</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <span className="chip bg-coral-soft text-[#c8463a]">● Now onboarding pilot sellers</span>
          <h1 className="mt-4 font-serif text-[44px] font-semibold leading-[1.04] tracking-tight sm:text-[54px]">
            Your thrift store,<br />
            <span className="bg-gradient-to-r from-indigo-2 to-coral bg-clip-text text-transparent">protected end-to-end.</span>
          </h1>
          <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-muted">
            Turn your Instagram drops into a real storefront — with built-in payments, escrow buyer protection, and managed shipping. Go live in minutes, get paid without the DM chaos.
          </p>
          <div className="mt-7 flex gap-3">
            <Link href="/s/riyathrifts" className="btn-pri">Browse the demo store →</Link>
            <Link href="/seller/dashboard" className="btn-gh">Seller dashboard</Link>
          </div>
          <div className="mt-9 flex gap-8">
            <div><div className="font-serif text-[26px] font-semibold">5%</div><div className="text-xs text-muted">flat fee, no subscription</div></div>
            <div><div className="font-serif text-[26px] font-semibold">48h</div><div className="text-xs text-muted">protected payout hold</div></div>
            <div><div className="font-serif text-[26px] font-semibold">&lt;1 day</div><div className="text-xs text-muted">store to first sale</div></div>
          </div>
        </div>
        <div className="relative h-[380px]">
          <div className="absolute left-6 top-2 w-[320px] overflow-hidden rounded-[18px] border border-line bg-white shadow-soft">
            <div className="relative h-[220px] bg-gradient-to-br from-[#C9BCFF] to-[#7B61FF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=70" alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">Riya’s Thrift Loop</span>
            </div>
            <div className="p-4">
              <div className="font-serif text-[17px]">Y2K floral slip dress</div>
              <div className="text-xs text-muted">M · Like new</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-serif text-[18px] font-semibold">₹649</span>
                <span className="btn-pri !px-3 !py-2 !text-xs">Add to bag</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-32 w-[230px] rounded-[18px] border border-line bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-trust-soft text-trust"><Shield size={18} /></span>
              <div><div className="text-sm font-bold">Protected by Loopy</div><div className="text-xs text-muted">Money held till delivery</div></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-[210px] rounded-[18px] border border-line bg-white p-4 shadow-soft">
            <div className="text-[11px] font-bold text-muted">PAYOUT RELEASED</div>
            <div className="mt-1 font-serif text-[22px] font-semibold">₹4,250 <span className="chip bg-trust-soft text-[#157a4b] align-middle">✓ Paid</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
