'use client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Check, Share, ShieldLock, Truck, Wallet } from '@/components/icons';

/**
 * How Loopy works, as a loop you can watch.
 *
 * Four stages, advancing on a timer: the active one lifts and colours, the
 * connector behind it fills, and a token moves along. It repeats, because the
 * name of the product is the shape of the process — a chat comes back round as
 * money in your account.
 *
 * Driven by one interval rather than four independent animations, so the
 * nodes, the connectors and the caption can never disagree about which stage
 * is current. It only runs while on screen, and `prefers-reduced-motion`
 * shows every stage completed instead of animating.
 */

const STAGES = [
  {
    icon: <Share size={17} />,
    t: 'Share a link',
    d: 'Pick products, send a checkout link into the chat.',
    note: 'Instagram · WhatsApp',
  },
  {
    icon: <ShieldLock size={17} />,
    t: 'They pay',
    d: 'Payment is taken and held — not sent on yet.',
    note: 'UPI · Cards · Netbanking',
  },
  {
    icon: <Truck size={17} />,
    t: 'You ship',
    d: 'Add the courier and tracking; the buyer is emailed both.',
    note: 'Any courier',
  },
  {
    icon: <Wallet size={17} />,
    t: 'You get paid',
    d: 'Once delivered, the money is released to your account.',
    note: 'To your UPI or bank',
  },
];

const DWELL = 1900;

export default function LoopyFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-80px' });
  const calm = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Pause when off screen: an animation nobody is looking at is just battery.
    if (!inView || calm) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STAGES.length), DWELL);
    return () => clearInterval(id);
  }, [inView, calm]);

  /** With reduced motion every stage reads as done, which is the honest end state. */
  const stateOf = (i: number) => (calm ? 'done' : i < step ? 'done' : i === step ? 'active' : 'todo');

  return (
    <div ref={ref} className="relative">
      <div className="grid gap-4 md:grid-cols-4">
        {STAGES.map((s, i) => {
          const state = stateOf(i);
          const lit = state !== 'todo';

          return (
            <div key={s.t} className="relative">
              {/* the connector to the next node, filling as the flow advances */}
              {i < STAGES.length - 1 && (
                <div className="pointer-events-none absolute -right-2 top-[30px] hidden h-px w-4 overflow-hidden bg-line md:block">
                  <motion.div
                    className="h-full bg-green-600"
                    initial={{ width: '0%' }}
                    animate={{ width: state === 'done' ? '100%' : '0%' }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  />
                </div>
              )}

              <motion.div
                className={`h-full rounded-2xl border bg-white p-5 transition-colors ${
                  state === 'active' ? 'border-green/45' : lit ? 'border-green/20' : 'border-line'
                }`}
                animate={{
                  y: state === 'active' ? -4 : 0,
                  boxShadow:
                    state === 'active'
                      ? '0 20px 44px -26px rgba(21,120,74,0.45)'
                      : '0 0 0 0 rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between gap-2">
                  <motion.span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      lit ? 'bg-green-600 text-white' : 'bg-green-soft text-green-600'
                    }`}
                    animate={{ scale: state === 'active' ? 1.06 : 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    {state === 'done' ? <Check size={17} /> : s.icon}
                  </motion.span>

                  <span className={`font-num text-[11px] font-semibold ${lit ? 'text-green-600' : 'text-faint'}`}>
                    0{i + 1}
                  </span>
                </div>

                <h3 className="mt-3.5 font-display text-[16px] font-bold text-navy">{s.t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
                <p className="mt-2.5 text-[11px] text-faint">{s.note}</p>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* the loop closing — the line that makes the name mean something */}
      <div className="relative mt-7 hidden items-center gap-3 md:flex">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-line to-line" />
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-green/20 bg-green-soft px-3.5 py-1.5 text-[11.5px] font-bold text-green-600"
          animate={{ opacity: calm ? 1 : step === STAGES.length - 1 ? 1 : 0.45 }}
          transition={{ duration: 0.4 }}
        >
          …and the next DM starts the loop again
        </motion.span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-line to-line" />
      </div>
    </div>
  );
}
