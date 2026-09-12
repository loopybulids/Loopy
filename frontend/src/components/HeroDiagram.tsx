'use client';
import {
  motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Check, ShieldLock, Share, Wallet } from '@/components/icons';

/**
 * The hero visual: three glass planes suspended in 3D that assemble on entry,
 * open out as you scroll, and tilt toward the pointer.
 *
 * What it depicts is the product in one glance — a chat becomes a checkout,
 * the checkout becomes money you actually receive. It is real DOM under CSS
 * perspective rather than a canvas, a video or a Lottie file: crisp at any
 * pixel density, nothing to download, and the text inside stays selectable
 * and legible to a screen reader.
 *
 * Three independent sources of motion are composed onto one stack:
 *
 *   entry    each plane springs in from its own direction, once
 *   scroll   the tilt flattens and the planes separate as it passes
 *   pointer  a damped tilt toward the cursor, so it reads as an object
 *
 * They are added rather than fought over: scroll and pointer each produce a
 * rotation and `useTransform` sums them, so neither cancels the other.
 *
 * Depth is genuine — every plane sits at its own `translateZ`, so the
 * perspective divergence between them is real rather than faked with scale.
 *
 * `prefers-reduced-motion` collapses all of it to the assembled state. The
 * diagram still reads; it simply holds still.
 */

const PLANES = [
  {
    key: 'chat',
    label: 'The DM',
    icon: <Share size={13} />,
    from: { x: -90, y: 40, rotate: -14 },
    rest: { top: 0, left: 0 },
    /** Depth in the stack, and how far it drifts apart on scroll. */
    z: 0,
    drift: 0,
    sheen: 'from-white/70',
  },
  {
    key: 'checkout',
    label: 'Checkout link',
    icon: <ShieldLock size={13} />,
    from: { x: 110, y: 64, rotate: 12 },
    rest: { top: 74, left: 40 },
    z: 42,
    drift: 1,
    sheen: 'from-green-mint/45',
  },
  {
    key: 'payout',
    label: 'Settled to you',
    icon: <Wallet size={13} />,
    from: { x: -60, y: 120, rotate: -10 },
    rest: { top: 148, left: 80 },
    z: 84,
    drift: 2,
    sheen: 'from-white/70',
  },
];

export default function HeroDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const calm = useReducedMotion();

  /* ── scroll: flatten the tilt, pull the planes apart ── */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 15%'] });
  const sRotX = useTransform(scrollYProgress, [0, 1], [48, 30]);
  const sRotZ = useTransform(scrollYProgress, [0, 1], [-34, -17]);
  const spread = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const lift = useTransform(scrollYProgress, [0, 1], [8, -26]);
  const shadowStretch = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  // Per-plane drift, hoisted out of the render loop — hooks can't be called
  // inside .map().
  const driftA = useTransform(spread, (v) => v * PLANES[0].drift);
  const driftB = useTransform(spread, (v) => v * PLANES[1].drift);
  const driftC = useTransform(spread, (v) => v * PLANES[2].drift);
  const drifts = [driftA, driftB, driftC];

  /* ── pointer: a damped tilt, so it feels physical ── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 110, damping: 20, mass: 0.6 };
  const pRotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), spring);
  const pRotZ = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);

  // Both sources add together.
  const rotateX = useTransform(() => sRotX.get() + pRotX.get());
  const rotateZ = useTransform(() => sRotZ.get() + pRotZ.get());

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (calm) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px]">
      <div
        className="relative mx-auto h-[360px] w-full max-w-[470px]"
        style={{ perspective: '1300px', perspectiveOrigin: '50% 32%' }}
        onPointerMove={onMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
      >
        {/* the ground shadow, stretching as the stack flattens */}
        <motion.div
          className="pointer-events-none absolute inset-x-14 bottom-2 h-24 rounded-[50%] bg-navy/[0.09] blur-2xl"
          style={calm ? undefined : { scaleX: shadowStretch }}
        />

        <motion.div
          className="absolute inset-0"
          style={
            calm
              ? { transformStyle: 'preserve-3d', transform: 'rotateX(46deg) rotateZ(-34deg)' }
              : { transformStyle: 'preserve-3d', rotateX, rotateZ, y: lift }
          }
        >
          {/* the path the payment travels, drawn once the planes have landed */}
          <svg
            className="pointer-events-none absolute left-[92px] top-[42px] h-[190px] w-[120px] overflow-visible"
            viewBox="0 0 120 190"
            fill="none"
            style={{ transform: 'translateZ(20px)' }}
          >
            <motion.path
              d="M4 4 L44 78 L84 152"
              stroke="#15784A"
              strokeWidth={1.5}
              strokeDasharray="5 6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 0.4 } : {}}
              transition={{ duration: 1, delay: 0.95, ease: 'easeInOut' }}
            />
          </svg>

          {PLANES.map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute w-[236px]"
              style={{
                top: p.rest.top,
                left: p.rest.left,
                transformStyle: 'preserve-3d',
                z: p.z,
                ...(calm ? {} : { y: drifts[i] }),
              }}
              initial={{ opacity: 0, x: p.from.x, y: p.from.y, rotate: p.from.rotate, scale: 0.92 }}
              animate={inView ? { opacity: 1, x: 0, rotate: 0, scale: 1 } : {}}
              transition={
                calm
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 120, damping: 14, mass: 0.8, delay: 0.12 + i * 0.18 }
              }
            >
              {/* glass: translucent fill, bright top edge, soft rim */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/70 p-3.5 backdrop-blur-xl"
                style={{
                  background:
                    'linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.80) 45%, rgba(246,245,240,0.88) 100%)',
                  boxShadow:
                    '0 26px 50px -28px rgba(14,42,71,0.45), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(14,42,71,0.04)',
                }}
              >
                {/* a light sweeping the surface — what makes glass read as
                    glass rather than a pale rectangle */}
                {!calm && (
                  <motion.div
                    className={`pointer-events-none absolute -inset-y-8 w-24 bg-gradient-to-r ${p.sheen} to-transparent blur-md`}
                    initial={{ x: '-60%', opacity: 0 }}
                    animate={inView ? { x: ['-60%', '340%'], opacity: [0, 0.85, 0] } : {}}
                    transition={{
                      duration: 2.1,
                      delay: 1.2 + i * 0.45,
                      repeat: Infinity,
                      repeatDelay: 5.2,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                <div className="relative flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-green-soft text-green-600">
                    {p.icon}
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[0.01em] text-navy">{p.label}</span>
                </div>

                {/* skeleton lines: a surface holding content, without inventing copy */}
                <div className="relative mt-2.5 space-y-1.5">
                  <div className="h-1.5 w-[78%] rounded-full bg-navy/[0.09]" />
                  <div className="h-1.5 w-[52%] rounded-full bg-navy/[0.06]" />
                </div>

                {p.key === 'checkout' && (
                  <div className="relative mt-2.5 flex items-center justify-between rounded-lg bg-white/90 px-2 py-1.5 shadow-sm">
                    <span className="font-num text-[11.5px] font-semibold tabular-nums text-navy">₹2,499</span>
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[9.5px] font-bold text-white">Pay</span>
                  </div>
                )}

                {p.key === 'payout' && (
                  <div className="relative mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2 py-1 text-[9.5px] font-bold text-green-600">
                    <Check size={10} /> Delivered · released
                  </div>
                )}
              </div>

              {/* a pulse as the payment reaches this plane */}
              {!calm && (
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-green-500/50"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={inView ? { opacity: [0, 0.7, 0], scale: [0.98, 1.03, 1.06] } : {}}
                  transition={{
                    duration: 1.1,
                    delay: 2.1 + i * 1.05,
                    repeat: Infinity,
                    repeatDelay: 3.95,
                    ease: 'easeOut',
                  }}
                />
              )}
            </motion.div>
          ))}

          {/* the payment itself, with a glow that trails it */}
          {!calm && (
            <motion.div
              className="absolute left-[96px] top-[46px]"
              style={{ z: 110 }}
              initial={{ opacity: 0 }}
              animate={inView
                ? { opacity: [0, 1, 1, 1, 0], x: [0, 40, 40, 80, 80], y: [0, 74, 74, 148, 148] }
                : {}}
              transition={{
                duration: 4.2,
                delay: 1.8,
                repeat: Infinity,
                repeatDelay: 1.9,
                times: [0, 0.3, 0.5, 0.8, 1],
                ease: 'easeInOut',
              }}
            >
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-green-500/40 blur-md" />
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-green-600 font-num text-[11px] font-bold text-white"
                style={{ boxShadow: '0 10px 24px -6px rgba(21,120,74,0.9), 0 0 0 4px rgba(21,120,74,0.12)' }}
              >
                ₹
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* a plain-language caption, because a diagram needing decoding isn't one */}
      <motion.div
        className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-muted"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: calm ? 0 : 1.15, duration: 0.5 }}
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
