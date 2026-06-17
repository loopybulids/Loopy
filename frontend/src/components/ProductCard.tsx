'use client';
import Link from 'next/link';
import { motion } from '@/components/motion';
import { rupees } from '@/lib/api';
import { Heart, Shield } from './icons';

const grad = ['from-[#caa07a] to-[#6b4a2f]', 'from-[#9fb4c9] to-[#3a4a5e]', 'from-[#d9c7a0] to-[#9c7d4a]', 'from-[#c7b8d6] to-[#7a5e94]'];

export default function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const img = product.images?.[0];
  const sold = product.quantity < 1;
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link href={`/product/${product.id}`} className="group block overflow-hidden rounded-3xl">
        <div className={`relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br ${grad[index % grad.length]} shadow-card transition-shadow duration-500 group-hover:shadow-lift`}>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.title} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${sold ? 'grayscale' : ''}`} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          )}
          {/* soft bottom scrim for legibility of the floating info card */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/35 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white shadow backdrop-blur"><Shield size={11} /> Loopy Protected</span>
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-navy shadow backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:text-rose"><Heart size={15} /></span>
          {sold && <span className="absolute inset-0 grid place-items-center bg-navy/45 backdrop-blur-[2px]"><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy shadow">Sold out</span></span>}

          {/* floating frosted info card */}
          <div className="absolute inset-x-2.5 bottom-2.5">
            <div className="glass-card rounded-2xl p-3.5">
              <div className="truncate text-[13.5px] font-semibold text-navy">{product.title}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-[16px] font-extrabold text-navy">{rupees(product.price)}</span>
                <span className="truncate text-[11px] text-muted">{product.size} · {product.condition}</span>
              </div>
              <div className="mt-2.5 rounded-xl bg-navy/0 py-2 text-center text-[12.5px] font-bold text-green transition-all duration-300 group-hover:bg-navy group-hover:text-white">View Details</div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
