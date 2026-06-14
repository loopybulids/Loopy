'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { api, rupees } from '@/lib/api';
import StoreNav from '@/components/StoreNav';
import { Back, Lock, Shield } from '@/components/icons';

const COMMISSION = 0.05;
const SHIPPING = 60;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Aman Sharma');
  const [phone, setPhone] = useState('9876500210');
  const [address, setAddress] = useState('14, Linking Road, Bandra West, Mumbai 400050');
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const sub = subtotal();
  const fee = Math.round(sub * COMMISSION);
  const total = sub + fee + SHIPPING;

  const pay = async () => {
    setBusy(true);
    try {
      // 1) create the order (PendingPayment) — backend prices + reserves it.
      const order = await api.checkout({
        items: items.map((i) => ({ productId: i.productId, quantity: 1 })),
        buyerName: name, buyerPhone: phone, address,
      });
      // 2) confirm payment (stub stands in for the Razorpay flow + webhook).
      await api.confirmPayment(order.id);
      // remember this order for the buyer's "My orders" page
      const prev = JSON.parse(localStorage.getItem('loopy_orders') || '[]');
      localStorage.setItem('loopy_orders', JSON.stringify([order.id, ...prev]));
      clear();
      router.push(`/orders/${order.id}?placed=1`);
    } catch (e: any) {
      alert(e.message);
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return <main className="grid min-h-screen place-items-center bg-cream text-muted">Your bag is empty.</main>;
  }

  return (
    <main className="min-h-screen bg-cream pb-28">
      <StoreNav />
      <div className="mx-auto max-w-xl px-5 py-6">
        <button onClick={() => router.back()} className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted"><Back size={16} /> Back</button>
        <h1 className="font-serif text-[24px] font-semibold">Checkout</h1>

        <div className="mt-4 text-sm font-bold">Deliver to</div>
        <div className="card mt-2 space-y-2 p-4">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Address" value={address} onChange={setAddress} />
        </div>

        <div className="mt-4 text-sm font-bold">Payment</div>
        <div className="card mt-2 p-2">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-soft text-indigo">⚡</span>
            <span className="flex-1 text-[13px] font-bold">UPI · GPay / PhonePe</span>
            <span className="h-[18px] w-[18px] rounded-full border-[5px] border-indigo" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#D9D3F7] bg-indigo-soft px-3.5 py-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-indigo"><Shield size={18} /></span>
          <p className="text-[11.5px] text-[#352c8f]"><b>Protected by Loopy.</b> We hold your {rupees(total)} and release it to the seller only after you confirm delivery.</p>
        </div>

        <div className="card mt-4 flex items-center justify-between p-4">
          <span className="text-sm text-muted">Order total</span>
          <span className="font-serif text-[21px] font-semibold">{rupees(total)}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white px-5 py-3">
        <div className="mx-auto max-w-xl">
          <button disabled={busy} onClick={pay} className="btn-grn w-full disabled:opacity-60">
            <Lock size={18} /> {busy ? 'Processing…' : `Pay securely · ${rupees(total)}`}
          </button>
          <div className="mt-2 text-center text-[11px] text-faint">Powered by Razorpay · stubbed in this MVP scaffold</div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-xl border border-line px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" />
    </label>
  );
}
