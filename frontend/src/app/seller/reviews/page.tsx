'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, StatCard, Panel, Empty } from '@/components/seller-ui';
import { Star, MessageDots, Check } from '@/components/icons';

function Stars({ n }: { n: number }) {
  return <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= n ? 'text-amber' : 'text-line'} />)}</span>;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');

  const load = () => api.myReviews().then((r) => { setReviews(r || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const reply = async (id: string) => {
    const text = (draft[id] || '').trim();
    if (!text) return;
    setBusy(id);
    try { await api.respondReview(id, text); setDraft((d) => ({ ...d, [id]: '' })); await load(); }
    catch { /* ignore */ } finally { setBusy(''); }
  };

  /**
   * Take a review off the storefront, or put it back.
   *
   * A reason is asked for and shown back to the seller, so the decision is
   * recorded rather than silent — Loopy's admins see both the review and why
   * it was hidden.
   */
  const toggleHidden = async (r: any) => {
    let reason: string | null = null;
    if (!r.hidden) {
      reason = window.prompt(
        'Hide this review from your storefront?\n\nIt stops showing to shoppers and stops counting towards your rating. '
        + 'It is not deleted — Loopy can still see it.\n\nReason (optional):',
        '',
      );
      if (reason === null) return;
    }
    setBusy(r.id);
    try { await api.hideReview(r.id, !r.hidden, reason || undefined); await load(); }
    catch (e: any) { alert(e?.message || 'Could not update this review.'); }
    finally { setBusy(''); }
  };

  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  const replied = reviews.filter((r) => r.response).length;

  return (
    <div>
      <PageHead title="Reviews" sub="See what customers say and reply to build trust." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg ? `${avg}★` : '—'} icon={<Star size={18} />} accent />
        <StatCard label="Total reviews" value={reviews.length} icon={<MessageDots size={18} />} />
        <StatCard label="Replied" value={`${replied}/${reviews.length}`} />
      </div>

      <Panel className="mt-6" title="Customer reviews">
        {loading ? <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
          : reviews.length === 0 ? (
            <Empty icon={<MessageDots size={24} />} title="No reviews yet" hint="Once customers receive their orders and leave reviews, they’ll appear here for you to respond to." />
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className={`rounded-xl border p-4 ${r.hidden ? 'border-dashed border-line bg-paper/50' : 'border-line'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-green-soft text-[12px] font-extrabold text-green-600">{(r.buyerName || 'C').charAt(0).toUpperCase()}</span>
                      <div>
                        <div className="text-[13.5px] font-bold text-navy">{r.buyerName}</div>
                        <div className="text-[11px] text-faint">{r.product} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                    <Stars n={r.rating} />
                  </div>
                  {r.comment && <p className={`mt-2.5 text-[13.5px] ${r.hidden ? 'text-muted line-through decoration-line' : 'text-navy'}`}>{r.comment}</p>}

                  {r.hidden && (
                    <div className="mt-2.5 rounded-lg border border-line bg-white px-3 py-2">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Hidden from your storefront</div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {r.hiddenReason || 'No reason given.'} Shoppers can&apos;t see it and it no longer counts
                        towards your rating. Loopy can still see it.
                      </p>
                    </div>
                  )}

                  {r.response ? (
                    <div className="mt-3 rounded-lg bg-green-soft/50 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-600"><Check size={12} /> Your reply</div>
                      <p className="mt-1 text-[13px] text-navy">{r.response}</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={draft[r.id] || ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && reply(r.id)}
                        placeholder="Write a public reply…"
                        className="c-input flex-1"
                      />
                      <button onClick={() => reply(r.id)} disabled={busy === r.id || !(draft[r.id] || '').trim()} className="btn-green px-4 py-2 text-[13px] disabled:opacity-50">
                        {busy === r.id ? '…' : 'Reply'}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end border-t border-line pt-2.5">
                    <button
                      onClick={() => toggleHidden(r)}
                      disabled={busy === r.id}
                      className="text-[12px] font-bold text-muted underline decoration-line underline-offset-2 hover:text-navy disabled:opacity-50"
                    >
                      {r.hidden ? 'Show on storefront' : 'Hide from storefront'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}
