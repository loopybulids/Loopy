'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, Reveal, Stagger, StaggerItem, WordReveal, CountUp, Magnetic, Tilt } from '@/components/motion';
import {
  ArrowRight, Bolt, Check, Loop, Plus, Share,
  ShieldLock, Star, Store, Truck, Verified, Wallet,
} from '@/components/icons';

/* ──────────────────────────────────────────────────────────────
   DM2Order-style marketing landing — built on Loopy's design system.
   Sections: nav · hero+flow · stats · problem · solution · features
   · testimonials · pricing · faq · footer
   ────────────────────────────────────────────────────────────── */

// Brand logos shown in the "trusted by" row (Clearbit logo API).
const BRANDS = [
  { name: 'Zara', domain: 'zara.com' },
  { name: 'H&M', domain: 'hm.com' },
  { name: 'Levi\'s', domain: 'levi.com' },
  { name: 'Nike', domain: 'nike.com' },
  { name: 'Uniqlo', domain: 'uniqlo.com' },
];

const SOLUTIONS = [
  { icon: <Share size={20} />, t: 'Chat to order', d: 'Turn any DM into a structured order in seconds.' },
  { icon: <Bolt size={20} />, t: 'Instant checkout links', d: 'Pre-filled carts your customer pays in one tap.' },
  { icon: <Store size={20} />, t: 'Centralized dashboard', d: 'Every order, payment and shipment in one place.' },
  { icon: <ShieldLock size={20} />, t: 'Automated notifications', d: 'Order, payment and delivery updates on autopilot.' },
  { icon: <Truck size={20} />, t: 'Shipping management', d: 'Generate labels and track every shipment live.' },
  { icon: <Star size={20} />, t: 'Analytics', d: 'Revenue, conversion and product insights at a glance.' },
];

const TESTIMONIALS = [
  { name: 'Riya Mehta', store: '@vintagefinds.in', quote: 'I used to lose half my DMs. Now every chat becomes a paid order — my revenue doubled in two months.', growth: '+118% revenue', avatar: 'bg-rose' },
  { name: 'Arjun Nair', store: '@thesneakerloop', quote: 'Checkout links killed the payment chasing. Customers pay instantly and I ship the same day.', growth: '+74% orders', avatar: 'bg-navy-600' },
  { name: 'Sana Kapoor', store: '@sanas.closet', quote: 'One dashboard for orders, payments and shipping. It finally feels like a real business, not a side hustle.', growth: '+2.3x AOV', avatar: 'bg-green-500' },
];

const FAQS = [
  { q: 'How does a DM become an order?', a: 'Pick a product, generate a checkout link, paste it in chat. Your customer pays and the order lands in your dashboard.' },
  { q: 'Do I need a website?', a: 'No — you get a hosted storefront the moment you sign up.' },
  { q: 'Which payments are supported?', a: 'UPI, cards, net banking and wallets.' },
  { q: 'How do payouts work?', a: 'Funds are held in escrow and settled to your bank after delivery is confirmed.' },
  { q: 'Can I track inventory?', a: 'Yes — stock updates automatically as orders come in, with low-stock alerts.' },
  { q: 'Is there a free plan?', a: 'Yes. Storefront, unlimited products and checkout links — no card required.' },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen bg-paper text-navy">
      {/* ───── animated aurora background (fixed so it never traps scroll) ───── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob animate-aurora absolute -left-24 -top-24 h-[42vw] w-[42vw] bg-green-mint" />
        <div className="aurora-blob animate-aurora absolute right-[-10%] top-[8%] h-[34vw] w-[34vw] bg-green-600/70" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob animate-aurora absolute bottom-[-12%] left-[28%] h-[36vw] w-[36vw] bg-navy/20" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 grain" />
      </div>

      {/* ───── top bar ───── */}
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2 font-display text-[26px] font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-green-mint"><Loop size={20} /></span>
          Loopy
        </div>
        <nav className="hidden items-center gap-1 text-[15px] font-semibold text-navy/75 md:flex">
          <a href="#how" className="rounded-full px-3 py-2 transition-colors hover:text-navy">How it works</a>
          <a href="#faq" className="rounded-full px-3 py-2 transition-colors hover:text-navy">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/seller/login" className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-navy/80 transition-colors hover:bg-white/60 hover:text-navy">Log in</Link>
          <Link href="/seller/login" className="rounded-full bg-navy px-5 py-2.5 text-[14px] font-bold text-white transition-transform hover:scale-[1.03]">Start Selling</Link>
        </div>
      </header>

      {/* ───── hero ───── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-6 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="text-left">
          <Reveal>
            <span className="protect-pill"><ShieldLock size={12} /> The most trusted way to thrift in India</span>
          </Reveal>
          <h1 className="mt-6 max-w-xl font-display text-[44px] font-extrabold leading-[1.04] tracking-tight sm:text-[64px]">
            <WordReveal text="Your thrift store," />{' '}
            <span className="vivid-text"><WordReveal text="protected end-to-end" delay={0.3} /></span>
          </h1>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-balance text-[16px] leading-relaxed text-muted sm:text-[18px]">
              Turn your Instagram DMs into a real storefront with built-in escrow protection.
              No more ghosting, no more payment anxiety.
            </p>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <Link href="/seller/login" className="btn-navy">Create Your Store <ArrowRight size={16} /></Link>
              </Magnetic>
              <a href="#how" className="btn-ghost">How it works</a>
            </div>
          </Reveal>
          <Reveal delay={0.42}>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {BRANDS.map((b) => (
                  <span key={b.domain} className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white shadow-card ring-2 ring-paper">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=128`}
                      alt={b.name}
                      className="h-full w-full object-contain p-1.5"
                      onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                    />
                  </span>
                ))}
              </div>
              <p className="text-[14px] text-muted">
                Trusted by <span className="font-bold text-navy">125+</span> sellers across India
              </p>
            </div>
          </Reveal>
        </div>

        {/* hero visual — the protected-order product card */}
        <Reveal delay={0.25}>
          <Tilt max={7}>
            <div className="glass-card relative mx-auto w-full max-w-[420px] rounded-[28px] p-4 sm:p-5">
              {/* seller header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                  <div>
                    <div className="flex items-center gap-1 font-display text-[15px] font-extrabold text-navy">
                      @VintageFindsIn <Verified size={15} className="text-green-600" />
                    </div>
                    <div className="text-[12px] text-muted">Verified Seller</div>
                  </div>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-green-soft text-green-600"><Check size={15} /></span>
              </div>

              {/* product image + floating badges */}
              <div className="relative mt-4 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=72"
                  alt="Classic Leather Boots"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-card">
                  <ShieldLock size={12} /> Loopy Protected
                </span>
                <span className="absolute -left-1 top-14 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-navy shadow-card">
                  <Truck size={14} className="text-green-600" /> Auto label created
                </span>
              </div>

              {/* product meta */}
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-[19px] font-extrabold text-navy">Classic Leather Boots</div>
                  <div className="mt-0.5 font-display text-[22px] font-extrabold text-navy">₹2,499</div>
                </div>
                <button className="btn-green shrink-0 self-center">Buy with Protection</button>
              </div>

              {/* escrow strip */}
              <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-green-soft px-4 py-3 text-[13px] font-semibold text-green">
                <ShieldLock size={15} /> Money held in Loopy Escrow
                <span className="absolute -top-4 right-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-navy shadow-card">
                  <Wallet size={14} className="text-amber" /> ₹2,499 released
                </span>
              </div>
            </div>
          </Tilt>
        </Reveal>
      </section>

      {/* ───── trust stats ───── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Reveal>
          <div className="glass-panel grid grid-cols-2 gap-6 rounded-3xl px-6 py-8 sm:grid-cols-4">
            {[
              { to: 500, suffix: '+', label: 'Orders processed' },
              { to: 125, suffix: '', label: 'Active sellers' },
              { to: 30, suffix: 's', label: 'Chat to checkout' },
              { to: 48, suffix: 'h', label: 'Protected payout' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-[28px] font-extrabold text-navy sm:text-[34px]">
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───── solution ───── */}
      <section id="how" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12 sm:px-8">
        <Reveal>
          <p className="text-center text-[13px] font-extrabold uppercase tracking-widest text-green-600">The solution</p>
          <h2 className="mt-3 text-center font-display text-[30px] font-extrabold text-navy sm:text-[40px]">Everything organized in one place</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <StaggerItem key={s.t}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="glass-card h-full rounded-2xl p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-green-mint">{s.icon}</span>
                <div className="mt-4 font-display text-[17px] font-bold text-navy">{s.t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ───── testimonials ───── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <h2 className="text-center font-display text-[30px] font-extrabold text-navy sm:text-[40px]">Sellers who closed the loop</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <div className="glass-card flex h-full flex-col rounded-3xl p-7">
                <div className="flex items-center gap-1 text-amber">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} />)}
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-navy/85">“{t.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-full font-display text-[15px] font-extrabold text-white ${t.avatar}`}>{t.name[0]}</span>
                  <div>
                    <div className="font-display text-[15px] font-bold text-navy">{t.name}</div>
                    <div className="text-[12.5px] text-muted">{t.store}</div>
                  </div>
                  <span className="ml-auto chip-green">{t.growth}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ───── faq ───── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-16 sm:px-8">
        <Reveal>
          <h2 className="text-center font-display text-[30px] font-extrabold text-navy sm:text-[40px]">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ───── final CTA ───── */}
      <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <Reveal>
          <div className="seller-bg seller-grid relative overflow-hidden rounded-[32px] border border-white/10 px-8 py-14 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-500/20 blur-3xl" />
            <h2 className="font-display text-[30px] font-extrabold text-white sm:text-[40px]">Start turning chats into checkouts today</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#8A98AD]">Set up your store, drop your first checkout link, and get paid — all in the next few minutes.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic><Link href="/seller/login" className="btn-green">Create your store <ArrowRight size={16} /></Link></Magnetic>
              <a href="#how" className="s-btn">See how it works</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───── footer ───── */}
      <footer className="border-t border-line/70 bg-white/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={17} /></span>
              Loopy
            </div>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-muted">Conversational commerce that turns Instagram DMs and WhatsApp chats into real, protected orders.</p>
          </div>
          <div>
            <div className="font-display text-[13px] font-extrabold uppercase tracking-wide text-navy">Company</div>
            <ul className="mt-3 space-y-2 text-[14px] text-muted">
              {[
                { l: 'Terms', href: '/terms' },
                { l: 'Privacy Policy', href: '/terms#privacy' },
                { l: 'Refund Policy', href: '/terms#refunds' },
                { l: 'Contact', href: '/terms#contact' },
              ].map((x) => (
                <li key={x.l}><Link href={x.href} className="transition-colors hover:text-navy">{x.l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-display text-[13px] font-extrabold uppercase tracking-wide text-navy">Follow</div>
            <ul className="mt-3 space-y-2 text-[14px] text-muted">
              {['Instagram', 'Facebook', 'LinkedIn', 'YouTube'].map((l) => (
                <li key={l}><a className="transition-colors hover:text-navy">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-line/70 py-6 text-center text-[12.5px] text-faint">
          © 2026 Loopy · Conversational commerce for social sellers
        </div>
      </footer>
    </main>
  );
}

/* ───── FAQ accordion item ───── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white/70">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-[15.5px] font-bold text-navy">{q}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-soft text-green-600 transition-transform ${open ? 'rotate-45' : ''}`}><Plus size={15} /></span>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
        <p className="px-5 pb-5 text-[14px] leading-relaxed text-muted">{a}</p>
      </motion.div>
    </div>
  );
}
