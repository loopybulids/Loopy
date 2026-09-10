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
    <span className="whitespace-nowrap text-[14px] tracking-[1px] text-amber">
      {'★'.repeat(n)}
      <span className="text-line">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('');

  const load = (f: string) => api.adminReviews(f || undefined).then(setD).catch((e) => setErr(e?.message || 'Failed to load'));
  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <Card className="p-6 text-rose">{err}</Card>;
  if (!d) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-line" /><div className="h-24 rounded-2xl bg-line/60" /></div>;

  const s = d.summary;
  // A public average meaningfully above the true one means feedback is being filtered.
  const gap = Math.round((s.avgVisible - s.avgAll) * 10) / 10;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-extrabold text-navy">Reviews</h1>
          <p className="text-[14px] text-muted">Every review customers have written, including ones sellers have hidden.</p>
        </div>
        <button onClick={() => load(filter)} className="rounded-xl bg-navy px-3.5 py-2 text-[12.5px] font-bold text-white">Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total reviews" value={String(s.total)} icon="chart" accent="navy" />
        <StatCard label="True average" value={s.avgAll ? `${s.avgAll}★` : '—'} icon="star" accent="navy" hint="All reviews" />
        <StatCard label="Public average" value={s.avgVisible ? `${s.avgVisible}★` : '—'} icon="star" accent={gap >= 0.3 ? 'amber' : 'green'} hint="What shoppers see" />
        <StatCard label="Hidden by sellers" value={String(s.hidden)} icon="alert" accent={s.hidden ? 'amber' : 'green'} />
        <StatCard label="1–2 star" value={String(s.lowRatings)} icon="alert" accent={s.lowRatings ? 'rose' : 'green'} />
      </div>

      {gap >= 0.3 && (
        <div className="rounded-2xl border border-amber/40 bg-amber-soft/40 px-4 py-3">
          <div className="text-[13.5px] font-bold text-navy">Public ratings are {gap}★ higher than the real ones</div>
          <p className="mt-0.5 text-[12.5px] text-muted">
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
              filter === f.key ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <SectionTitle action={<span className="text-[12px] font-semibold text-muted">{d.reviews.length} shown</span>}>
            {FILTERS.find((f) => f.key === filter)?.label}
          </SectionTitle>
        </div>

        {d.reviews.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-[14px] font-bold text-navy">Nothing here</div>
            <p className="mt-1 text-[13px] text-muted">
              {filter === 'hidden' ? 'No seller has hidden a review.' : 'No reviews match this filter yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {d.reviews.map((r: any) => (
              <div key={r.id} className={`p-4 ${r.hidden ? 'bg-paper/50' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars n={r.rating} />
                      {r.hidden && <Chip tone="amber">Hidden by seller</Chip>}
                      {r.rating <= 2 && !r.hidden && <Chip tone="rose">Low rating</Chip>}
                    </div>

                    {r.comment
                      ? <p className="mt-2 text-[13.5px] text-navy">{r.comment}</p>
                      : <p className="mt-2 text-[13px] italic text-faint">No comment — rating only.</p>}

                    {r.hidden && (
                      <div className="mt-2 rounded-lg border border-amber/30 bg-amber-soft/30 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Reason the seller gave</div>
                        <p className="mt-0.5 text-[12.5px] text-navy">{r.hiddenReason || 'None given.'}</p>
                        {r.hiddenAt && (
                          <p className="text-[11px] text-faint">Hidden {new Date(r.hiddenAt).toLocaleString('en-IN')}</p>
                        )}
                      </div>
                    )}

                    {r.response && (
                      <div className="mt-2 rounded-lg bg-green-mint/60 px-3 py-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-green-600">Seller replied</div>
                        <p className="mt-0.5 text-[12.5px] text-navy">{r.response}</p>
                      </div>
                    )}
                  </div>

                  {/* who and where */}
                  <div className="shrink-0 space-y-1 text-right text-[12px]">
                    {r.seller && (
                      <div>
                        <Link href={`/admin/sellers`} className="font-bold text-navy hover:underline">
                          {r.seller.storeName}
                        </Link>
                        {r.seller.username && <div className="font-mono text-[11px] text-faint">@{r.seller.username}</div>}
                      </div>
                    )}
                    <div className="text-muted">{r.product}</div>
                    <div className="text-faint">
                      {r.customer?.name || 'Guest'}
                      {r.customer?.email && <div className="text-[11px]">{r.customer.email}</div>}
                    </div>
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted hover:text-navy"
                    >
                      <Icon name="bag" size={12} /> #{String(r.orderId).slice(-6).toUpperCase()}
                    </Link>
                    <div className="text-[11px] text-faint">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
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
