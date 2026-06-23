import Link from 'next/link';
import { Loop, Check, ShieldLock, Wallet, ArrowRight } from '@/components/icons';

export const metadata = {
  title: 'Loopy — Pricing',
  description: 'Free platform, fair pay-as-you-go processing. See how Loopy compares.',
};

const INCLUDED = [
  'Unlimited products & collections',
  'Stunning responsive themes & templates',
  'Complete product & stock manager',
  'Discount coupons & promo codes',
  'Built-in customer review system',
  'Mobile-friendly order dashboard',
  'Secure hosting & free subdomain',
];

const COMPARE = [
  { platform: 'Loopy', platformFee: '₹0', commission: '2.75% (to customer)', payout: 'Next-day UPI', highlight: true },
  { platform: 'DM2Buy', platformFee: '₹0', commission: '0%', payout: 'Next bank day' },
  { platform: 'Jettrips / ZThrifts', platformFee: 'Varies', commission: '1–5%+', payout: 'Not disclosed' },
  { platform: 'Instagram Shopping', platformFee: '₹0', commission: 'N/A (DM checkout)', payout: 'Manual' },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-paper text-navy">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={17} /></span> Loopy
          </Link>
          <Link href="/seller/login" className="rounded-lg bg-navy px-4 py-2 text-[14px] font-bold text-white">Start free</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 text-center sm:px-8">
        <span className="protect-pill"><ShieldLock size={12} /> No subscription. No lock-in.</span>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-[36px] font-extrabold leading-tight tracking-tight sm:text-[52px]">
          Free to run. <span className="vivid-text">Fair when you sell.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[16px] text-muted">The whole platform is free. A small processing fee is added at checkout — so running your store costs you nothing.</p>
      </section>

      {/* two cards: core platform + processing fees */}
      <section className="mx-auto grid max-w-5xl gap-5 px-5 pb-6 sm:px-8 lg:grid-cols-2">
        {/* core platform */}
        <div className="card p-8">
          <div className="font-display text-[14px] font-extrabold uppercase tracking-wide text-green-600">Core Platform</div>
          <p className="mt-1 text-[14px] text-muted">Free, fully-featured, and customizable out of the box.</p>
          <div className="mt-5 flex items-end gap-1">
            <span className="font-display text-[44px] font-extrabold">₹0</span>
            <span className="mb-2.5 text-[14px] font-semibold text-muted">platform fee</span>
          </div>
          <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-faint">What's included</div>
          <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-navy/80">
            {INCLUDED.map((i) => (
              <li key={i} className="flex items-center gap-2"><Check size={15} className="text-green-600" /> {i}</li>
            ))}
          </ul>
          <Link href="/seller/login" className="btn-green mt-7 w-full justify-center">Create your store <ArrowRight size={16} /></Link>
        </div>

        {/* processing fees */}
        <div className="seller-bg seller-grid relative overflow-hidden rounded-lg border border-white/10 p-8">
          <span className="inline-block rounded-md bg-green-500/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-green-500">Pay as you go</span>
          <h2 className="mt-4 font-display text-[22px] font-extrabold text-white">Processing Fees</h2>
          <p className="mt-1 text-[13.5px] text-[#8A98AD]">Normally charged to the customer at checkout.</p>
          <div className="mt-5">
            <div className="font-display text-[40px] font-extrabold text-white">2.75% <span className="text-[15px] font-semibold text-[#8A98AD]">for orders &gt; ₹150</span></div>
            <div className="mt-1 font-display text-[26px] font-extrabold text-white">₹2 flat <span className="text-[14px] font-semibold text-[#8A98AD]">for orders ≤ ₹150</span></div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[#8A98AD]">This fee is normally charged directly to the customer who places the order — keeping the platform 100% free for store owners.</p>
          <div className="mt-6 space-y-3">
            <Row icon={<Wallet size={18} />} title="Next-Day Settlements" sub="Balance settled to your UPI ID daily before 6:00 PM." />
            <Row icon={<ShieldLock size={18} />} title="Secure UPI Transfers" sub="Simple bank settlements via verified UPI registration." />
          </div>
        </div>
      </section>

      {/* comparison */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <h2 className="text-center font-display text-[28px] font-extrabold sm:text-[36px]">How Loopy compares</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[14px]">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-faint">
                <th className="pb-3 pl-4 font-bold">Platform</th>
                <th className="pb-3 font-bold">Platform fee</th>
                <th className="pb-3 font-bold">Commission</th>
                <th className="pb-3 font-bold">Payout</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((c) => (
                <tr key={c.platform} className={c.highlight ? 'bg-green-soft' : ''}>
                  <td className={`rounded-l-lg py-4 pl-4 font-display font-extrabold ${c.highlight ? 'text-green-700' : 'text-navy'}`}>
                    {c.platform}{c.highlight && <span className="ml-2 chip-green">You</span>}
                  </td>
                  <td className="py-4 font-semibold">{c.platformFee}</td>
                  <td className="py-4 text-muted">{c.commission}</td>
                  <td className="rounded-r-lg py-4 text-muted">{c.payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-[12.5px] text-faint">Loopy's fee covers escrow buyer protection, managed shipping, verified sellers and fraud scoring — the trust layer competitors don't include.</p>
      </section>

      <footer className="border-t border-line/70 py-8 text-center text-[12.5px] text-faint">
        © 2026 Loopy · <Link href="/terms" className="hover:text-navy">Terms</Link> · <Link href="/" className="hover:text-navy">Home</Link>
      </footer>
    </main>
  );
}

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-500/15 text-green-500">{icon}</span>
      <div>
        <div className="text-[14px] font-bold text-white">{title}</div>
        <div className="text-[12.5px] text-[#8A98AD]">{sub}</div>
      </div>
    </div>
  );
}
