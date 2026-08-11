'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, rupees } from '@/lib/api';
import { custApi, getCart, getCust, clearCart, type CartItem } from '@/lib/customer';
import StoreAccountBar from '@/components/store/StoreAccountBar';
import CustomerAuth from '@/components/store/CustomerAuth';
import OrderDetail from '@/components/store/OrderDetail';
import { Bag, Check, ShieldLock } from '@/components/icons';

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
  const [shipping, setShipping] = useState<any>(null);
  const [onlineOpt, setOnlineOpt] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const setA = (k: keyof typeof addr, v: string) => setAddr((s) => ({ ...s, [k]: v }));

  const load = () => {
    setCart(getCart(username));
    if (!getCust(username)) { setSignedIn(false); return; }
    setSignedIn(true);
    custApi.addresses(username).then((a) => { setAddresses(a || []); if (a?.length) setSelected(a[0].id); }).catch(() => {});
  };

  // The store's shipping rules — needed to show a real total, not "+ shipping".
  useEffect(() => {
    api.getStore(username).then((s: any) => setShipping(s?.shipping || null)).catch(() => {});
  }, [username]);
  useEffect(() => { load(); window.addEventListener('cust-change', load); window.addEventListener('cart-change', () => setCart(getCart(username))); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  /**
   * Mirror the server's shipping maths so the buyer sees the real total before
   * committing. The backend recomputes this on checkout — this is display only,
   * never trusted as the price.
   */
  const freeShip = !!shipping?.freeShipEnabled
    && shipping?.freeShipThreshold != null
    && subtotal >= shipping.freeShipThreshold;
  const shipCost = shipping ? (freeShip ? 0 : shipping.fee ?? 0) : null;
  const total = shipCost == null ? subtotal : subtotal + shipCost;
  const belowMin = shipping?.minOrderAmount != null && subtotal < shipping.minOrderAmount;

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
      const order = await custApi.checkout(username, {
        addressId,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.qty, size: i.size })),
        paymentMethod: 'online',
        onlineMethod: onlineOpt,
      });
      clearCart(username);
      setPlaced(order);
    } catch (e: any) { setErr(e?.message || 'Could not place order.'); } finally { setBusy(false); }
  };

  if (placed) {
    return (
      <main className="min-h-screen bg-paper px-5 py-10">
        <div className="mx-auto max-w-lg animate-riseIn">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white"><Check size={30} /></span>
            <h1 className="mt-4 font-display text-[26px] font-extrabold text-navy">Order placed!</h1>
            <p className="mt-1 text-[13px] text-muted">The seller has been notified and will ship your order soon.</p>
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-left shadow-card">
            <OrderDetail order={placed} />
          </div>
          <div className="mt-5 flex justify-center gap-3">
            <Link href={`/s/${username}/orders`} className="btn-ghost">Track this order</Link>
            <Link href={`/s/${username}`} className="btn-green">Continue shopping</Link>
          </div>
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
                    <input className="c-input col-span-2" placeholder="Address line 2" value={addr.line2} onChange={(e) => setA('line2', e.target.value)} />
                    <input className="c-input" placeholder="City" value={addr.city} onChange={(e) => setA('city', e.target.value)} />
                    <input className="c-input" placeholder="Pincode" value={addr.pincode} onChange={(e) => setA('pincode', e.target.value)} />
                    <input className="c-input col-span-2" placeholder="State" value={addr.state} onChange={(e) => setA('state', e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {/* summary */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-[15px] font-extrabold text-navy">
                Order summary <span className="text-[12px] font-semibold text-muted">· {itemCount} item{itemCount === 1 ? '' : 's'}</span>
              </h2>
              <div className="mt-3 space-y-3">
                {cart.map((i) => (
                  <div key={i.productId + (i.size || '')} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
                      {i.image
                        ? <img src={i.image} alt={i.title} className="h-full w-full object-cover" />
                        : <span className="grid h-full w-full place-items-center text-faint"><Bag size={16} /></span>}
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">{i.qty}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-navy">{i.title}</div>
                      {i.size && <div className="text-[11.5px] text-muted">Size: {i.size}</div>}
                      <div className="text-[11.5px] text-faint">{rupees(i.price)} each</div>
                    </div>
                    <span className="whitespace-nowrap text-[13px] font-bold text-navy">{rupees(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[14px]">
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-semibold text-navy">{rupees(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  {shipCost == null
                    ? <span className="text-faint">Calculating…</span>
                    : freeShip
                      ? <span className="font-semibold text-green-600">Free</span>
                      : <span className="font-semibold text-navy">{rupees(shipCost)}</span>}
                </div>
                {shipping?.freeShipEnabled && shipping?.freeShipThreshold != null && !freeShip && (
                  <p className="text-[11.5px] text-green-600">
                    Add {rupees(shipping.freeShipThreshold - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-[15px]">
                  <span className="font-semibold text-navy">Total</span>
                  <span className="font-display font-extrabold text-green-600">{rupees(total)}</span>
                </div>
                {shipping?.shipDays != null && (
                  <p className="text-[11.5px] text-faint">Usually dispatched in {shipping.shipDays} day{shipping.shipDays === 1 ? '' : 's'}</p>
                )}
              </div>

              {/* payment method — online only */}
              <div className="mt-4 border-t border-line pt-3">
                <div className="text-[12px] font-bold uppercase tracking-wide text-faint">Payment method</div>
                <div className="mt-2 rounded-xl border border-green bg-green-soft/40 p-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-navy">
                    <span className="flex-1">Pay online</span>
                    <span className="text-[11px] font-normal text-muted">UPI · Cards · Netbanking</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {(['upi', 'card', 'netbanking'] as const).map((o) => (
                      <button key={o} type="button" onClick={() => setOnlineOpt(o)} className={`rounded-lg border px-2 py-2 text-[12px] font-semibold capitalize ${onlineOpt === o ? 'border-green bg-white text-green' : 'border-line bg-white text-navy hover:border-green/40'}`}>
                        {o === 'upi' ? 'UPI' : o === 'card' ? 'Card' : 'Netbanking'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
              {belowMin && (
                <p className="mt-3 text-[12.5px] font-semibold text-amber">
                  Minimum order is {rupees(shipping.minOrderAmount)} — add {rupees(shipping.minOrderAmount - subtotal)} more to check out.
                </p>
              )}
              <button onClick={place} disabled={busy || belowMin} className="btn-green mt-4 w-full justify-center disabled:opacity-60">
                {busy ? 'Placing…' : `Pay ${rupees(total)} online`}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-faint"><ShieldLock size={12} /> Loopy-protected payment</p>
            </div>
          </div>
        )}
      </div>
      {authOpen && <CustomerAuth username={username} onClose={() => setAuthOpen(false)} onAuthed={() => { setAuthOpen(false); load(); }} />}
    </main>
  );
}
