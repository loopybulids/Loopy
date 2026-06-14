'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { rupees } from '@/lib/api';
import { Heart } from './icons';

export default function ProductActions({ product }: { product: any }) {
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const router = useRouter();

  const addToCart = () => {
    add({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0],
      size: product.size,
      condition: product.condition,
      sellerUsername: product.seller.username,
      storeName: product.seller.storeName,
    });
    setAdded(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white px-5 py-3">
      <div className="mx-auto flex max-w-5xl gap-3">
        <button className="btn-gh"><Heart size={18} /></button>
        {added ? (
          <button onClick={() => router.push('/cart')} className="btn-grn flex-1">Go to cart →</button>
        ) : (
          <button onClick={addToCart} className="btn-pri flex-1">Add to cart · {rupees(product.price)}</button>
        )}
      </div>
    </div>
  );
}
