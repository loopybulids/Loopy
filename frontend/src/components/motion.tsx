'use client';
import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState, ReactNode } from 'react';

/* Reveal: fade + rise when scrolled into view */
export function Reveal({ children, delay = 0, y = 24, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Stagger container + item */
export function Stagger({ children, className = '', gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className = '', y = 26 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
    >
      {children}
    </motion.div>
  );
}

/* Headline that reveals word-by-word with a mask */
export function WordReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ marginRight: '0.26em' }}>
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* CountUp number when in view */
export function CountUp({ to, suffix = '', prefix = '', decimals = 0, className = '' }: { to: number; suffix?: string; prefix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(v) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref} className={className}>{prefix}{val.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/* ── pointer-tracking helpers ───────────────────────────────────────────────
 * Magnetic/Tilt wrap real CTAs, so anything they do on mousemove is felt as
 * input lag. Two rules keep them cheap:
 *   1. Measure the element ONCE on enter. getBoundingClientRect() per mousemove
 *      forces a synchronous layout on every event — the classic jank source.
 *   2. Coalesce to one update per animation frame. Mice fire well above 60Hz.
 * They also stay inert for touch/pen and for users who asked for less motion.
 */
function useHoverFx() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setOn(fine && !calm);
  }, []);
  return on;
}

/** Returns a mousemove handler that runs `fn` at most once per frame. */
function useRafMove(fn: (e: { clientX: number; clientY: number }) => void) {
  const frame = useRef(0);
  const last = useRef({ clientX: 0, clientY: 0 });
  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);
  return (e: { clientX: number; clientY: number }) => {
    last.current = { clientX: e.clientX, clientY: e.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      fn(last.current);
    });
  };
}

/* Magnetic wrapper — element drifts toward the cursor */
export function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<DOMRect | null>(null);
  const active = useHoverFx();
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  const onMove = useRafMove((p) => {
    const r = box.current;
    if (!r) return;
    x.set((p.clientX - (r.left + r.width / 2)) * strength);
    y.set((p.clientY - (r.top + r.height / 2)) * strength);
  });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={className}
      onMouseEnter={active ? () => { box.current = ref.current?.getBoundingClientRect() ?? null; } : undefined}
      onMouseMove={active ? onMove : undefined}
      onMouseLeave={active ? () => { box.current = null; x.set(0); y.set(0); } : undefined}
    >
      {children}
    </motion.div>
  );
}

/* 3D tilt card that follows the pointer */
export function Tilt({ children, className = '', max = 12 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<DOMRect | null>(null);
  const active = useHoverFx();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 150, damping: 18 });

  const onMove = useRafMove((p) => {
    const r = box.current;
    if (!r || !r.width || !r.height) return;
    mx.set((p.clientX - r.left) / r.width);
    my.set((p.clientY - r.top) / r.height);
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseEnter={active ? () => { box.current = ref.current?.getBoundingClientRect() ?? null; } : undefined}
      onMouseMove={active ? onMove : undefined}
      onMouseLeave={active ? () => { box.current = null; mx.set(0.5); my.set(0.5); } : undefined}
    >
      {children}
    </motion.div>
  );
}

export { motion };
