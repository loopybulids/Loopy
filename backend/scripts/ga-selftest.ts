/**
 * Check that the Google Analytics credentials actually work.
 *
 *   npx ts-node --transpile-only scripts/ga-selftest.ts
 *
 * Reads GA_PROPERTY_ID and GA_SERVICE_ACCOUNT_JSON from .env and pulls the
 * last 30 days. Run this before putting the variables on the host: the three
 * ways this goes wrong — the measurement id used as the property id, a service
 * account that was never granted Viewer, a key file that lost its newlines —
 * all fail the same way in a browser, as an empty card.
 */
import 'dotenv/config';
import { fetchTraffic, gaConfigured } from '../src/common/ga';
import { parseRange } from '../src/common/date-range';

(async () => {
  if (!process.env.GA_PROPERTY_ID || !process.env.GA_SERVICE_ACCOUNT_JSON) {
    console.log('Not configured — set GA_PROPERTY_ID and GA_SERVICE_ACCOUNT_JSON in backend/.env.');
    console.log('See the Google Analytics block in .env.example for where each one comes from.');
    process.exit(1);
  }
  if (!gaConfigured()) process.exit(1);

  const range = parseRange(undefined, undefined, { defaultDays: 30 });
  console.log(`Property ${process.env.GA_PROPERTY_ID}, ${range.fromKey} → ${range.toKey}\n`);

  const t = await fetchTraffic(range);
  console.log(`visitors    ${t.totals.visitors}  (${t.totals.newVisitors} new)`);
  console.log(`sessions    ${t.totals.sessions}`);
  console.log(`page views  ${t.totals.pageViews}`);
  console.log(`engagement  ${t.totals.avgEngagement}s per session\n`);

  if (t.pages.length) {
    console.log('Most visited:');
    t.pages.forEach((p) => console.log(`  ${p.views.toString().padStart(6)}  ${p.path}`));
  } else {
    console.log('No page views in this period yet — the credentials work, Google just has nothing to report.');
  }

  console.log('\nOK — the admin console can read this property.');
})().catch((e) => {
  console.error(`\nFAILED: ${e.message}`);
  process.exit(1);
});
