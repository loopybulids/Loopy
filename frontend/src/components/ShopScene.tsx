'use client';
import {
  motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';
import { useRef } from 'react';
import { Check, Heart, MessageDots, Share, Verified } from '@/components/icons';

/**
 * The hero visual: a DM becomes a product becomes a parcel.
 *
 * The previous version was three abstract panels with skeleton lines and a
 * settlement label — it read as a finance dashboard, which is not what this
 * is. Loopy sells to people running clothing shops out of their Instagram
 * inbox, so the scene is made of the things they actually touch: a chat, a
 * garment with a price on it, and a box going out the door.
 *
 * Everything is real DOM under CSS perspective — no canvas, no video, no
 * Lottie. The parcel is a genuine six-faced cube rotating in 3D space, so the
 * depth is real rather than a drawing of depth.
 *
 * There is deliberately no connecting line and no caption beneath: the chat,
 * the post and the parcel are read in that order from their own positions, and
 * labelling the sequence only repeated what the headline beside it already
 * says.
 *
 * Three sources of motion, composed rather than competing:
 *
 *   entry    phone, product and parcel arrive in sequence, once
 *   scroll   the scene flattens and the pieces separate as it passes
 *   pointer  a damped lean, so it reads as an object on a surface
 *
 * `prefers-reduced-motion` collapses it to the assembled scene.
 */

/* A garment, drawn rather than photographed — no asset to load, and it can't
   date the way a stock photo would. */
function Jacket() {
  return (
    <svg viewBox="0 0 80 90" className="h-full w-full" fill="none" aria-hidden>
      <path
        d="M30 10 L22 15 L10 22 L6 44 L16 46 L16 82 L64 82 L64 46 L74 44 L70 22 L58 15 L50 10 L40 18 Z"
        fill="#0E2A47"
        fillOpacity="0.09"
        stroke="#0E2A47"
        strokeOpacity="0.22"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M30 10 L40 18 L50 10" stroke="#0E2A47" strokeOpacity="0.22" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M40 18 L40 82" stroke="#0E2A47" strokeOpacity="0.14" strokeWidth="1.4" strokeDasharray="3 4" />
      <circle cx="36" cy="40" r="1.6" fill="#15784A" />
      <circle cx="36" cy="54" r="1.6" fill="#15784A" />
      <circle cx="36" cy="68" r="1.6" fill="#15784A" />
    </svg>
  );
}

/**
 * The parcel: six real faces, with a shipping label on the front.
 *
 * It rocks between about -24° and +24° rather than spinning a full circle.
 * A full rotation looked livelier but hid the label for half of every cycle,
 * and the label is the part that says "this is a real order going out" — so
 * the front face now always stays readable.
 *
 * Because of that limited sweep, only the FRONT and TOP faces are ever seen
 * properly. Nothing readable goes on the sides: a "handle with care" stamp
 * was tried there and, viewed edge-on at every point in the cycle, rendered
 * as a thin red sliver beside the box rather than as a stamp on it.
 */
function Parcel({ spin }: { spin: boolean }) {
  const S = 104;
  const half = S / 2;

  const faces = [
    { t: `translateZ(${half}px)`, shade: '#E9D4AF' },                    // front
    { t: `rotateY(180deg) translateZ(${half}px)`, shade: '#D3B889' },    // back
    { t: `rotateY(90deg) translateZ(${half}px)`, shade: '#DCC49D' },     // right
    { t: `rotateY(-90deg) translateZ(${half}px)`, shade: '#CBAA7B' },    // left
    { t: `rotateX(90deg) translateZ(${half}px)`, shade: '#F2E2C4' },     // top
    { t: `rotateX(-90deg) translateZ(${half}px)`, shade: '#C09E6E' },    // bottom
  ];

  return (
    <motion.div
      className="relative"
      style={{ width: S, height: S, transformStyle: 'preserve-3d' }}
      animate={spin ? { rotateY: [-24, 24, -24], rotateX: [8, 4, 8] } : {}}
      transition={spin ? { duration: 11, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {faces.map((f, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-[4px]"
          style={{ transform: f.t, background: f.shade, boxShadow: 'inset 0 0 0 1px rgba(14,42,71,0.08)' }}
        />
      ))}

      {/* top face: the seam where the flaps meet, and tape over it */}
      <div
        className="absolute inset-0 rounded-[4px]"
        style={{ transform: `rotateX(90deg) translateZ(${half + 0.4}px)` }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-navy/12" />
        <div className="absolute inset-x-0 top-1/2 h-[18px] -translate-y-1/2 bg-white/45" />
        <div className="absolute inset-x-0 top-1/2 flex h-[18px] -translate-y-1/2 items-center justify-center gap-1">
          {/* the mark, printed on the tape */}
          <span className="grid grid-cols-2 gap-[1.5px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[3.5px] w-[3.5px] rounded-[1px]" style={{ background: '#06D04A' }} />
            ))}
          </span>
          <span className="text-[7px] font-bold uppercase tracking-[0.18em] text-navy/55">loopy</span>
        </div>
      </div>

      {/* front face: the shipping label */}
      <div
        className="absolute left-1/2 top-1/2 w-[74px] rounded-[3px] bg-white p-[5px]"
        style={{
          transform: `translateZ(${half + 0.4}px) translate(-50%, -50%)`,
          boxShadow: '0 1px 4px rgba(14,42,71,0.25)',
        }}
      >
        {/* carrier strip */}
        <div className="flex items-center justify-between">
          <span className="text-[5.5px] font-bold uppercase tracking-[0.12em] text-green-600">Loopy</span>
          <span className="text-[5px] font-bold uppercase tracking-wider text-navy/45">Prepaid</span>
        </div>

        <div className="mt-[3px] border-t border-dashed border-navy/20 pt-[3px]">
          <div className="text-[4.5px] font-bold uppercase tracking-[0.1em] text-navy/40">Ship to</div>
          <div className="mt-[1px] text-[5.5px] font-bold leading-[1.25] text-navy">A. Sharma</div>
          <div className="h-[2px] w-[86%] rounded-full bg-navy/15" />
          <div className="mt-[1.5px] h-[2px] w-[64%] rounded-full bg-navy/15" />
        </div>

        {/* barcode + tracking number */}
        <div className="mt-[4px] flex gap-[1px]">
          {[3, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1].map((w, i) => (
            <span key={i} className="h-[13px] bg-navy/80" style={{ width: w }} />
          ))}
        </div>
        <div className="mt-[2px] text-center text-[4.5px] font-bold tracking-[0.08em] text-navy/65">
          DL 4821 9930 17
        </div>
      </div>

    </motion.div>
  );
}

export default function ShopScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const calm = useReducedMotion();

  /* ── scroll: flatten and separate ── */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 15%'] });
  /*
   * A shallow tilt, not an isometric one.
   *
   * At 24°/-16° the cards raked hard enough that each one clipped the next and
   * the text inside them skewed — the scene read as clutter. Around 12°/-6°
   * there is still obvious depth, but every label sits square enough to read
   * at a glance, which is the whole point of a hero visual.
   */
  const sRotX = useTransform(scrollYProgress, [0, 1], [13, 6]);
  const sRotZ = useTransform(scrollYProgress, [0, 1], [-7, -2]);
  const lift = useTransform(scrollYProgress, [0, 1], [6, -22]);
  const partX = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const partY = useTransform(scrollYProgress, [0, 1], [0, 14]);

  /* ── pointer: a damped lean ── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sp = { stiffness: 110, damping: 20, mass: 0.6 };
  const pRotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), sp);
  const pRotZ = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), sp);

  const rotateX = useTransform(() => sRotX.get() + pRotX.get());
  const rotateZ = useTransform(() => sRotZ.get() + pRotZ.get());

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (calm) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const spring = (delay: number) =>
    calm ? { duration: 0 } : { type: 'spring' as const, stiffness: 120, damping: 15, mass: 0.8, delay };

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[560px]">
      <div
        className="relative mx-auto h-[452px] w-full max-w-[540px]"
        style={{ perspective: '1500px', perspectiveOrigin: '50% 42%' }}
        onPointerMove={onMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
      >
        <motion.div
          className="absolute inset-0"
          style={
            calm
              ? { transformStyle: 'preserve-3d', transform: 'rotateX(12deg) rotateZ(-6deg)' }
              : { transformStyle: 'preserve-3d', rotateX, rotateZ, y: lift }
          }
        >
          {/* ── the DM, on a phone ── */}
          <motion.div
            className="absolute left-0 top-0 w-[262px]"
            style={{ transformStyle: 'preserve-3d', z: 0 }}
            initial={{ opacity: 0, x: -70, y: 30, rotate: -8 }}
            animate={inView ? { opacity: 1, x: 0, y: 0, rotate: 0 } : {}}
            transition={spring(0.1)}
          >
            <div
              className="rounded-[24px] border border-white/80 bg-white p-3"
              style={{ boxShadow: '0 26px 48px -26px rgba(14,42,71,0.45), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
              {/* the handle bar */}
              <div className="flex items-center gap-2 px-1 pb-2">
                <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#F9A8D4] via-[#FB7185] to-[#FBBF24]" />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1 text-[12.5px] font-bold text-navy">
                    @vintagefinds.in <Verified size={11} className="text-green-600" />
                  </div>
                  <div className="text-[10px] text-faint">Active now</div>
                </div>
              </div>

              {/* the conversation */}
              <div className="space-y-1.5">
                <motion.div
                  className="max-w-[82%] rounded-[15px] rounded-bl-[5px] bg-paper px-3 py-2 text-[12px] leading-snug text-navy"
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: calm ? 0 : 0.55, duration: 0.35 }}
                >
                  Is the denim jacket still available? 😍
                </motion.div>

                <motion.div
                  className="ml-auto max-w-[88%] rounded-[15px] rounded-br-[5px] bg-green-600 px-3 py-2 text-[12px] leading-snug text-white"
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: calm ? 0 : 0.85, duration: 0.35 }}
                >
                  Yes! Tap to pay — it&apos;s reserved for you
                  <span className="mt-2 block truncate rounded-lg bg-white/20 px-2 py-1 font-num text-[10.5px] tracking-tight">
                    loopy.shop/vintagefinds
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ── the listing, as the Instagram post it really is ── */}
          <motion.div
            className="absolute left-[292px] top-[74px] w-[210px]"
            style={{ transformStyle: 'preserve-3d', z: 60, ...(calm ? {} : { x: partX }) }}
            initial={{ opacity: 0, x: 60, y: 54, rotate: 9 }}
            animate={inView ? { opacity: 1, y: 0, rotate: 0 } : {}}
            transition={spring(0.32)}
          >
            <div
              className="overflow-hidden rounded-2xl border border-white/80 bg-white"
              style={{ boxShadow: '0 26px 48px -26px rgba(14,42,71,0.45), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
              {/* post header — gradient ring avatar, handle, the three dots */}
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#FBBF24] via-[#FB7185] to-[#A855F7] p-[1.5px]">
                  <span className="grid h-full w-full place-items-center rounded-full bg-white text-[9px] font-bold text-navy">V</span>
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-navy">vintagefinds.in</span>
                <span className="flex shrink-0 gap-[2px]">
                  {[0, 1, 2].map((i) => <span key={i} className="h-[3px] w-[3px] rounded-full bg-navy/45" />)}
                </span>
              </div>

              {/* the photo — square, as Instagram crops it */}
              <div className="relative aspect-square bg-gradient-to-br from-green-soft via-white to-paper">
                <span className="absolute inset-0 grid place-items-center">
                  <span className="block h-[62%] w-[56%]"><Jacket /></span>
                </span>
                <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[9.5px] font-bold text-green-600 shadow-sm">
                  1 left
                </span>
                {/* the Loopy part: a real price on a real post */}
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
                  <span className="font-num text-[11.5px] font-semibold tabular-nums text-navy">₹1,299</span>
                  <span className="rounded-full bg-green-600 px-1.5 py-[2px] text-[8.5px] font-bold text-white">Tap to buy</span>
                </span>
              </div>

              {/* the action row */}
              <div className="flex items-center gap-2.5 px-2.5 pt-2">
                <motion.span
                  className="text-[#FB3958]"
                  animate={calm ? {} : { scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.9, delay: 1.5, repeat: Infinity, repeatDelay: 4.5 }}
                >
                  <Heart size={14} />
                </motion.span>
                <span className="text-navy/70"><MessageDots size={14} /></span>
                <span className="text-navy/70"><Share size={13} /></span>
                <svg viewBox="0 0 24 24" className="ml-auto h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" className="text-navy/70" />
                </svg>
              </div>

              {/* likes + caption */}
              <div className="px-2.5 pb-2.5 pt-1.5">
                <div className="font-num text-[10px] font-semibold text-navy">1,284 likes</div>
                <p className="mt-0.5 text-[10px] leading-snug text-navy/75">
                  <span className="font-bold text-navy">vintagefinds.in</span>{' '}
                  Vintage denim jacket, size M — DM to order 🛍️
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── the parcel going out ── */}
          <motion.div
            className="absolute left-[58px] top-[296px]"
            style={{ transformStyle: 'preserve-3d', z: 110, ...(calm ? {} : { y: partY }) }}
            initial={{ opacity: 0, y: 70, scale: 0.8 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={spring(0.56)}
          >
            <Parcel spin={!calm} />

            {/* the shipped confirmation, riding alongside */}
            {/* Directly under the parcel. Beside it, the chip ran into the
                Instagram post — which is much taller than the plain card it
                replaced. */}
            <motion.div
              className="absolute left-[-4px] top-[114px] whitespace-nowrap rounded-full border border-green/25 bg-white px-3 py-1.5 text-[11px] font-bold text-green-600 shadow-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: calm ? 0 : 1.15, duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-1.5"><Check size={11} /> Shipped · paid out</span>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
}
