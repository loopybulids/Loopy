'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * The arrival animation: four squares fly together, form the Loopy mark, and
 * resolve into the real wordmark before clearing the screen.
 *
 * Three rules it follows, because splash screens are usually a nuisance:
 *
 *  1. It plays once per browser session, not on every navigation. Someone
 *     moving between pages should never see it twice.
 *  2. It is an overlay, not a gate. The page renders underneath from the
 *     first frame, so crawlers, screen readers and anyone who lands mid-scroll
 *     get the content regardless of whether this ever runs.
 *  3. `prefers-reduced-motion` skips it entirely — no flash, no delay.
 *
 * It also can't outstay its welcome: the whole thing is under two seconds and
 * a click dismisses it immediately.
 */

const SEEN_KEY = 'loopy_intro_seen';

/** The four squares of the mark, in their final 2×2 formation. */
const SQUARES = [
  { x: -26, y: -26, from: { x: -160, y: -120, r: -90 } },
  { x: 26, y: -26, from: { x: 170, y: -140, r: 80 } },
  { x: -26, y: 26, from: { x: -150, y: 150, r: 70 } },
  { x: 26, y: 26, from: { x: 165, y: 130, r: -85 } },
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

    const t = setTimeout(() => setShow(false), 1850);
    return () => clearTimeout(t);
  }, [calm]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          // Decorative: the same words are in the page underneath.
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
                'radial-gradient(900px 520px at 50% 40%, rgba(227,246,236,0.9) 0%, rgba(255,255,255,0) 70%)',
            }}
          />

          <div className="relative flex flex-col items-center">
            {/* the mark assembling */}
            <div className="relative h-[92px] w-[92px]">
              {SQUARES.map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-[34px] w-[34px] rounded-[11px]"
                  style={{ background: '#06D04A', marginLeft: -17, marginTop: -17 }}
                  initial={{ x: s.from.x, y: s.from.y, rotate: s.from.r, opacity: 0, scale: 0.6 }}
                  animate={{ x: s.x, y: s.y, rotate: 0, opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.72,
                    delay: 0.05 + i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              ))}

              {/* one pulse at the moment the formation completes */}
              <motion.span
                className="absolute inset-0 rounded-[26px] ring-2 ring-green-500/40"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.7, 1.35, 1.6] }}
                transition={{ duration: 0.8, delay: 0.62, ease: 'easeOut' }}
              />
            </div>

            {/* the wordmark, drawn letter by letter under the mark */}
            <div className="mt-5 flex overflow-hidden">
              {'loopy'.split('').map((c, i) => (
                <motion.span
                  key={i}
                  className="font-display text-[40px] font-extrabold tracking-[-0.03em] text-navy"
                  initial={{ y: '105%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.72 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  {c}
                </motion.span>
              ))}
            </div>

            <motion.p
              className="mt-2.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.15 }}
            >
              Chats into checkouts
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
