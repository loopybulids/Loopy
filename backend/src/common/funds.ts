/**
 * Whether an order's money has been released to its seller.
 *
 * Delivery and release are two different decisions. Marking an order delivered
 * is the seller saying the goods arrived; releasing the money is Loopy saying
 * the seller may withdraw it. Before this they were the same event, so a seller
 * could mark their own order delivered and the funds became withdrawable
 * immediately — with no window in which a complaint could be raised, and
 * nothing for an operator to check.
 *
 * The state lives in `AuditLog` rather than in a column on Order. That keeps
 * "who released this, and when" and "is it released" as one record instead of
 * two that can disagree, and it needs no migration — which matters for a
 * running shop. The current state of an order is simply its latest funds
 * entry: released if that entry is a release, held if it is a hold or if there
 * is none at all.
 */

export const FUNDS_RELEASE = 'funds.release';
export const FUNDS_HOLD = 'funds.hold';

/** Just enough of a Prisma client to read the log — works with a transaction client too. */
type LogReader = {
  auditLog: { findMany: (args: any) => Promise<any[]> };
};

/**
 * Which of these orders currently have their money released.
 *
 * One query for the whole set, ordered oldest first so the last entry seen for
 * an order wins — a release that was later held is not released.
 */
export async function releasedOrderIds(db: LogReader, orderIds: string[]): Promise<Set<string>> {
  if (!orderIds.length) return new Set();

  const rows = await db.auditLog.findMany({
    where: { entity: 'order', entityId: { in: orderIds }, action: { in: [FUNDS_RELEASE, FUNDS_HOLD] } },
    orderBy: { createdAt: 'asc' },
    select: { entityId: true, action: true },
  });

  const released = new Set<string>();
  for (const r of rows) {
    if (r.action === FUNDS_RELEASE) released.add(r.entityId);
    else released.delete(r.entityId);
  }
  return released;
}

/** The latest release/hold decision on one order, or null if it was never touched. */
export async function fundsDecision(
  db: LogReader,
  orderId: string,
): Promise<{ released: boolean; at: Date; by: string | null } | null> {
  const [latest] = await db.auditLog.findMany({
    where: { entity: 'order', entityId: orderId, action: { in: [FUNDS_RELEASE, FUNDS_HOLD] } },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { action: true, createdAt: true, actorEmail: true, actorId: true },
  });
  if (!latest) return null;
  return {
    released: latest.action === FUNDS_RELEASE,
    at: latest.createdAt,
    by: latest.actorEmail || latest.actorId || null,
  };
}
