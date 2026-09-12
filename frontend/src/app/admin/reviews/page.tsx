'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Chip, Icon, SectionTitle, StatCard } from '@/components/admin/AdminKit';

/**
 * Every review on the platform — including the ones sellers have hidden.
 *
 * This is the top of the review hierarchy: a buyer writes, the seller may hide
 * it from their storefront, and this screen still shows it with the reason
 * given. Without it, hiding would be indistinguishable from deleting, and a
 * store could quietly bury every complaint it received.
 *
 * The two averages are deliberately shown side by side: if "public" is well
 * above "true", a store is filtering its own feedback.
 */

const FILTERS = [
  { key: '', label: 'All reviews' },
  { key: 'hidden', label: 'Hidden by sellers' },
  { key: 'low', label: '1–2 stars' },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap text-[14px] tracking-[1px] text-warn">
      {'★'.repeat(n)}
      <span className="text-hair">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('');

  const load = (f: string) => api.adminReviews(f || undefined).then(setD).catch((e) => setErr(e?.message || 'Failed to load'));
  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <Card className="p-6 text-alert">{err}</Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-hair" /><div className="h-24 rounded-2xl bg-hair/60" /></div>;

  const s = d.summary;
  // A public average meaningfully above the true one means feedback is being filtered.
  const gap = Math.round((s.avgVisible - s.avgAll) * 10) / 10;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate">Reviews</h1>
          <p className="text-[14px] text-dim">Every review customers have written, including ones sellers have hidden.</p>
        </div>
        <button onClick={() => load(filter)} className="rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-600">Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total reviews" value={String(s.total)} icon="chart" accent="navy" />
        <StatCard label="True average" value={s.avgAll ? `${s.avgAll}★` : '—'} icon="star" accent="navy" hint="All reviews" />
        <StatCard label="Public average" value={s.avgVisible ? `${s.avgVisible}★` : '—'} icon="star" accent={gap >= 0.3 ? 'amber' : 'green'} hint="What shoppers see" />
        <StatCard label="Hidden by sellers" value={String(s.hidden)} icon="alert" accent={s.hidden ? 'amber' : 'green'} />
        <StatCard label="1–2 star" value={String(s.lowRatings)} icon="alert" accent={s.lowRatings ? 'rose' : 'green'} />
      </div>

      {gap >= 0.3 && (
        <div className="rounded-2xl border border-warn/40 bg-warn-soft/40 px-4 py-3">
          <div className="text-[13.5px] font-bold text-slate">Public ratings are {gap}★ higher than the real ones</div>
          <p className="mt-0.5 text-[12.5px] text-dim">
            {s.hidden} review{s.hidden === 1 ? ' has' : 's have'} been hidden by sellers. Worth checking whether
            criticism is being filtered rather than answered.
          </p>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
              filter === f.key ? 'bg-slate text-white' : 'bg-white text-dim ring-1 ring-hair hover:text-slate'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-hair px-4 py-3">
          <SectionTitle action={<span className="text-[12px] font-semibold text-dim">{d.reviews.length} shown</span>}>
            {FILTERS.find((f) => f.key === filter)?.label}
          </SectionTitle>
        </div>

        {d.reviews.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-[14px] font-bold text-slate">Nothing here</div>
            <p className="mt-1 text-[13px] text-dim">
              {filter === 'hidden' ? 'No seller has hidden a review.' : 'No reviews match this filter yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hair">
            {d.reviews.map((r: any) => (
              <div key={r.id} className={`p-4 ${r.hidden ? 'bg-cool/50' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars n={r.rating} />
                      {r.hidden && <Chip tone="amber">Hidden by seller</Chip>}
                      {r.rating <= 2 && !r.hidden && <Chip tone="rose">Low rating</Chip>}
                    </div>

                    {r.comment
                      ? <p className="mt-2 text-[13.5px] text-slate">{r.comment}</p>
                      : <p className="mt-2 text-[13px] italic text-pale">No comment — rating only.</p>}

                    {r.hidden && (
                      <div className="mt-2 rounded-lg border border-warn/30 bg-warn-soft/30 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-pale">Reason the seller gave</div>
                        <p className="mt-0.5 text-[12.5px] text-slate">{r.hiddenReason || 'None given.'}</p>
                        {r.hiddenAt && (
                          <p className="text-[11px] text-pale">Hidden {new Date(r.hiddenAt).toLocaleString('en-IN')}</p>
                        )}
                      </div>
                    )}

                    {r.response && (
                      <div className="mt-2 rounded-lg bg-accent-soft/60 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Seller replied</div>
                        <p className="mt-0.5 text-[12.5px] text-slate">{r.response}</p>
                      </div>
                    )}
                  </div>

                  {/* who and where */}
                  <div className="shrink-0 space-y-1 text-right text-[12px]">
                    {r.seller && (
                      <div>
                        <Link href={`/admin/sellers`} className="font-bold text-slate hover:underline">
                          {r.seller.storeName}
                        </Link>
                        {r.seller.username && <div className="font-mono text-[11px] text-pale">@{r.seller.username}</div>}
                      </div>
                    )}
                    <div className="text-dim">{r.product}</div>
                    <div className="text-pale">
                      {r.customer?.name || 'Guest'}
                      {r.customer?.email && <div className="text-[11px]">{r.customer.email}</div>}
                    </div>
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-dim hover:text-slate"
                    >
                      <Icon name="bag" size={12} /> #{String(r.orderId).slice(-6).toUpperCase()}
                    </Link>
                    <div className="text-[11px] text-pale">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
