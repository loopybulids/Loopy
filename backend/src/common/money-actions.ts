import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * Guard rails for the handful of operations that move money.
 *
 * Before this, `orderAction` was a read-then-write with no protection at all:
 * two clicks on "Refund" performed the refund twice, an operator working from
 * a screen loaded ten minutes ago could overwrite a decision someone else had
 * already made, and any status could jump to any other — a Cancelled order
 * could be marked Delivered, releasing money for goods that were never sent.
 *
 * Three things fix that, and all three are required together:
 *
 *   1. A legal-transition map, so an action that makes no sense from the
 *      order's current state is refused rather than applied.
 *   2. An optimistic lock, so a write built on a stale read fails loudly.
 *   3. An idempotency key, so an honest retry returns the original result
 *      instead of performing the action again.
 */

/**
 * Which statuses each admin action may be applied from.
 *
 * Deliberately narrow: an action missing from this map, or attempted from a
 * status not listed, is refused. Terminal states (Refunded, Completed) appear
 * in no `from` list, so nothing can move an order out of them.
 */
export const ORDER_TRANSITIONS: Record<string, { to: string; from: string[]; label: string }> = {
  accept:  { to: 'Accepted',  from: ['Paid'], label: 'Accept order' },
  ship:    { to: 'Shipped',   from: ['Paid', 'Accepted'], label: 'Mark shipped' },
  deliver: { to: 'Delivered', from: ['Shipped'], label: 'Verify delivery and release funds' },
  cancel:  { to: 'Cancelled', from: ['PendingPayment', 'Paid', 'Accepted', 'Shipped'], label: 'Cancel order' },
  refund:  { to: 'Refunded',  from: ['Cancelled', 'Disputed', 'Delivered', 'Completed'], label: 'Refund customer' },
};

/** Actions that move money, and so require an explicit confirmation trail. */
export const MONEY_ACTIONS = new Set(['deliver', 'refund']);

/**
 * Refund lifecycle. Separate from `Order.status` because "we owe this customer
 * a refund" and "the money has actually gone back" are different facts, and
 * collapsing them into one field is how a refund gets marked done before it
 * has been paid.
 */
export const REFUND_STATES = ['Required', 'Initiated', 'Refunded', 'Failed'] as const;
export type RefundState = (typeof REFUND_STATES)[number];

const REFUND_NEXT: Record<string, RefundState[]> = {
  none: ['Required'],
  Required: ['Initiated'],
  Initiated: ['Refunded', 'Failed'],
  Failed: ['Initiated'],
  Refunded: [],
};

/** Whether a refund may move to `to` from its current state. */
export function canRefundMoveTo(current: string | null | undefined, to: string) {
  return (REFUND_NEXT[current || 'none'] || []).includes(to as RefundState);
}

/**
 * Reject a write whose caller read an older version of the row.
 *
 * `count` is what Prisma's `updateMany` reports: 0 means the `where` clause
 * matched nothing, which — since the id certainly exists — means the version
 * moved under us.
 */
export function assertNotStale(count: number, what = 'This record') {
  if (count === 0) {
    throw new ConflictException(
      `${what} changed since you loaded it. Refresh and check the current state before trying again — the action was NOT applied.`,
    );
  }
}

/** An action must say which version of the row it was decided against. */
export function requireVersion(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) {
    throw new BadRequestException('expectedVersion is required for this action.');
  }
  return n;
}
