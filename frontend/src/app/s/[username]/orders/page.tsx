'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { rupees } from '@/lib/api';
import { custApi, getCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import OrderDetail from '@/components/store/OrderDetail';

const OTHER = 'Other';
/** Preset cancellation reasons — the seller sees whichever is chosen. */
const REASONS = [
  'Ordered by mistake',
  'Changed my mind',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Item no longer needed',
  'Wrong size or variant selected',
  OTHER,
];

export default function TrackOrders() {
  const { username } = useParams<{ username: string }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
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

  const cancel = async (id: string) => {
    const final = reason === OTHER ? note.trim() : reason;
    if (!reason) return setErr('Please choose a reason.');
    if (reason === OTHER && !final) return setErr('Please tell us why you’re cancelling.');

    setErr('');
    setCancelling(id);
    try {
      const updated = await custApi.cancelOrder(username, id, final);
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      setConfirming(null);
      setReason(''); setNote('');
    } catch (e: any) {
      setErr(e?.message || 'Could not cancel this order.');
    } finally {
      setCancelling(null);
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
          <Link href={`/s/${username}`} className="btn-green mt-4 inline-flex">Browse products</Link>
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

                  {(o.seller?.contactEmail || o.seller?.contactPhone) && (
                    <p className="mt-2 border-t border-line pt-2 text-[12.5px] text-muted">
                      Questions? Contact {o.seller?.storeName || 'the store'} at{' '}
                      {o.seller?.contactEmail && (
                        <a href={`mailto:${o.seller.contactEmail}`} className="font-semibold text-green-600 hover:underline">
                          {o.seller.contactEmail}
                        </a>
                      )}
                      {o.seller?.contactEmail && o.seller?.contactPhone && ' · '}
                      {o.seller?.contactPhone && (
                        <a href={`tel:${o.seller.contactPhone}`} className="font-semibold text-green-600 hover:underline">
                          {o.seller.contactPhone}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              )}

              {o.status !== 'Cancelled' && (
                <div className="mt-4 border-t border-line pt-3.5">
                  {confirming === o.id ? (
                    <div className="rounded-xl border border-rose/30 bg-rose-soft/40 p-3.5">
                      <p className="text-[12.5px] font-semibold text-navy">
                        Why are you cancelling this order?
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted">The seller will see your reason.</p>

                      <div className="mt-2.5 space-y-1.5">
                        {REASONS.map((r) => (
                          <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] transition-colors ${reason === r ? 'border-rose text-navy' : 'border-line text-muted hover:text-navy'}`}>
                            <input
                              type="radio"
                              name={`cancel-${o.id}`}
                              checked={reason === r}
                              onChange={() => { setReason(r); setErr(''); }}
                              className="accent-rose"
                            />
                            {r}
                          </label>
                        ))}
                      </div>

                      {reason === OTHER && (
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          maxLength={300}
                          autoFocus
                          placeholder="Tell the seller why you're cancelling…"
                          className="c-input mt-2 text-[13px]"
                        />
                      )}

                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => cancel(o.id)}
                          disabled={cancelling === o.id}
                          className="rounded-lg bg-rose px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {cancelling === o.id ? 'Cancelling…' : 'Yes, cancel order'}
                        </button>
                        <button onClick={() => { setConfirming(null); setErr(''); setReason(''); setNote(''); }} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted hover:text-navy">
                          Keep order
                        </button>
                      </div>
                      {err && <p className="mt-2 text-[13px] font-semibold text-rose">{err}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirming(o.id); setErr(''); setReason(''); setNote(''); }}
                      className="text-[12.5px] font-semibold text-rose hover:underline"
                    >
                      Cancel this order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
