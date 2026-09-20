'use client';
import { useEffect, useState } from 'react';
import { isVideo } from '@/lib/store-config';

/**
 * Auto-rotating product images (crossfade) with dots — for product cards.
 * Parent must be `relative` with a fixed size (e.g. aspect-square).
 *
 * Only images that have actually been shown are mounted. This used to render
 * every image of every card at once, which was free while they were base64
 * inside the page and is not now they are real requests: a 30-product
 * catalogue with four photos each opened 120 connections on first paint to
 * display 30 pictures. The rest mount as the rotation reaches them, one every
 * few seconds, and only while the card is on screen.
 */
export default function AutoImages({ images, rounded = false }: { images: any; rounded?: boolean }) {
  const imgs: string[] = (Array.isArray(images) ? images : []).filter(Boolean);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);

  useEffect(() => {
    if (imgs.length < 2) return;
    const t = setInterval(() => {
      setI((x) => {
        const next = (x + 1) % imgs.length;
        setSeen((s) => (s.includes(next) ? s : [...s, next]));
        return next;
      });
    }, 2600);
    return () => clearInterval(t);
  }, [imgs.length]);

  if (!imgs.length) return null;
  return (
    <>
      {imgs.map((src, idx) => {
        if (!seen.includes(idx)) return null;
        const cls = `absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0'}`;
        return isVideo(src)
          ? <video key={idx} src={src} className={`${cls} ${rounded ? 'rounded-inherit' : ''}`} muted loop autoPlay playsInline preload="none" />
          // Lazy is right even for the first one: the browser loads in-viewport
          // lazy images straight away, and skips the rest of a long catalogue.
          : <img key={idx} src={src} alt="" loading="lazy" decoding="async" className={cls} />;
      })}
      {imgs.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {imgs.map((_, idx) => <span key={idx} className={`h-1.5 rounded-full bg-white shadow transition-all ${idx === i ? 'w-3.5' : 'w-1.5 opacity-60'}`} />)}
        </div>
      )}
    </>
  );
}
