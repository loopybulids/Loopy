'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AreaTrend, Card, Donut, num, SectionTitle, StatCard } from './AdminKit';

/**
 * Site traffic from Google Analytics, beside the order figures.
 *
 * The order data on this screen answers "what sold"; this answers "who turned
 * up at all", which is the half that explains a quiet week. Both follow the
 * same date range, so the two can be read against each other without doing
 * arithmetic between two browser tabs.
 *
 * Loads separately from the rest of the screen: the call goes out to Google
 * and is the slowest thing here, and there is no reason for the revenue chart
 * to wait on it.
 */

/** 84 → "1m 24s" — GA's own way of writing engagement time. */
function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds || 0));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** GA reports the landing page as `/`, which reads as nothing in a list. */
const pageLabel = (path: string) => (path === '/' || path === '' ? 'Home' : path);

function Setup() {
  return (
    <Card className="p-5">
      <SectionTitle>Site Traffic</SectionTitle>
      <p className="text-[13px] leading-relaxed text-dim">
        Google Analytics isn&apos;t connected to this console yet. The tag on the storefront may already be
        collecting — this is the separate, read-only access that lets Loopy show those numbers here.
      </p>
      <ol className="mt-3 space-y-1.5 text-[12.5px] text-dim">
        <li>1. In Google Cloud, create a service account and download its JSON key.</li>
        <li>2. In Google Analytics → Admin → Property access management, add that service account&apos;s email as a <b className="text-slate">Viewer</b>.</li>
        <li>3. Set <code className="rounded bg-cool px-1 py-0.5 text-[11.5px] text-slate">GA_PROPERTY_ID</code> (the numeric id from Admin → Property details) and <code className="rounded bg-cool px-1 py-0.5 text-[11.5px] text-slate">GA_SERVICE_ACCOUNT_JSON</code> on the backend, then redeploy.</li>
      </ol>
    </Card>
  );
}

export default function SiteTraffic({ query, label }: { query: string; label: string }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let current = true;
    setD(null);
    api.adminTraffic(query)
      .then((r) => { if (current) { setD(r); setErr(''); } })
      .catch((e) => { if (current) setErr(e?.message || 'Could not load traffic'); });
    return () => { current = false; };
  }, [query]);

  if (!d && !err) {
    return <Card className="p-5"><SectionTitle>Site Traffic</SectionTitle><div className="h-40 animate-pulse rounded-lg bg-cool" /></Card>;
  }
  if (err || d?.error) {
    return (
      <Card className="p-5">
        <SectionTitle>Site Traffic</SectionTitle>
        <p className="text-[13px] text-alert">{err || d.error}</p>
      </Card>
    );
  }
  if (!d?.configured) return <Setup />;

  const t = d.totals;
  const quiet = !t.visitors;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-bold text-slate">Site Traffic</h2>
          <p className="text-[12.5px] text-dim">From Google Analytics · {label}</p>
        </div>
      </div>

      {quiet && (
        <Card className="p-4">
          <p className="text-[12.5px] text-dim">
            No visits recorded for this period. If the tag went live recently, Google can take up to 48 hours
            to report — check Realtime in Google Analytics to confirm it is firing.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Visitors" value={num(t.visitors)} icon="users" accent="navy" hint={`${num(t.newVisitors)} new`} />
        <StatCard label="Sessions" value={num(t.sessions)} icon="pulse" accent="violet" />
        <StatCard label="Page Views" value={num(t.pageViews)} icon="grid" accent="green" />
        <StatCard label="Avg Engagement" value={duration(t.avgEngagement)} icon="bolt" accent="navy" hint="per session" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle action={<span className="text-[12px] font-semibold text-dim">{label}</span>}>Visitors</SectionTitle>
          <AreaTrend data={d.visitorsSeries} color="#6366f1" height={200} />
        </Card>
        <Card className="p-5">
          <SectionTitle>How They Arrive</SectionTitle>
          {d.channels.length
            ? <Donut data={d.channels} height={190} />
            : <p className="py-10 text-center text-[12.5px] text-pale">No sessions yet.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle action={<span className="text-[11.5px] text-pale">by page views</span>}>Most Visited Pages</SectionTitle>
          {d.pages.length ? (
            <div className="space-y-2">
              {d.pages.map((p: any) => (
                <div key={p.path} className="flex items-center justify-between gap-3 border-b border-hair pb-2 last:border-0 last:pb-0">
                  <span className="truncate font-mono text-[12px] text-slate" title={p.path}>{pageLabel(p.path)}</span>
                  <span className="shrink-0 text-[12px] text-dim">
                    <b className="text-slate">{num(p.views)}</b> views · {num(p.visitors)} visitors
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-[12.5px] text-pale">No page views yet.</p>}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Devices</SectionTitle>
            {d.devices.length
              ? <Donut data={d.devices} height={160} />
              : <p className="py-8 text-center text-[12.5px] text-pale">No sessions yet.</p>}
          </Card>
          {d.cities.length > 0 && (
            <Card className="p-5">
              <SectionTitle>Top Cities</SectionTitle>
              <div className="space-y-1.5">
                {d.cities.map((c: any) => (
                  <div key={c.name} className="flex items-center justify-between text-[12.5px]">
                    <span className="truncate text-slate">{c.name}</span>
                    <span className="shrink-0 font-semibold text-dim">{num(c.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
