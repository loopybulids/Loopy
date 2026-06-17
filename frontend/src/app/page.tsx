'use client';
import Link from 'next/link';
import { motion, Reveal, Stagger, StaggerItem, WordReveal, CountUp, Magnetic, Tilt } from '@/components/motion';
import { ArrowRight, Bag, Bolt, Loop, ShieldLock, Sparkle, Star, Store, Truck, Verified } from '@/components/icons';

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-paper text-navy">
      {/* ───── animated aurora background ───── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[42vw] w-[42vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/70" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob animate-aurora absolute bottom-[-12%] left-[28%] h-[36vw] w-[36vw] bg-navy/30" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      {/* ───── top bar ───── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2 font-display text-[26px] font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-green-mint"><Loop size={20} /></span>
          Loopy
        </div>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/login" className="rounded-full px-4 py-2 text-navy/80 transition-colors hover:bg-white/60 hover:text-navy">Shop in</Link>
          <Link href="/seller/login" className="rounded-full bg-navy px-4 py-2 text-white transition-transform hover:scale-[1.03]">Seller in</Link>
        </nav>
      </header>

      {/* ───── hero ───── */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-10 text-center sm:px-8 sm:pt-16">
        <Reveal>
          <span className="protect-pill mx-auto"><ShieldLock size={12} /> Verified Integrity Social Commerce</span>
        </Reveal>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-[68px]">
          <WordReveal text="Thrift you can" />{' '}
          <span className="vivid-text"><WordReveal text="actually trust." delay={0.35} /></span>
        </h1>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-muted sm:text-[18px]">
            One platform, two worlds. Discover one-of-one pieces as a shopper, or turn your
            closet into a store as a seller — every order held in escrow until it lands.
          </p>
        </Reveal>

        {/* ───── the two worlds: role choice ───── */}
        <Stagger className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2" gap={0.14}>
          {/* SHOPPER — light · glassy · vibrant */}
          <StaggerItem>
            <Tilt max={8}>
              <div className="glass-card group relative flex h-full flex-col items-start overflow-hidden rounded-3xl p-7 text-left">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-mint/50 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-green-600 shadow-card"><Bag size={22} /></span>
                <h2 className="mt-5 font-display text-[24px] font-extrabold text-navy">I&apos;m a Shopper</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  Browse curated, authenticated finds from verified stores. Buy with full
                  buyer protection — your money is safe until you confirm delivery.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] font-semibold text-navy/80">
                  <li className="flex items-center gap-2"><Verified size={15} className="text-green-600" /> Authenticity checked</li>
                  <li className="flex items-center gap-2"><ShieldLock size={15} className="text-green-600" /> Escrow-protected checkout</li>
                  <li className="flex items-center gap-2"><Truck size={15} className="text-green-600" /> Managed, tracked shipping</li>
                </ul>
                <Magnetic className="mt-6 w-full">
                  <Link href="/login" className="btn-green w-full justify-center group-hover:brightness-110">
                    Start shopping <ArrowRight size={16} />
                  </Link>
                </Magnetic>
              </div>
            </Tilt>
          </StaggerItem>

          {/* SELLER — dark · sharp · SaaS */}
          <StaggerItem>
            <Tilt max={8}>
              <div className="seller-bg seller-grid group relative flex h-full flex-col items-start overflow-hidden rounded-3xl border border-white/10 p-7 text-left">
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-green-500/30 blur-3xl transition-transform duration-500 group-hover:scale-125" />
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/15 text-green-500 ring-1 ring-green-500/30"><Store size={22} /></span>
                <h2 className="mt-5 font-display text-[24px] font-extrabold text-white">I&apos;m a Seller</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#8A98AD]">
                  Launch a real storefront in minutes. List items, manage orders, and get
                  paid out fast — with a dashboard built for moving inventory.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] font-semibold text-[#C7D2E0]">
                  <li className="flex items-center gap-2"><Bolt size={15} className="text-green-500" /> List an item in seconds</li>
                  <li className="flex items-center gap-2"><Sparkle size={15} className="text-green-500" /> Live order queue &amp; analytics</li>
                  <li className="flex items-center gap-2"><Verified size={15} className="text-green-500" /> Instant escrow payouts</li>
                </ul>
                <Magnetic className="mt-6 w-full">
                  <Link href="/seller/login" className="s-btn w-full">
                    Open your store <ArrowRight size={16} />
                  </Link>
                </Magnetic>
              </div>
            </Tilt>
          </StaggerItem>
        </Stagger>
      </section>

      {/* ───── trust stats ───── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Reveal>
          <div className="glass-panel grid grid-cols-2 gap-6 rounded-3xl px-6 py-8 sm:grid-cols-4">
            {[
              { to: 120000, suffix: '+', label: 'Protected orders' },
              { to: 4.9, decimals: 1, suffix: '★', label: 'Avg store rating' },
              { to: 100, suffix: '%', label: 'Money-back guarantee' },
              { to: 48, suffix: 'h', label: 'Inspection window' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-[28px] font-extrabold text-navy sm:text-[34px]">
                  <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals || 0} />
                </div>
                <div className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───── how the loop works ───── */}
      <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <Reveal><h3 className="text-center font-display text-[28px] font-extrabold text-navy sm:text-[36px]">How the loop closes</h3></Reveal>
        <Stagger className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { icon: <Store size={20} />, t: 'Seller lists', d: 'A verified store posts an item. It appears instantly in the shopper feed.' },
            { icon: <ShieldLock size={20} />, t: 'Buyer pays into escrow', d: 'Money is held safely by Loopy — never sent straight to the seller.' },
            { icon: <Star size={20} />, t: 'Delivered & released', d: 'On confirmed delivery, the seller is paid and both sides rate the loop.' },
          ].map((s, i) => (
            <StaggerItem key={s.t}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="glass-card h-full rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-green-mint">{s.icon}</span>
                  <span className="font-display text-sm font-extrabold text-faint">0{i + 1}</span>
                </div>
                <div className="mt-4 font-display text-[18px] font-bold text-navy">{s.t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn-navy">Browse the marketplace <ArrowRight size={16} /></Link>
            <Link href="/seller/login" className="btn-outline">Become a seller</Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line/70 py-8 text-center text-[12.5px] text-faint">
        © 2026 Loopy · Verified Integrity Social Commerce
      </footer>
    </main>
  );
}
