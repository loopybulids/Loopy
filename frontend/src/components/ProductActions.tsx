'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { rupees } from '@/lib/api';
import { Heart, Shield } from './icons';

export default function ProductActions({ product }: { product: any }) {
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const router = useRouter();

  const addToCart = () => {
    add({
      productId: product.id, title: product.title, price: product.price, image: product.images?.[0],
      size: product.size, condition: product.condition,
      sellerUsername: product.seller.username, storeName: product.seller.storeName,
    });
    setAdded(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-5 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="mr-auto hidden items-center gap-1.5 text-[12px] font-semibold text-green sm:flex"><Shield size={15} /> Protected by Loopy Escrow</div>
        <button className="btn-ghost"><Heart size={18} /></button>
        {added ? (
          <button onClick={() => router.push('/cart')} className="btn-green flex-1 sm:flex-none">Go to cart →</button>
        ) : (
          <button onClick={addToCart} className="btn-navy flex-1 sm:flex-none">Buy with Protection · {rupees(product.price)}</button>
        )}
      </div>
    </div>
  );
}
