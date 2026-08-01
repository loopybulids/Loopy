'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isVideo } from '@/lib/store-config';

/**
 * Animated media carousel — swipe / arrow / dot navigation with a spring slide
 * transition. Handles images and (one) video. Slides are absolutely positioned,
 * so the wrapper must have a height: pass it via `className` (e.g. "h-56 w-full"
 * or "aspect-square w-full").
 *
 * Uncontrolled by default. Pass `index` + `onIndexChange` to control it from a
 * parent (e.g. to keep an external thumbnail strip in sync).
 */
export default function ImageCarousel({
  media,
  className = 'aspect-square w-full',
  fit = 'cover',
  rounded = '',
  showArrows = true,
  index,
  onIndexChange,
  showDots = true,
}: {
  media: string[];
  className?: string;
  fit?: 'cover' | 'contain';
  rounded?: string;
  showArrows?: boolean;
  index?: number;
  onIndexChange?: (i: number) => void;
  showDots?: boolean;
}) {
  const items = (media || []).filter(Boolean);
  const controlled = index !== undefined;
  const [internal, setInternal] = useState(0);
  const raw = controlled ? (index as number) : internal;
  const len = Math.max(items.length, 1);
  const idx = ((raw % len) + len) % len;

  // derive slide direction from the previous index
  const prevIdx = useRef(idx);
  const dir = idx === prevIdx.current ? 0 : idx > prevIdx.current ? 1 : -1;
  useEffect(() => { prevIdx.current = idx; }, [idx]);

  if (!items.length) return null;

  const setIdx = (to: number) => {
    const next = ((to % len) + len) % len;
    if (controlled) onIndexChange?.(next);
    else setInternal(next);
  };
  const go = (d: number) => setIdx(idx + d);
  const jump = (to: number) => setIdx(to);
  const src = items[idx];
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={idx}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0.4 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0.4 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 320, damping: 34 }, opacity: { duration: 0.2 } }}
          drag={items.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -60) go(1);
            else if (info.offset.x > 60) go(-1);
          }}
          className="absolute inset-0 h-full w-full"
        >
          {isVideo(src) ? (
            <video src={src} className={`h-full w-full ${fitClass}`} muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" draggable={false} className={`h-full w-full ${fitClass} select-none`} onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')} />
          )}
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && showArrows && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-navy shadow-card backdrop-blur transition hover:bg-white active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-navy shadow-card backdrop-blur transition hover:bg-white active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </>
      )}

      {showDots && items.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              onClick={() => jump(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
