import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FamGateway client — UPI collection through a FamPay account.
 *
 * What this gateway is, because it shapes everything below:
 *
 *  - Non-custodial. Money goes straight into the FamPay UPI wallet that owns
 *    the API key; FamGateway never holds it. There is no refund API and no
 *    settlement report — a refund is a manual UPI transfer back.
 *  - Confirmation comes from FamGateway reading that account's payment
 *    notifications, not from a bank callback. A payment is only real once
 *    `verify-order` says so, and the webhook is treated as a prompt to go and
 *    ask rather than as proof.
 *  - A payment session lasts five minutes. There is no sandbox: the only test
 *    is a live ₹1 payment (see scripts/famgateway-selftest.ts).
 *
 * The key travels in the `X-Api-Key` header, never the `?api_key=` query
 * string the older examples use — a key in a URL ends up in access logs.
 *
 * Docs: https://famgateway.in/docs.php
 */

const TIMEOUT_MS = 15_000;
const IST_OFFSET_MS = 330 * 60 * 1000;

export class PaymentGatewayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export interface GatewayOrder {
  gatewayOrderId: string;
  checkoutUrl: string;
  qrUrl: string | null;
  upiIntent: string | null;
  payableAmount: number;
  /** ISO timestamp, converted from the gateway's IST string. */
  expiresAt: string | null;
}

export type GatewayStatus =
  | { status: 'success'; transactionId: string | null; utr: string | null; amount: number; senderName: string | null }
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'unknown'; detail: string };

const config = () => ({
  key: (process.env.FAMGATEWAY_API_KEY || '').trim(),
  base: (process.env.FAMGATEWAY_BASE_URL || 'https://famgateway.in').replace(/\/+$/, ''),
});

export const famGatewayConfigured = () => !!config().key;

/** `02-09-2026 14:35:00` in IST → an ISO timestamp, or null if unparseable. */
export function parseIst(v: unknown): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v ?? '').trim());
  if (!m) return null;
  const [, d, mo, y, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)) - IST_OFFSET_MS).toISOString();
}

async function call(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<any> {
  const { key, base } = config();
  if (!key) throw new PaymentGatewayError('Online payments are not configured.');

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method,
      headers: {
        'X-Api-Key': key,
        Accept: 'application/json',
        // The gateway sits behind Cloudflare, which turns away requests with no user agent.
        'User-Agent': 'Loopy/1.0',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e: any) {
    throw new PaymentGatewayError(
      e?.name === 'TimeoutError' ? 'The payment gateway did not respond in time.' : 'Could not reach the payment gateway.',
    );
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // An HTML error page from the edge — the status code is all there is.
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || json?.status;
    throw new PaymentGatewayError(
      `Payment gateway error (${res.status})${msg ? `: ${String(msg).slice(0, 160)}` : ''}`,
      res.status,
    );
  }
  return json;
}

export async function createGatewayOrder(input: {
  amount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  redirectUrl?: string | null;
  webhookUrl?: string | null;
}): Promise<GatewayOrder> {
  // The gateway wants a bare 10-digit mobile number; anything else is dropped
  // rather than sent, since it is optional and a malformed one fails the order.
  const phone = String(input.customerPhone || '').replace(/\D/g, '').slice(-10);
  const body: Record<string, unknown> = { amount: Math.round(input.amount * 100) / 100 };
  if (input.customerName) body.customer_name = String(input.customerName).slice(0, 80);
  if (phone.length === 10) body.customer_phone = phone;
  if (input.redirectUrl) body.redirect_url = input.redirectUrl;
  if (input.webhookUrl) body.webhook_url = input.webhookUrl;

  const json = await call('/api/create-order', { method: 'POST', body });
  const d = json?.data;
  if (json?.status !== 'success' || !d?.order_id || !d?.checkout_url) {
    throw new PaymentGatewayError(
      `The payment gateway did not create the order${json?.message ? `: ${String(json.message).slice(0, 160)}` : ''}.`,
    );
  }
  return {
    gatewayOrderId: String(d.order_id),
    checkoutUrl: String(d.checkout_url),
    qrUrl: d.qr_url ? String(d.qr_url) : null,
    upiIntent: d.upi_intent ? String(d.upi_intent) : null,
    payableAmount: Number(d.payable_amount ?? d.amount ?? input.amount),
    expiresAt: parseIst(d.expires_at_ist),
  };
}

export async function verifyGatewayOrder(gatewayOrderId: string): Promise<GatewayStatus> {
  let json: any;
  try {
    json = await call(`/api/verify-order.php?order_id=${encodeURIComponent(gatewayOrderId)}`, { method: 'GET' });
  } catch (e) {
    // 408 is how the gateway reports a session that ran out of time.
    if (e instanceof PaymentGatewayError && e.status === 408) return { status: 'expired' };
    throw e;
  }

  const status = String(json?.status || '').toLowerCase();
  if (status === 'success' && json?.data) {
    const d = json.data;
    // A confirmation for some other order is not a confirmation for this one.
    if (d.order_id && String(d.order_id) !== gatewayOrderId) {
      return { status: 'unknown', detail: 'order id mismatch' };
    }
    return {
      status: 'success',
      transactionId: d.transaction_id ? String(d.transaction_id) : null,
      utr: d.utr ? String(d.utr) : null,
      amount: Number(d.amount),
      senderName: d.sender_name ? String(d.sender_name) : null,
    };
  }
  if (status === 'pending') return { status: 'pending' };
  if (status === 'expired') return { status: 'expired' };
  return { status: 'unknown', detail: status || 'no status' };
}

/**
 * Check a webhook's `X-FamGateway-Signature`: HMAC-SHA256 of the raw request
 * body, keyed with the API key, as hex.
 *
 * Length is compared first because `timingSafeEqual` throws on buffers of
 * different lengths. The gateway's own example skips that, which turns a
 * malformed header into a 500 instead of a 401.
 */
export function validWebhookSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  const { key } = config();
  if (!key || !rawBody || !signature) return false;
  const expected = createHmac('sha256', key).update(rawBody).digest('hex');
  const given = signature.trim().toLowerCase().replace(/^sha256=/, '');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
