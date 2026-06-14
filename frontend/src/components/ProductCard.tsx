import Link from 'next/link';
import { rupees } from '@/lib/api';
import { Heart } from './icons';

const grad = ['from-[#C9BCFF] to-[#7B61FF]', 'from-[#3a4254] to-[#1f2533]', 'from-[#FFC2A8] to-[#FF6B5E]', 'from-[#B7F5D6] to-[#34C98A]', 'from-[#FCE5A8] to-[#F1B33B]', 'from-[#F7C8E8] to-[#B57BE8]'];

export default function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const img = product.images?.[0];
  const sold = product.quantity < 1;
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className={`relative aspect-[4/5] overflow-hidden rounded-[4px] bg-gradient-to-br ${grad[index % grad.length]}`}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.title} className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${sold ? 'grayscale brightness-90' : ''}`} />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(112,72,36,.05)] to-[rgba(112,72,36,.13)] mix-blend-multiply" />
        <span className="absolute left-3 top-3 font-serif text-[12px] tracking-wide text-white mix-blend-difference">
          {String(index + 1).padStart(2, '0')}
        </span>
        {sold ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-[rgba(23,19,27,.78)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">Just sold</span>
          </span>
        ) : (
          <>
            <span className="absolute right-3 top-3 rounded-full border border-white/65 px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider text-white">1 of 1</span>
            <span className="absolute bottom-3 right-3 grid h-[34px] w-[34px] place-items-center rounded-full bg-white/95 text-ink shadow"><Heart size={16} /></span>
          </>
        )}
      </div>
      <div className="mt-3 text-[9.5px] font-bold uppercase tracking-[.16em] text-muted">{product.brand || 'Thrifted'}</div>
      <div className="mt-0.5 font-serif text-[16px] leading-tight tracking-tight">{product.title}</div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className={`text-[14.5px] font-bold ${sold ? 'text-faint line-through' : ''}`}>{rupees(product.price)}</span>
        <span className="text-[11px] text-muted">{sold ? 'Sold out' : `${product.size || ''} · ${product.condition}`}</span>
      </div>
    </Link>
  );
}
