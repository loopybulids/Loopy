/**
 * FamGateway integration self-test.
 *
 *   npx ts-node --transpile-only scripts/famgateway-selftest.ts          offline checks
 *   npx ts-node --transpile-only scripts/famgateway-selftest.ts --live   + a real ₹1 order
 *
 * Offline: webhook signature verification and IST timestamp parsing, with a
 * throwaway key and no network.
 *
 * Live: uses FAMGATEWAY_API_KEY from backend/.env to create a ₹1 order and
 * check its status. No money moves unless you open the printed link and pay;
 * the session expires by itself after five minutes. It also prints the UPI ID
 * the gateway will pay out to — check that it is the account you expect.
 */
import 'dotenv/config';
import { createHmac } from 'crypto';
import { createGatewayOrder, parseIst, validWebhookSignature, verifyGatewayOrder } from '../src/payments/famgateway';

let failures = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
};

function offline() {
  const realKey = process.env.FAMGATEWAY_API_KEY;
  const testKey = 'selftest_key_not_real';
  process.env.FAMGATEWAY_API_KEY = testKey;

  const body = Buffer.from(JSON.stringify({ event: 'payment.success', order_id: 'fg_TEST1234', amount: 1 }));
  const good = createHmac('sha256', testKey).update(body).digest('hex');

  check('valid signature is accepted', validWebhookSignature(body, good));
  check('uppercase hex signature is accepted', validWebhookSignature(body, good.toUpperCase()));
  check('tampered body is rejected', !validWebhookSignature(Buffer.from(body.toString().replace('"amount":1', '"amount":9999')), good));
  check('signature made with another key is rejected', !validWebhookSignature(body, createHmac('sha256', 'other').update(body).digest('hex')));
  check('malformed short signature is rejected, not thrown', !validWebhookSignature(body, 'abc'));
  check('missing signature is rejected', !validWebhookSignature(body, undefined));
  check('missing body is rejected', !validWebhookSignature(undefined, good));
  check('IST expiry converts to UTC', parseIst('02-09-2026 14:35:00') === '2026-09-02T09:05:00.000Z');
  check('unparseable timestamp gives null', parseIst('soon') === null);

  process.env.FAMGATEWAY_API_KEY = realKey;
}

async function live() {
  if (!process.env.FAMGATEWAY_API_KEY) {
    check('FAMGATEWAY_API_KEY is set in backend/.env', false);
    return;
  }
  console.log('\nLive: creating a ₹1 order…');
  const o = await createGatewayOrder({ amount: 1, customerName: 'Loopy self-test' });
  check('gateway accepted the key and created an order', !!o.gatewayOrderId && !!o.checkoutUrl);
  const payee = o.upiIntent ? decodeURIComponent((/[?&]pa=([^&]+)/.exec(o.upiIntent) || [])[1] || '') : '';
  console.log(`      order    ${o.gatewayOrderId}`);
  console.log(`      pay at   ${o.checkoutUrl}`);
  console.log(`      pays to  ${payee || '—'}   <- the UPI ID buyers' money goes to`);
  console.log(`      expires  ${o.expiresAt || '—'}`);

  const s = await verifyGatewayOrder(o.gatewayOrderId);
  check(`status check works (gateway says "${s.status}")`, ['pending', 'success', 'expired'].includes(s.status));
}

(async () => {
  offline();
  if (process.argv.includes('--live')) {
    await live().catch((e) => check(`live test: ${e?.message || e}`, false));
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})();
