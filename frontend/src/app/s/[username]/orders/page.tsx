'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { custApi, getCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import OrderDetail from '@/components/store/OrderDetail';
import { storeHref } from '@/lib/store-url';

/**
 * Where asking the store to cancel still makes sense — anything that has not
 * reached the customer. A tick-list of reasons used to stand here, which asked
 * the buyer to classify themselves and told the seller almost nothing; a
 * sentence in their own words is more use to both.
 */
const CANCELLABLE = ['PendingPayment', 'Paid', 'Accepted', 'Shipped'];

export default function TrackOrders() {
  const { username } = useParams<{ username: string }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Which order's "ask the store" card is open, what they have typed, and
  // which request has been sent (with whether the email actually left).
  const [asking, setAsking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<{ id: string; emailed: boolean; store: string | null } | null>(null);
  const [err, setErr] = useState('');

  // Rating form: which order is open, and what has been picked so far.
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState<string | null>(null);

  /**
   * The review-request email links here as ?review=<orderId>, so the order it
   * asks about opens on its rating form rather than making the buyer hunt for
   * it in a list.
   */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('review');
    if (wanted) setReviewing(wanted);
  }, []);

  const submitReview = async (id: string) => {
    const stars = rating[id];
    if (!stars) return setErr('Pick a rating from 1 to 5 stars.');
    setErr('');
    setSavingReview(id);
    try {
      await custApi.addReview(username, id, stars, comment[id]?.trim() || undefined);
      setReviewing(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Could not save your review.');
    } finally {
      setSavingReview(null);
    }
  };

  const askToCancel = async (id: string) => {
    const text = message.trim();
    if (!text) return setErr('Please write a short message for the store.');

    setErr('');
    setSending(id);
    try {
      const r = await custApi.requestCancellation(username, id, text);
      setSent({ id, emailed: !!r?.emailed, store: r?.store || null });
      setAsking(null);
      setMessage('');
    } catch (e: any) {
      setErr(e?.message || 'Could not send your message.');
    } finally {
      setSending(null);
    }
  };

  // AccountShell owns the signed-out state, so this only handles the data.
  const load = () => {
    if (!getCust(username)) { setLoading(false); return; }
    setLoading(true);
    custApi.orders(username)
      .then((o: any[]) => setOrders(o || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    window.addEventListener('cust-change', load);
    return () => window.removeEventListener('cust-change', load);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AccountShell username={username} title="My orders">
      {loading ? (
        <p className="py-8 text-center text-[13px] text-faint">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <p className="font-display text-[16px] font-bold text-navy">No orders yet</p>
          <p className="mt-1 text-[13px] text-muted">When you place an order, it&apos;ll show up here.</p>
          <Link href={storeHref(username)} className="btn-green mt-4 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <OrderDetail order={o} />

              {/* Already rated — show it back, so they know it landed. */}
              {o.review && (
                <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] tracking-[2px] text-amber">
                      {'★'.repeat(o.review.rating)}<span className="text-line">{'★'.repeat(5 - o.review.rating)}</span>
                    </span>
                    <span className="text-[12px] font-semibold text-muted">Your rating</span>
                  </div>
                  {o.review.comment && <p className="mt-1.5 text-[13px] text-navy">{o.review.comment}</p>}
                  <p className="mt-1 text-[11.5px] text-faint">Thanks — this helps other shoppers.</p>
                </div>
              )}

              {/* Delivered and not yet rated: ask. */}
              {o.canReview && (
                <div className="mt-4 rounded-xl border border-green/30 bg-green-soft/30 p-3.5">
                  {reviewing === o.id ? (
                    <>
                      <div className="text-[13px] font-bold text-navy">How was this order?</div>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating((r) => ({ ...r, [o.id]: n }))}
                            aria-label={`${n} star${n === 1 ? '' : 's'}`}
                            className={`text-[26px] leading-none transition-colors ${
                              (rating[o.id] || 0) >= n ? 'text-amber' : 'text-line hover:text-amber/50'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                        {!!rating[o.id] && (
                          <span className="ml-2 text-[12.5px] font-semibold text-muted">
                            {['Poor', 'Not great', 'Okay', 'Good', 'Excellent'][rating[o.id] - 1]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={comment[o.id] || ''}
                        onChange={(e) => setComment((c) => ({ ...c, [o.id]: e.target.value }))}
                        rows={3}
                        maxLength={1000}
                        placeholder="What did you think of the item and the delivery? (optional)"
                        className="c-input mt-2.5 w-full"
                      />
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          onClick={() => submitReview(o.id)}
                          disabled={savingReview === o.id || !rating[o.id]}
                          className="btn-green px-4 py-2 text-[13px] disabled:opacity-50"
                        >
                          {savingReview === o.id ? 'Saving…' : 'Submit review'}
                        </button>
                        <button
                          onClick={() => setReviewing(null)}
                          className="rounded-xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-muted"
                        >
                          Not now
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-bold text-navy">Rate this order</div>
                        <p className="text-[12px] text-muted">Delivered — tell others what you thought.</p>
                      </div>
                      <button onClick={() => setReviewing(o.id)} className="btn-green px-4 py-2 text-[13px]">
                        Write a review
                      </button>
                    </div>
                  )}
                </div>
              )}

              {o.status === 'Cancelled' && (
                <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3.5">
                  <p className="text-[13px] font-semibold text-navy">
                    {o.cancelledBy === 'buyer' ? 'Order cancelled.' : 'This order was declined by the seller.'}
                  </p>
                  {/* A COD order was never charged, so promising a refund would be wrong. */}
                  {String(o.paymentId || '') !== 'cod' ? (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      Your payment of <b className="text-navy">{rupees(o.totalAmount ?? 0)}</b> will be refunded to your
                      original payment method within <b className="text-navy">4–5 business days</b>.
                    </p>
                  ) : (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      This was a Cash on Delivery order, so nothing was charged — there&apos;s no refund to process.
                    </p>
                  )}

                  <StoreContact seller={o.seller} orderId={o.id} className="mt-2 border-t border-line pt-2" />
                </div>
              )}

              {CANCELLABLE.includes(o.status) && (
                <div className="mt-4 border-t border-line pt-3.5">
                  {sent?.id === o.id ? (
                    <div className="rounded-xl border border-green/30 bg-green-soft/40 p-3.5">
                      <p className="text-[13px] font-bold text-navy">Message sent</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                        {sent.store || 'The store'} has your request and will confirm the cancellation. The order stays
                        open until they do{sent.emailed ? ', and a copy is in their inbox' : ''}.
                      </p>
                      {!sent.emailed && (
                        <p className="mt-1.5 text-[12px] font-semibold text-amber">
                          We couldn’t email them just now — it is in their Loopy console, but do message them directly too.
                        </p>
                      )}
                      <StoreContact seller={o.seller} orderId={o.id} className="mt-2" lead="Follow up with them —" />
                    </div>
                  ) : asking === o.id ? (
                    <div className="rounded-xl border border-line bg-paper/70 p-3.5">
                      <p className="text-[13px] font-bold text-navy">
                        Ask {o.seller?.storeName || 'the store'} to cancel this order
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                        The store cancels orders, so they can check whether yours has already been packed or posted —
                        and often fix what is wrong instead. Write to them below, or reach them directly.
                      </p>

                      <StoreContact
                        seller={o.seller}
                        orderId={o.id}
                        className="mt-2 border-t border-line pt-2"
                        lead="Message them directly —"
                      />

                      <textarea
                        autoFocus
                        rows={3}
                        maxLength={1000}
                        value={message}
                        onChange={(e) => { setMessage(e.target.value); setErr(''); }}
                        placeholder={`Hi, please cancel order #${String(o.id).slice(-6).toUpperCase()} — `}
                        className="c-input mt-2.5 text-[13px]"
                      />

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => askToCancel(o.id)}
                          disabled={sending === o.id}
                          className="btn-green px-4 py-2 text-[13px] disabled:opacity-60"
                        >
                          {sending === o.id ? 'Sending…' : 'Send to the store'}
                        </button>
                        <button
                          onClick={() => { setAsking(null); setErr(''); setMessage(''); }}
                          className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted hover:text-navy"
                        >
                          Keep order
                        </button>
                      </div>
                      {err && <p className="mt-2 text-[13px] font-semibold text-rose">{err}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAsking(o.id); setErr(''); setMessage(''); }}
                      className="text-[12.5px] font-semibold text-rose hover:underline"
                    >
                      Cancel this order
                    </button>
                  )}
                </div>
              )}

              {/*
                Past dispatch there is nothing honest to offer but the store's
                number. A parcel already on its way cannot be unmade from a web
                page, and the button used to appear on every order — including
                completed ones — which invited buyers to "cancel" something
                they already had.
              */}
              {!CANCELLABLE.includes(o.status) && !['Cancelled', 'Refunded'].includes(o.status) && (
                <div className="mt-4 border-t border-line pt-3.5">
                  <p className="text-[12.5px] leading-relaxed text-muted">
                    Need to cancel or return this order?{' '}
                    It has been delivered, so{' '}
                    {o.seller?.storeName || 'the store'} arranges that with you directly.
                  </p>
                  <StoreContact seller={o.seller} orderId={o.id} className="mt-1.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

/**
 * How to reach the store.
 *
 * Shown wherever the buyer's own options run out — after a cancellation, and
 * on anything already dispatched — so the next step is a person rather than a
 * dead end. Every channel the seller filled in on their profile appears, with
 * WhatsApp first: it is what most shoppers here actually use, and a tap opens
 * a chat already quoting the order, so nobody has to explain which one they
 * mean. Renders nothing at all when the seller published no details, rather
 * than an empty "Contact ... at".
 */
function StoreContact({ seller, orderId, className = '', lead }: {
  seller: any;
  orderId?: string;
  className?: string;
  /** Opening words before the links. Defaults to "Contact <store> at". */
  lead?: string;
}) {
  const store = seller?.storeName || 'the store';
  const ref = orderId ? `#${String(orderId).slice(-6).toUpperCase()}` : '';

  // A bare 10-digit Indian number needs its country code for wa.me to work.
  const waDigits = String(seller?.whatsapp || '').replace(/\D/g, '');
  const wa = waDigits.length === 10 ? `91${waDigits}` : waDigits;
  const handle = String(seller?.instagram || '').trim().replace(/^@/, '');

  const links = [
    wa.length >= 11 && {
      label: 'WhatsApp',
      href: `https://wa.me/${wa}${ref ? `?text=${encodeURIComponent(`Hi ${store}, about my order ${ref} —`)}` : ''}`,
    },
    seller?.contactPhone && { label: seller.contactPhone, href: `tel:${seller.contactPhone}` },
    seller?.contactEmail && { label: seller.contactEmail, href: `mailto:${seller.contactEmail}${ref ? `?subject=${encodeURIComponent(`Order ${ref}`)}` : ''}` },
    handle && { label: `@${handle}`, href: `https://instagram.com/${handle}` },
  ].filter(Boolean) as { label: string; href: string }[];

  /*
   * Nothing published. Rather than showing no way to reach the store at all,
   * fall back to the address the seller registered with — labelled plainly, so
   * a buyer is not misled into thinking it is a support desk.
   */
  if (!links.length) {
    const fallback = seller?.user?.email;
    if (!fallback) return null;
    return (
      <p className={`text-[12.5px] leading-relaxed text-muted ${className}`}>
        {lead ? `${lead} ` : `Contact ${store} at `}
        <a
          href={`mailto:${fallback}${ref ? `?subject=${encodeURIComponent(`Order ${ref}`)}` : ''}`}
          className="font-semibold text-green-600 hover:underline"
        >
          {fallback}
        </a>
        <span className="text-faint"> — the store hasn’t published a support contact.</span>
      </p>
    );
  }

  return (
    <p className={`text-[12.5px] leading-relaxed text-muted ${className}`}>
      {lead ? `${lead} ` : `Contact ${store} at `}
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && ' · '}
          <a
            href={l.href}
            target={l.href.startsWith('http') ? '_blank' : undefined}
            rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
            className="font-semibold text-green-600 hover:underline"
          >
            {l.label}
          </a>
        </span>
      ))}
    </p>
  );
}
