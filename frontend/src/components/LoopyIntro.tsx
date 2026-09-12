'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * The arrival animation: four squares fly together, form the Loopy mark, and
 * resolve into the real wordmark — all on one line.
 *
 * The wordmark is the actual logo asset, not text set in a UI font. A brand
 * mark redrawn in Plus Jakarta is a lookalike, and a lookalike is worse than
 * no animation: the first thing a visitor sees would be almost-but-not-quite
 * the logo. So the squares assemble, then cross-fade into `loopy-logo.png`,
 * which is the brand letterform exactly.
 *
 * Three rules it follows, because splash screens are usually a nuisance:
 *
 *  1. It plays once per browser session, not on every navigation.
 *  2. It is an overlay, not a gate. The page renders underneath from the
 *     first frame, so crawlers, screen readers and deep links are unaffected.
 *  3. `prefers-reduced-motion` skips it entirely — no flash, no delay.
 *
 * The whole thing is under two seconds and a click dismisses it.
 */

const SEEN_KEY = 'loopy_intro_seen';

/** The four squares of the mark, and where each flies in from. */
const SQUARES = [
  { x: -15, y: -15, from: { x: -150, y: -120, r: -90 } },
  { x: 15, y: -15, from: { x: 160, y: -140, r: 80 } },
  { x: -15, y: 15, from: { x: -140, y: 150, r: 70 } },
  { x: 15, y: 15, from: { x: 155, y: 130, r: -85 } },
];

export default function LoopyIntro() {
  const calm = useReducedMotion();
  // Starts closed and opens in an effect, so the server-rendered HTML never
  // contains the overlay — nothing to flash before hydration decides.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (calm) return;
    let seen = true;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Storage blocked (private window, site data off) — treat as seen rather
      // than replaying the intro on every single page view.
    }
    if (seen) return;

    setShow(true);
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* nothing to do */ }

    const t = setTimeout(() => setShow(false), 1750);
    return () => clearTimeout(t);
  }, [calm]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          // Decorative: the same brand is in the page underneath.
          aria-hidden
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
        >
          {/* the same green wash as the hero, so the reveal feels continuous */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(900px 520px at 50% 45%, rgba(227,246,236,0.9) 0%, rgba(255,255,255,0) 70%)',
            }}
          />

          {/* One line: the mark assembles, then becomes the logo. */}
          <div className="relative h-[52px] w-[210px]">
            {/* phase 1 — the four squares fly in and form the mark */}
            <motion.div
              className="absolute left-0 top-1/2 h-0 w-0"
              style={{ marginLeft: 26 }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.92 }}
            >
              {SQUARES.map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute h-[21px] w-[21px] rounded-[7px]"
                  style={{ background: '#06D04A', marginLeft: -10.5, marginTop: -10.5 }}
                  initial={{ x: s.from.x, y: s.from.y, rotate: s.from.r, opacity: 0, scale: 0.6 }}
                  animate={{ x: s.x, y: s.y, rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.04 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}

              {/* one pulse at the moment the formation completes */}
              <motion.span
                className="absolute rounded-full ring-2 ring-green-500/40"
                style={{ left: -34, top: -34, width: 68, height: 68 }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.7, 1.3, 1.55] }}
                transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
              />
            </motion.div>

            {/* phase 2 — the real logo takes its place, in the brand letterform */}
            <motion.img
              src="/loopy-logo.png"
              alt=""
              className="absolute left-0 top-1/2 h-[40px] w-auto -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.88, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
