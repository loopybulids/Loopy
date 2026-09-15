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
  // After returning from the gateway: confirming, or why it didn't go through.
  const [payState, setPayState] = useState<null | {
    orderId: string;
    status: 'checking' | 'pending' | 'expired' | 'mismatch' | 'late' | 'cancelled' | 'error';
    message?: string;
  }>(null);
  const [shipping, setShipping] = useState<any>(null);
  const [feePct, setFeePct] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponErr, setCouponErr] = useState('');
  const [checking, setChecking] = useState(false);
  const setA = (k: keyof typeof addr, v: string) => setAddr((s) => ({ ...s, [k]: v }));

  const load = () => {
    setCart(getCart(username));
    if (!getCust(username)) { setSignedIn(false); return; }
    setSignedIn(true);
    custApi.addresses(username).then((a) => { setAddresses(a || []); if (a?.length) setSelected(a[0].id); }).catch(() => {});
  };

  // The store's shipping rules — needed to show a real total, not "+ shipping".
  useEffect(() => {
    api.getStore(username).then((s: any) => {
      setShipping(s?.shipping || null);
      setFeePct(s?.platformFeePct ?? null);
    }).catch(() => {});
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
  // Platform fee, charged on the goods value on top of shipping. Must match
  // computeAmounts() in backend/src/common/money.ts or the total shown here
  // won't be the total charged.
  // A seller's coupon comes off the goods value. The platform fee is a flat
  // percentage of the LIST price and is not reduced by it — same order of
  // operations as computeAmounts() on the server.
  const discount = Math.min(coupon?.discount ?? 0, subtotal);
  const netItems = subtotal - discount;
  const fee = feePct == null ? null : Math.round((subtotal * feePct) / 100);
  const total = shipCost == null || fee == null ? null : netItems + shipCost + fee;
  const belowMin = shipping?.minOrderAmount != null && subtotal < shipping.minOrderAmount;

  const applyCoupon = async () => {
    const wanted = code.trim();
    if (!wanted) return;
    setChecking(true); setCouponErr('');
    try {
      setCoupon(await custApi.previewCoupon(username, wanted, subtotal));
    } catch (e: any) {
      setCoupon(null);
      setCouponErr(e?.message || 'That code could not be applied.');
    } finally { setChecking(false); }
  };

  const removeCoupon = () => { setCoupon(null); setCode(''); setCouponErr(''); };

  /**
   * A coupon priced against an old cart is a wrong quote — re-check it
   * whenever the subtotal moves, and drop it if it no longer qualifies.
   */
  useEffect(() => {
    if (!coupon) return;
    let alive = true;
    custApi.previewCoupon(username, coupon.code, subtotal)
      .then((c: any) => { if (alive) { setCoupon(c); setCouponErr(''); } })
      .catch((e: any) => { if (alive) { setCoupon(null); setCouponErr(e?.message || 'That code no longer applies.'); } });
    return () => { alive = false; };
  }, [subtotal]); // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * Back from the gateway with ?paid=<order id>.
   *
   * The redirect proves nothing — it is just a URL — so the order is shown as
   * placed only once the server has confirmed the payment with FamGateway. A
   * UPI payment can take a few seconds to register, so this polls for about
   * two and a half minutes before handing over to "My orders".
   */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('paid');
    if (!id) return;
    let stop = false;
    let tries = 0;
    setPayState({ orderId: id, status: 'checking' });

    const tick = async () => {
      if (stop) return;
      tries += 1;
      try {
        const r = await custApi.verifyPayment(username, id);
        if (stop) return;
        if (r?.status === 'paid') {
          clearCart(username);
          window.history.replaceState(null, '', window.location.pathname);
          setPayState(null);
          setPlaced(r.order);
          return;
        }
        if (r?.status === 'mismatch' || r?.status === 'late' || r?.status === 'cancelled') {
          setPayState({ orderId: id, status: r.status });
          return;
        }
        // A session can read "expired" for a moment before a payment made at
        // the last second registers, so give it a few checks before saying so.
        if (r?.status === 'expired' && tries >= 8) {
          setPayState({ orderId: id, status: 'expired' });
          return;
        }
        setPayState({ orderId: id, status: 'pending' });
      } catch (e: any) {
        if (stop) return;
        if (tries >= 4) {
          setPayState({ orderId: id, status: 'error', message: e?.message || 'We could not check your payment.' });
          return;
        }
      }
      if (tries < 38) setTimeout(tick, 4000);
      else setPayState({ orderId: id, status: 'pending', message: 'Still waiting for the payment to show up.' });
    };

    tick();
    return () => { stop = true; };
  }, [username]);

  const returnUrl = () => `${window.location.origin}${window.location.pathname}`;

  const retryPayment = async (orderId: string) => {
    setPayState({ orderId, status: 'checking' });
    try {
      const session = await custApi.pay(username, orderId, returnUrl());
      window.location.assign(session.checkoutUrl);
    } catch (e: any) {
      setPayState({ orderId, status: 'error', message: e?.message || 'We could not start the payment.' });
    }
  };

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
        onlineMethod: 'upi',
        // Only the code travels — the server prices it itself.
        couponCode: coupon?.code || undefined,
        // Where the gateway sends the buyer after paying; the server adds ?paid=<order id>.
        returnUrl: returnUrl(),
      });
      if (order?.payment?.checkoutUrl) {
        // The cart is kept until the payment is confirmed on the way back, so
        // abandoning the UPI page doesn't also throw away what they picked.
        window.location.assign(order.payment.checkoutUrl);
        return;
      }
      if (order?.status === 'PendingPayment') {
        setPayState({ orderId: order.id, status: 'error', message: order.paymentError || 'We could not start the payment. Your order is saved — try again.' });
        return;
      }
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
            <h1 className="mt-4 font-display text-[26px] font-bold text-navy">Payment received</h1>
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

  if (payState) {
    const { status, orderId } = payState;
    const waiting = status === 'checking' || status === 'pending';
    const heading = waiting ? 'Confirming your payment…'
      : status === 'expired' ? 'Payment not completed'
      : status === 'mismatch' ? 'The amount didn’t match'
      : status === 'late' ? 'Payment received late'
      : status === 'cancelled' ? 'This order was cancelled'
      : 'Payment needs attention';
    const detail = waiting ? (payState.message || 'This usually takes a few seconds after you pay in your UPI app. Keep this page open.')
      : status === 'expired' ? 'The payment window closed before a payment arrived. You have not been charged, and your order is saved — you can try again.'
      : status === 'mismatch' ? 'A payment arrived, but not for the full amount. Please don’t pay again — contact the store with the UPI reference from your app.'
      : status === 'late' ? 'Your payment arrived after the order had timed out, so the items were released. You will be refunded in full — please contact the store if you have questions.'
      : status === 'cancelled' ? 'The payment wasn’t completed in time, so the order was cancelled. You have not been charged — please place it again.'
      : payState.message || 'Something went wrong while checking your payment.';

    return (
      <main className="min-h-screen bg-paper px-5 py-10">
        <div className="mx-auto max-w-md animate-riseIn rounded-2xl border border-line bg-white p-6 text-center shadow-card">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${waiting ? 'bg-green-soft text-green-600' : 'bg-amber-soft text-amber'}`}>
            {waiting
              ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              : <ShieldLock size={24} />}
          </span>
          <h1 className="mt-4 font-display text-[21px] font-bold text-navy">{heading}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{detail}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {(status === 'expired' || status === 'error') && (
              <button onClick={() => retryPayment(orderId)} className="btn-green">Try the payment again</button>
            )}
            <Link href={`/s/${username}/orders`} className="btn-ghost">My orders</Link>
          </div>
          <p className="mt-4 font-num text-[11px] text-faint">Order #{orderId.slice(-6).toUpperCase()}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <StoreAccountBar username={username} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-[24px] font-bold text-navy">Checkout</h1>

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
                <h2 className="font-display text-[15px] font-bold text-navy">Delivery address</h2>
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
              <h2 className="font-display text-[15px] font-bold text-navy">
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
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Discount · {coupon.code}</span>
                    <span className="font-semibold text-green-600">−{rupees(discount)}</span>
                  </div>
                )}
                {fee != null && fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Platform fee</span>
                    <span className="font-semibold text-navy">{rupees(fee)}</span>
                  </div>
                )}

                {/* coupon */}
                <div className="!mt-3 border-t border-line pt-3">
                  {coupon ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="chip-green">{coupon.code}</span>
                        <span className="ml-2 text-[11.5px] text-muted">{coupon.description}</span>
                      </span>
                      <button onClick={removeCoupon} className="shrink-0 text-[12px] font-semibold text-muted underline hover:text-navy">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={code}
                          onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponErr(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                          placeholder="Discount code"
                          aria-label="Discount code"
                          className="c-input min-w-0 flex-1 uppercase"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={checking || !code.trim()}
                          className="shrink-0 rounded-xl bg-navy px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
                        >
                          {checking ? '…' : 'Apply'}
                        </button>
                      </div>
                      {couponErr && <p className="mt-1.5 text-[11.5px] text-rose">{couponErr}</p>}
                    </>
                  )}
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-[15px]">
                  <span className="font-semibold text-navy">Total</span>
                  <span className="font-display font-bold text-green-600">
                    {total == null ? '…' : rupees(total)}
                  </span>
                </div>
                {shipping?.shipDays != null && (
                  <p className="text-[11.5px] text-faint">Usually dispatched in {shipping.shipDays} day{shipping.shipDays === 1 ? '' : 's'}</p>
                )}
              </div>

              {/* payment method — UPI is the only method the gateway takes, so
                  offering Card or Netbanking would be a choice that did nothing */}
              <div className="mt-4 border-t border-line pt-3">
                <div className="text-[12px] font-bold uppercase tracking-wide text-faint">Payment method</div>
                <div className="mt-2 rounded-xl border border-green bg-green-soft/40 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[13px] font-semibold text-navy">
                    <span>UPI</span>
                    <span className="text-[11px] font-normal text-muted">GPay · PhonePe · Paytm · any UPI app</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
                    You’ll pay on a secure page with your UPI app or a QR code, then come straight back here.
                  </p>
                </div>
              </div>

              {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
              {belowMin && (
                <p className="mt-3 text-[12.5px] font-semibold text-amber">
                  Minimum order is {rupees(shipping.minOrderAmount)} — add {rupees(shipping.minOrderAmount - subtotal)} more to check out.
                </p>
              )}
              <button onClick={place} disabled={busy || belowMin || total == null} className="btn-green mt-4 w-full justify-center disabled:opacity-60">
                {busy ? 'Starting payment…' : total == null ? 'Loading…' : `Pay ${rupees(total)} by UPI`}
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
