'use client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Check, ShieldLock, Share, Store, Wallet } from '@/components/icons';

/**
 * The hero visual: three isometric planes that assemble themselves.
 *
 * What it depicts is the product in one glance — a chat becomes a checkout,
 * the checkout becomes money you actually receive. Rather than a screenshot
 * (which dates the moment the UI changes) the planes are drawn from the same
 * tokens as the app, so they age with it.
 *
 * The 3D is CSS perspective on real DOM, not a canvas or a video: it stays
 * crisp at any density, needs no asset to download, and the text inside it is
 * selectable and legible to a screen reader.
 *
 * Each plane flies in from its own direction and settles, then a payment token
 * travels the stack on a loop. `prefers-reduced-motion` collapses all of it to
 * the final state — the diagram still reads, it just doesn't move.
 */

const PLANES = [
  {
    key: 'chat',
    label: 'The DM',
    icon: <Share size={13} />,
    // Where it starts before settling, and where it rests.
    from: { x: -60, y: 30, rotate: -12 },
    rest: { top: 0, left: 0 },
    tone: 'from-white to-paper',
  },
  {
    key: 'checkout',
    label: 'Checkout link',
    icon: <ShieldLock size={13} />,
    from: { x: 70, y: 50, rotate: 10 },
    rest: { top: 74, left: 40 },
    tone: 'from-white to-green-soft',
  },
  {
    key: 'payout',
    label: 'Settled to you',
    icon: <Wallet size={13} />,
    from: { x: -40, y: 90, rotate: -8 },
    rest: { top: 148, left: 80 },
    tone: 'from-white to-paper',
  },
];

export default function HeroDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const calm = useReducedMotion();

  // No top margin of its own — the hero grid positions this beside the copy.
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px]">
      {/* the ground shadow the stack appears to sit on */}
      <div className="pointer-events-none absolute inset-x-12 bottom-4 h-24 rounded-[50%] bg-navy/[0.07] blur-2xl" />

      <div
        className="relative mx-auto h-[330px] w-full max-w-[460px]"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 30%' }}
      >
        {/* the whole stack shares one isometric tilt and breathes slowly */}
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
          initial={{ rotateX: 46, rotateZ: -34, scale: 0.94 }}
          animate={calm ? { rotateX: 46, rotateZ: -34 } : { rotateX: [46, 43, 46], rotateZ: [-34, -32, -34] }}
          transition={calm ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* the line the payment travels down, drawn behind the planes */}
          <svg
            className="pointer-events-none absolute left-[92px] top-[42px] h-[190px] w-[120px] overflow-visible"
            viewBox="0 0 120 190"
            fill="none"
          >
            <motion.path
              d="M4 4 L44 78 L84 152"
              stroke="#15784A"
              strokeWidth={1.5}
              strokeDasharray="5 6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 0.45 } : {}}
              transition={{ duration: 1, delay: 0.9, ease: 'easeInOut' }}
            />
          </svg>

          {PLANES.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute w-[236px]"
              style={{ top: p.rest.top, left: p.rest.left, transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, x: p.from.x, y: p.from.y, rotate: p.from.rotate }}
              animate={inView ? { opacity: 1, x: 0, y: 0, rotate: 0 } : {}}
              transition={{
                duration: calm ? 0 : 0.85,
                delay: calm ? 0 : 0.15 + i * 0.22,
                ease: [0.18, 0.9, 0.28, 1],
              }}
            >
              <div
                className={`rounded-2xl border border-line bg-gradient-to-br ${p.tone} p-3.5`}
                style={{ boxShadow: '0 18px 36px -22px rgba(14,42,71,0.45)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-green-soft text-green-600">
                    {p.icon}
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[0.01em] text-navy">{p.label}</span>
                </div>

                {/* a couple of skeleton lines, so a plane reads as a surface
                    holding content without inventing fake copy */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-1.5 w-[78%] rounded-full bg-navy/[0.09]" />
                  <div className="h-1.5 w-[52%] rounded-full bg-navy/[0.06]" />
                </div>

                {p.key === 'checkout' && (
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white px-2 py-1.5">
                    <span className="font-num text-[11.5px] font-semibold tabular-nums text-navy">₹2,499</span>
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[9.5px] font-bold text-white">Pay</span>
                  </div>
                )}

                {p.key === 'payout' && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2 py-1 text-[9.5px] font-bold text-green-600">
                    <Check size={10} /> Delivered · released
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* the payment itself, travelling the stack once the planes have settled */}
          {!calm && (
            <motion.div
              className="absolute left-[96px] top-[46px] grid h-7 w-7 place-items-center rounded-full bg-green-600 font-num text-[11px] font-bold text-white"
              style={{ boxShadow: '0 8px 20px -6px rgba(21,120,74,0.8)' }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: [0, 1, 1, 1, 0], x: [0, 40, 40, 80, 80], y: [0, 74, 74, 148, 148] } : {}}
              transition={{ duration: 3.6, delay: 1.7, repeat: Infinity, repeatDelay: 1.4, times: [0, 0.28, 0.5, 0.78, 1], ease: 'easeInOut' }}
            >
              ₹
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* a plain-language caption, because a diagram that needs decoding isn't one */}
      <motion.div
        className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-muted"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: calm ? 0 : 1.1, duration: 0.5 }}
      >
        <span className="font-semibold text-navy">A DM</span>
        <ArrowRight size={12} className="text-green-600" />
        <span className="font-semibold text-navy">a paid checkout</span>
        <ArrowRight size={12} className="text-green-600" />
        <span className="font-semibold text-navy">money in your account</span>
      </motion.div>
    </div>
  );
}
