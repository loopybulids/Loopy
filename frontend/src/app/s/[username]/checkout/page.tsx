'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { custApi, getCart, getCust, clearCart, type CartItem } from '@/lib/customer';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import CustomerAuth from '@/components/store/CustomerAuth';
import { Check, ShieldLock } from '@/components/icons';

const BLANK = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function CheckoutPage() {
  const { username } = useParams<{ username: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('new');
  const [addr, setAddr] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [placed, setPlaced] = useState<any>(null);
  const setA = (k: keyof typeof addr, v: string) => setAddr((s) => ({ ...s, [k]: v }));

  const load = () => {
    setCart(getCart(username));
    if (!getCust(username)) { setSignedIn(false); return; }
    setSignedIn(true);
    custApi.addresses(username).then((a) => { setAddresses(a || []); if (a?.length) setSelected(a[0].id); }).catch(() => {});
  };
  useEffect(() => { load(); window.addEventListener('cust-change', load); window.addEventListener('cart-change', () => setCart(getCart(username))); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const place = async () => {
    setErr('');
    if (!cart.length) return setErr('Your cart is empty.');
    setBusy(true);
    try {
      let addressId = selected !== 'new' ? selected : undefined;
      if (selected === 'new') {
        for (const f of ['name', 'phone', 'line1', 'city', 'pincode'] as const) if (!addr[f]) { setBusy(false); return setErr('Please fill in name, phone, address, city and pincode.'); }
        const saved = await custApi.addAddress(username, addr);
        addressId = saved.id;
      }
      const order = await custApi.checkout(username, { addressId, items: cart.map((i) => ({ productId: i.productId, quantity: i.qty, size: i.size })) });
      clearCart(username);
      setPlaced(order);
    } catch (e: any) { setErr(e?.message || 'Could not place order.'); } finally { setBusy(false); }
  };

  if (placed) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-5 text-center">
        <div className="animate-riseIn">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white"><Check size={30} /></span>
          <h1 className="mt-4 font-display text-[26px] font-extrabold text-navy">Order placed!</h1>
          <p className="mt-1 text-muted">Order #{String(placed.id).slice(-6).toUpperCase()} · {rupees(placed.totalAmount)}</p>
          <p className="mt-1 text-[13px] text-muted">The seller has been notified and will ship your order soon.</p>
          <Link href={`/s/${username}`} className="btn-green mt-6 inline-flex">Continue shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[24px] font-extrabold text-navy">Checkout</h1>

        {!signedIn ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <p className="font-display text-[16px] font-bold text-navy">Sign in to place your order</p>
            <button onClick={() => setAuthOpen(true)} className="btn-green mt-4 inline-flex">Sign in</button>
          </div>
        ) : cart.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <p className="font-display text-[16px] font-bold text-navy">Your cart is empty</p>
            <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            {/* address */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="font-display text-[15px] font-extrabold text-navy">Delivery address</h2>
                {addresses.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {addresses.map((a) => (
                      <label key={a.id} className={`flex cursor-pointer gap-2 rounded-xl border p-3 text-[13px] ${selected === a.id ? 'border-green bg-green-soft/40' : 'border-line'}`}>
                        <input type="radio" checked={selected === a.id} onChange={() => setSelected(a.id)} className="mt-1 accent-green-600" />
                        <span><b className="text-navy">{a.name}</b> · {a.phone}<br /><span className="text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} - {a.pincode}</span></span>
                      </label>
                    ))}
                    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[13px] font-semibold ${selected === 'new' ? 'border-green bg-green-soft/40' : 'border-line'}`}>
                      <input type="radio" checked={selected === 'new'} onChange={() => setSelected('new')} className="accent-green-600" /> Add a new address
                    </label>
                  </div>
                )}
                {selected === 'new' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input className="c-input" placeholder="Full name" value={addr.name} onChange={(e) => setA('name', e.target.value)} />
                    <input className="c-input" placeholder="Phone" value={addr.phone} onChange={(e) => setA('phone', e.target.value)} />
                    <input className="c-input col-span-2" placeholder="Address line 1" value={addr.line1} onChange={(e) => setA('line1', e.target.value)} />
                    <input className="c-input col-span-2" placeholder="Address line 2 (optional)" value={addr.line2} onChange={(e) => setA('line2', e.target.value)} />
                    <input className="c-input" placeholder="City" value={addr.city} onChange={(e) => setA('city', e.target.value)} />
                    <input className="c-input" placeholder="Pincode" value={addr.pincode} onChange={(e) => setA('pincode', e.target.value)} />
                    <input className="c-input col-span-2" placeholder="State (optional)" value={addr.state} onChange={(e) => setA('state', e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {/* summary */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-[15px] font-extrabold text-navy">Order summary</h2>
              <div className="mt-3 space-y-2">
                {cart.map((i) => (
                  <div key={i.productId + (i.size || '')} className="flex justify-between text-[13px]"><span className="truncate text-navy">{i.title}{i.size ? ` (${i.size})` : ''} ×{i.qty}</span><span className="font-semibold text-navy">{rupees(i.price * i.qty)}</span></div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-[14px]"><span className="text-muted">Subtotal</span><span className="font-bold text-navy">{rupees(subtotal)}</span></div>
              <p className="mt-1 text-[11px] text-faint">+ shipping (added by the store)</p>
              {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
              <button onClick={place} disabled={busy} className="btn-green mt-4 w-full justify-center disabled:opacity-60">{busy ? 'Placing…' : 'Place order'}</button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-faint"><ShieldLock size={12} /> Loopy-protected payment</p>
            </div>
          </div>
        )}
      </div>
      {authOpen && <CustomerAuth username={username} onClose={() => setAuthOpen(false)} onAuthed={() => { setAuthOpen(false); load(); }} />}
    </main>
  );
}
