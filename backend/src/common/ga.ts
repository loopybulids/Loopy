import { createSign } from 'crypto';
import { bucketsOf, type DateRange } from './date-range';

/**
 * Google Analytics 4, read back into the admin console.
 *
 * The tag on the site answers "what did shoppers do"; the database answers
 * "what did they buy". Having to open analytics.google.com in another tab to
 * hold the two side by side is how a traffic collapse goes unnoticed for a
 * week, so the numbers are pulled in here instead.
 *
 * Read-only, and server-side on purpose: the service-account key can read the
 * whole property, so it never goes near the browser.
 *
 * No SDK. `@google-analytics/data` is a large dependency for two HTTP calls,
 * and this backend runs as a Vercel function where bundle size is deploy time
 * on every push. A service-account JWT is about forty lines of `crypto`.
 *
 * Setup — see backend/.env.example:
 *   GA_PROPERTY_ID           the numeric property id (Admin → Property details)
 *   GA_SERVICE_ACCOUNT_JSON  the key file, raw JSON or base64, for a service
 *                            account granted Viewer on that property
 *
 * Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_URL = 'https://analyticsdata.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TIMEOUT_MS = 15_000;

export class AnalyticsError extends Error {}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function credentials(): { sa: ServiceAccount; propertyId: string } | null {
  const raw = (process.env.GA_SERVICE_ACCOUNT_JSON || '').trim();
  const propertyId = (process.env.GA_PROPERTY_ID || '').trim();
  if (!raw || !propertyId) return null;

  /*
   * The property id is a bare number like 512345678. It is not the measurement
   * id (G-9EWZW4ESNG) and not the stream id, both of which are far easier to
   * find in the GA interface — so that mistake is worth naming rather than
   * letting it surface as a 403 from Google.
   */
  if (!/^\d+$/.test(propertyId)) {
    throw new AnalyticsError(
      `GA_PROPERTY_ID should be the numeric property id, not "${propertyId}". ` +
        'Find it in Google Analytics under Admin → Property details.',
    );
  }

  let sa: ServiceAccount;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    sa = JSON.parse(json);
  } catch {
    throw new AnalyticsError('GA_SERVICE_ACCOUNT_JSON is not valid JSON (or base64 of it).');
  }
  if (!sa.client_email || !sa.private_key) {
    throw new AnalyticsError('GA_SERVICE_ACCOUNT_JSON is missing client_email or private_key.');
  }
  // Survives a key that was pasted with its newlines escaped a second time.
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return { sa, propertyId };
}

export const gaConfigured = () => {
  try {
    return !!credentials();
  } catch {
    // Configured but wrong — let the request report why rather than showing
    // the "not set up yet" card, which would send an admin round in circles.
    return true;
  }
};

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

let cached: { email: string; token: string; expires: number } | null = null;

/** A Google access token for the service account, reused until it nears expiry. */
async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.email === sa.client_email && cached.expires > now + 60) return cached.token;

  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  let assertion: string;
  try {
    assertion = `${unsigned}.${signer.sign(sa.private_key, 'base64url')}`;
  } catch {
    throw new AnalyticsError('The Google service-account private key could not be read — re-copy the key file.');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);

  const json: any = res ? await res.json().catch(() => null) : null;
  if (!res?.ok || !json?.access_token) {
    throw new AnalyticsError(
      `Google refused the service account${json?.error_description ? `: ${json.error_description}` : ''}.`,
    );
  }

  cached = { email: sa.client_email, token: json.access_token, expires: now + Number(json.expires_in || 3600) };
  return cached.token;
}

interface GaRequest {
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dateRanges: { startDate: string; endDate: string }[];
  orderBys?: unknown[];
  limit?: number;
}

/** One report, flattened: dimension values as strings, metric values as numbers. */
interface GaTable {
  rows: { keys: string[]; values: number[] }[];
  totals: number[];
}

function flatten(report: any): GaTable {
  const cells = (r: any) => ({
    keys: (r?.dimensionValues || []).map((v: any) => String(v?.value ?? '')),
    values: (r?.metricValues || []).map((v: any) => Number(v?.value ?? 0) || 0),
  });
  return {
    rows: (report?.rows || []).map(cells),
    totals: report?.totals?.[0] ? cells(report.totals[0]).values : [],
  };
}

/** Up to five reports in one round trip — the Data API's own batch limit. */
async function batch(requests: GaRequest[]): Promise<GaTable[]> {
  const creds = credentials();
  if (!creds) throw new AnalyticsError('Google Analytics is not configured.');

  const token = await accessToken(creds.sa);
  const res = await fetch(`${DATA_URL}/properties/${creds.propertyId}:batchRunReports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);

  if (!res) throw new AnalyticsError('Could not reach Google Analytics.');
  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = String(json?.error?.message || '').slice(0, 200);
    if (res.status === 403) {
      throw new AnalyticsError(
        `Google Analytics refused access to property ${creds.propertyId}. ` +
          `Add ${creds.sa.client_email} as a Viewer on that property.`,
      );
    }
    throw new AnalyticsError(`Google Analytics error (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return (json?.reports || []).map(flatten);
}

export interface TrafficReport {
  configured: true;
  totals: {
    visitors: number;
    newVisitors: number;
    sessions: number;
    pageViews: number;
    /** Mean engaged seconds per session — GA's "average engagement time". */
    avgEngagement: number;
  };
  visitorsSeries: { date: string; label: string; value: number }[];
  pageViewsSeries: { date: string; label: string; value: number }[];
  pages: { path: string; views: number; visitors: number }[];
  channels: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  cities: { name: string; value: number }[];
}

const ga = (name: string) => ({ name });
const desc = (metric: string) => ({ metric: { metricName: metric }, desc: true });

/**
 * Traffic for a period, bucketed to match the console's own charts.
 *
 * GA reports days in the property's own timezone. Set that property to
 * (GMT+05:30) India Standard Time — every other date in this console is IST,
 * and a property left on US time would put an evening order in India on the
 * previous day here and today's day there.
 */
export async function fetchTraffic(range: DateRange): Promise<TrafficReport> {
  const dateRanges = [{ startDate: range.fromKey, endDate: range.toKey }];

  const [overTime, pages, channels, devices, cities] = await batch([
    {
      dimensions: [ga('date')],
      metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'userEngagementDuration'].map(ga),
      dateRanges,
      limit: 10_000,
    },
    { dimensions: [ga('pagePath')], metrics: [ga('screenPageViews'), ga('activeUsers')], dateRanges, orderBys: [desc('screenPageViews')], limit: 8 },
    { dimensions: [ga('sessionDefaultChannelGroup')], metrics: [ga('sessions')], dateRanges, orderBys: [desc('sessions')], limit: 6 },
    { dimensions: [ga('deviceCategory')], metrics: [ga('sessions')], dateRanges, orderBys: [desc('sessions')], limit: 4 },
    { dimensions: [ga('city')], metrics: [ga('activeUsers')], dateRanges, orderBys: [desc('activeUsers')], limit: 6 },
  ]);

  // GA hands back `20260919`; the console's buckets are keyed `2026-09-19`, or
  // `2026-09` once a range is long enough to be charted by month.
  const buckets = bucketsOf(range);
  const at = new Map(buckets.map((b, i) => [b.key, i]));
  const visitors = buckets.map(() => 0);
  const views = buckets.map(() => 0);

  for (const row of overTime.rows) {
    const d = row.keys[0] || '';
    if (d.length !== 8) continue;
    const key = `${d.slice(0, 4)}-${d.slice(4, 6)}${range.bucket === 'day' ? `-${d.slice(6, 8)}` : ''}`;
    const i = at.get(key);
    if (i === undefined) continue;
    visitors[i] += row.values[0];
    views[i] += row.values[3];
  }

  const t = overTime.totals;
  const sessions = t[2] || 0;
  const named = (rows: GaTable['rows'], fallback: string) =>
    rows.map((r) => ({ name: r.keys[0] || fallback, value: r.values[0] }));

  return {
    configured: true,
    totals: {
      visitors: t[0] || 0,
      newVisitors: t[1] || 0,
      sessions,
      pageViews: t[3] || 0,
      avgEngagement: sessions ? Math.round((t[4] || 0) / sessions) : 0,
    },
    visitorsSeries: buckets.map((b, i) => ({ date: b.key, label: b.label, value: visitors[i] })),
    pageViewsSeries: buckets.map((b, i) => ({ date: b.key, label: b.label, value: views[i] })),
    pages: pages.rows.map((r) => ({ path: r.keys[0] || '/', views: r.values[0], visitors: r.values[1] })),
    channels: named(channels.rows, 'Direct'),
    devices: named(devices.rows, 'Unknown'),
    // GA reports "(not set)" when a visitor's city can't be resolved.
    cities: named(cities.rows, 'Unknown').filter((c) => c.name !== '(not set)'),
  };
}
