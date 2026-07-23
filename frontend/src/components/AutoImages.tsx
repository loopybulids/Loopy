'use client';
import { useEffect, useState } from 'react';
import { isVideo } from '@/lib/store-config';

/** Auto-rotating product images (crossfade) with dots — for product cards.
 *  Parent must be `relative` with a fixed size (e.g. aspect-square). */
export default function AutoImages({ images, rounded = false }: { images: any; rounded?: boolean }) {
  const imgs: string[] = (Array.isArray(images) ? images : []).filter(Boolean);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (imgs.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % imgs.length), 2600);
    return () => clearInterval(t);
  }, [imgs.length]);

  if (!imgs.length) return null;
  return (
    <>
      {imgs.map((src, idx) => (
        isVideo(src)
          ? <video key={idx} src={src} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${rounded ? 'rounded-inherit' : ''} ${idx === i ? 'opacity-100' : 'opacity-0'}`} muted loop autoPlay playsInline />
          : <img key={idx} src={src} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {imgs.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {imgs.map((_, idx) => <span key={idx} className={`h-1.5 rounded-full bg-white shadow transition-all ${idx === i ? 'w-3.5' : 'w-1.5 opacity-60'}`} />)}
        </div>
      )}
    </>
  );
}
