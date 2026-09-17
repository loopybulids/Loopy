'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, Reveal, Stagger, StaggerItem, WordReveal, CountUp, Magnetic } from '@/components/motion';
import RedirectAuthed from '@/components/RedirectAuthed';
import Logo from '@/components/Logo';
import LoopyIntro from '@/components/LoopyIntro';
import ShopScene from '@/components/ShopScene';
import LoopyFlow from '@/components/LoopyFlow';
import { ArrowRight, Bolt, Plus, Share, ShieldLock, Star, Store, Truck } from '@/components/icons';

/* ──────────────────────────────────────────────────────────────
   Loopy marketing landing.

   White and airy. Two colours only — navy #0E2A47 for every word
   that matters, green #15784A for the things you can act on —
   and a single pale green gradient bleeding in from the top
   right. That one wash is the entire decoration; there is no
   second gradient, no dark band, no floating blobs.

   The hero is centred, with the visual beneath the copy rather
   than beside it, so the page opens with one clear line of
   reading instead of two columns competing for the first glance.

   Two things do move, and both earn it: <ShopScene> stages the
   actual job — an Instagram DM, the garment being sold, and the
   parcel going out — in 3D that opens up as you scroll, and
   <LoopyFlow> in "How it works" walks the four stages on a loop. Everything else is
   scroll-triggered once — Reveal on entry, Stagger down lists,
   WordReveal on the headline, CountUp on figures — so whitespace
   stays the thing doing the work.
   ────────────────────────────────────────────────────────────── */

const SOLUTIONS = [
  { icon: <Share size={20} />, t: 'Chat to order', d: 'Turn any DM into a structured order in seconds.' },
  { icon: <Bolt size={20} />, t: 'Instant checkout links', d: 'Pre-filled carts your customer pays in one tap.' },
  { icon: <Store size={20} />, t: 'Your own storefront', d: 'A real shop at your own address, live in minutes.' },
  { icon: <ShieldLock size={20} />, t: 'Protected payments', d: 'Money held safely until the order is delivered.' },
  { icon: <Truck size={20} />, t: 'Shipping & tracking', d: 'Add a courier and tracking number; buyers get both.' },
  { icon: <Star size={20} />, t: 'Reviews & analytics', d: 'Revenue, conversion and what buyers actually said.' },
];


const TESTIMONIALS = [
  { name: 'Riya Mehta', store: '@vintagefinds.in', quote: 'I used to lose half my DMs. Now every chat becomes a paid order — my revenue doubled in two months.', growth: '+118% revenue' },
  { name: 'Arjun Nair', store: '@thesneakerloop', quote: 'Checkout links killed the payment chasing. Customers pay instantly and I ship the same day.', growth: '+74% orders' },
  { name: 'Sana Kapoor', store: '@sanas.closet', quote: 'One dashboard for orders, payments and shipping. It finally feels like a real business, not a side hustle.', growth: '+2.3× AOV' },
];

const FAQS = [
  { q: 'How does a DM become an order?', a: 'Pick a product, generate a checkout link, paste it in chat. Your customer pays and the order lands in your dashboard.' },
  { q: 'Do I need a website?', a: 'No — you get a hosted storefront at your own address the moment you sign up.' },
  { q: 'Which payments are supported?', a: 'UPI, cards, net banking and wallets.' },
  { q: 'How do payouts work?', a: 'Funds are held until delivery is confirmed, then settled to your UPI ID or bank account.' },
  { q: 'What does Loopy charge?', a: 'A flat 5% platform fee, shown to the buyer at checkout. It is not deducted from your payout.' },
  { q: 'Can I track inventory?', a: 'Yes — stock updates automatically as orders come in, with low-stock alerts.' },
];

export default function Landing() {
  return (
    /*
     * `overflow-x-clip` is load-bearing, not tidiness.
     *
     * The hero scene is a fixed 540px stage shrunk with `transform: scale()`,
     * and a transform changes what is painted, not what is occupied — the
     * element still takes its full 540px of layout. On a 390px phone that made
     * the document 564px wide: every section laid itself out at 390px and the
     * extra 174px showed the cream `body` background as a band down the right
     * side of the page.
     *
     * Clipping here rather than on the scene itself is deliberate. `main` is
     * viewport-width, so the overflow is absorbed with nothing visible lost,
     * while the scene keeps the ~30px its rotation bleeds past the stage edge —
     * clipping at the scene's own box would shave that off. `clip` rather than
     * `hidden` because `hidden` would make this a scroll container and break
     * `position: sticky` for anything inside it.
     */
    <main className="relative min-h-screen overflow-x-clip bg-white text-navy">
      <RedirectAuthed />
      <LoopyIntro />

      {/*
        The only decoration on the page: one pale green wash bleeding in from
        the top right, fading to nothing well before the fold. Fixed so it
        never affects layout, and behind everything.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px]"
        style={{
          background:
            'radial-gradient(1100px 620px at 88% -8%, rgba(227,246,236,0.95) 0%, rgba(227,246,236,0.45) 38%, rgba(255,255,255,0) 72%)',
        }}
      />

      {/* ───── nav ───── */}
      <header className="relative mx-auto flex max-w-6xl items-center gap-4 px-6 py-6 sm:px-8">
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Logo height={30} />
        </Link>
        <nav className="hidden items-center gap-1 text-[14.5px] text-muted md:flex">
          <a href="#how" className="rounded-full px-3 py-2 transition-colors hover:text-navy">How it works</a>
          <a href="#features" className="rounded-full px-3 py-2 transition-colors hover:text-navy">Features</a>
          <a href="#faq" className="rounded-full px-3 py-2 transition-colors hover:text-navy">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/seller/login" className="rounded-full px-4 py-2.5 text-[14px] font-medium text-muted transition-colors hover:text-navy">
            Log in
          </Link>
          <Link
            href="/seller/login"
            className="rounded-full bg-navy px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
          >
            Start selling
          </Link>
        </div>
      </header>

      {/* ───── hero — copy left, diagram right ───── */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-2 lg:gap-8">
        <div className="text-center lg:text-left">
        <Reveal y={12}>
          <span className="inline-flex items-center gap-2 rounded-full border border-green/15 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold text-green-600 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
            </span>
            The safest way to sell in DMs
          </span>
        </Reveal>

        {/*
          One line, and it states the product rather than describing it.
          "Your thrift store, protected end-to-end" needed three lines and
          made you read to the end before knowing what this is; this says it
          in four words. `whitespace-nowrap` from lg up, where the column is
          wide enough to hold it. The size steps down at lg on purpose: the
          columns are even now so the visual gets half the hero, which caps
          the headline at 38px — 44px would overflow a nowrap line in a 532px
          column.
        */}
        <h1 className="mt-7 font-display text-[34px] font-bold leading-[1.06] tracking-[-0.035em] sm:text-[38px] lg:whitespace-nowrap">
          <WordReveal text="Turn DMs into" />{' '}
          <span className="text-green-600"><WordReveal text="paid orders" delay={0.18} /></span>
        </h1>

        <Reveal delay={0.4} y={14}>
          <p className="mx-auto mt-5 max-w-[30rem] text-[16.5px] leading-relaxed text-muted lg:mx-0">
            A real storefront for your Instagram shop, with payments held safely
            until the order is delivered.
          </p>
        </Reveal>

        <Reveal delay={0.5} y={14}>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Magnetic>
              <Link
                href="/seller/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_-12px_rgba(21,120,74,0.55)] transition-all hover:bg-green"
              >
                Create your store
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-navy transition-colors hover:border-navy/25"
            >
              How it works
            </a>
          </div>
          <p className="mt-6 text-[12.5px] text-faint">Free to start · No card required · Live in minutes</p>
        </Reveal>
      </div>

        {/* The visual: a DM becomes a product becomes a parcel. */}
        <ShopScene />
      </section>

      {/* ───── stats ───── */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-10">
            {[
              { to: 500, suffix: '+', l: 'Orders processed' },
              { to: 125, suffix: '', l: 'Active sellers' },
              { to: 30, suffix: 's', l: 'Chat to checkout' },
              { to: 48, suffix: 'h', l: 'Protected payout' },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <CountUp
                  to={s.to}
                  suffix={s.suffix}
                  className="font-num text-[30px] font-semibold tracking-[-0.03em] tabular-nums text-navy"
                />
                <div className="mt-1.5 text-[12.5px] text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───── how it works ───── */}
      <section id="how" className="mx-auto max-w-5xl scroll-mt-24 px-6 pb-16 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="text-center">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mx-auto mt-4 max-w-xl font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[42px]">
              Three steps from a chat to money in your account
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-14"><LoopyFlow /></div>
        </Reveal>
      </section>

      {/* ───── features ───── */}
      <section id="features" className="scroll-mt-24 border-t border-line/70 bg-paper/40 py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <Reveal>
            <div className="text-center">
              <SectionLabel>Everything in one place</SectionLabel>
              <h2 className="mx-auto mt-4 max-w-lg font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[42px]">
                The whole business, not just the chat
              </h2>
            </div>
          </Reveal>

          <Stagger className="mt-10 grid sm:mt-14 gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
            {SOLUTIONS.map((s) => (
              <StaggerItem key={s.t}>
                <div className="group h-full rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:border-green/30 hover:shadow-[0_20px_44px_-28px_rgba(14,42,71,0.28)]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-soft text-green-600 transition-transform group-hover:scale-105">
                    {s.icon}
                  </span>
                  <h3 className="mt-4 font-display text-[16px] font-bold">{s.t}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ───── testimonials ───── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-28">
        <Reveal>
          <div className="text-center">
            <SectionLabel>Sellers who closed the loop</SectionLabel>
            <h2 className="mx-auto mt-4 max-w-lg font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[42px]">
              Built with the people using it
            </h2>
          </div>
        </Reveal>

        <Stagger className="mt-10 grid sm:mt-14 gap-5 md:grid-cols-3" gap={0.1}>
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6">
                <div className="flex gap-0.5 text-green-600">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} />)}
                </div>
                <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-navy/85">“{t.quote}”</p>
                <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-soft text-[12px] font-bold text-green-600">
                    {t.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13.5px] font-bold">{t.name}</div>
                    <div className="truncate text-[11.5px] text-faint">{t.store}</div>
                  </div>
                  <span className="shrink-0 font-num text-[11.5px] font-semibold text-green-600">{t.growth}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ───── faq ───── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-16 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="text-center">
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mt-4 font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[42px]">
              Everything you might ask
            </h2>
          </div>
        </Reveal>
        <Stagger className="mt-12 space-y-3" gap={0.05}>
          {FAQS.map((f) => (
            <StaggerItem key={f.q}><FaqItem q={f.q} a={f.a} /></StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ───── closing CTA — a soft green panel, not a dark band ───── */}
      <section className="mx-auto max-w-5xl px-6 pb-16 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="rounded-[28px] bg-green-soft px-8 py-16 text-center">
            <h2 className="mx-auto max-w-lg font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[40px]">
              Start turning chats into <span className="text-green-600">checkouts</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-navy/70">
              Set up your store, drop your first checkout link, and get paid — all in the next few minutes.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic>
                <Link
                  href="/seller/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_-12px_rgba(21,120,74,0.55)] transition-all hover:bg-green"
                >
                  Create your store
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
              <a href="#how" className="rounded-full border border-navy/15 bg-white px-6 py-3.5 text-[15px] font-semibold text-navy transition-colors hover:border-navy/30">
                See how it works
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───── footer ───── */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 sm:px-8 sm:py-14 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo height={28} />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              Conversational commerce that turns Instagram DMs and WhatsApp chats into real,
              protected orders.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Company</div>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-muted">
              {/* Real routes — each policy has its own page, and Contact points at
                  the Grievance Officer section, which is the one with contact
                  details in it. */}
              {[
                { l: 'Terms', href: '/terms' },
                { l: 'Privacy Policy', href: '/privacy' },
                { l: 'Refunds & Returns', href: '/refunds' },
                { l: 'Shipping', href: '/shipping' },
                { l: 'Selling on Loopy', href: '/sellers-terms' },
                { l: 'All policies', href: '/legal' },
                { l: 'Contact', href: '/legal#grievance-redressal-policy' },
              ].map((x) => (
                <li key={x.l}>
                  <Link href={x.href} className="transition-colors hover:text-navy">{x.l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Follow</div>
            {/* Only accounts that exist. Facebook, LinkedIn and YouTube sat here
                as plain text styled to look like links — a footer full of things
                that do nothing when clicked. */}
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-muted">
              <li>
                <a
                  href="https://www.instagram.com/loopynow"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-navy"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                  @loopynow
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-6 text-center text-[12px] text-faint">
          © 2026 Loopy · Conversational commerce for social sellers
        </div>
      </footer>
    </main>
  );
}

/** The small green kicker above every section heading. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-green-600">{children}</span>
  );
}

/* ───── FAQ accordion item ───── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-colors ${open ? 'border-green/35' : 'border-line'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-[15px] font-bold text-navy">{q}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all ${open ? 'rotate-45 bg-green-600 text-white' : 'bg-green-soft text-green-600'}`}>
          <Plus size={15} />
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-[14px] leading-relaxed text-muted">{a}</p>
      </motion.div>
    </div>
  );
}
