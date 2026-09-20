/**
 * Every move an order makes, as a record an admin can be notified about.
 *
 * Orders carry a `status` and nothing else: no `updatedAt`, no per-stage
 * timestamps. So the row tells you an order is Shipped but not when it
 * shipped, or that it was ever Accepted — which is enough to render a list and
 * not enough to tell anyone something happened.
 *
 * Each change is therefore written to `AuditLog`, the same way funds releases
 * and support messages are. That needs no migration on a live shop, keeps
 * "what changed, when, and who did it" as one record, and gives the admin
 * console a real event stream to read instead of polling for differences.
 *
 * Admin-initiated changes are already logged by AdminService.orderAction under
 * `order.<action>`; this covers the seller's and the system's, and the reader
 * below takes both.
 */

export const ORDER_STATUS = 'order.status';

/** Just enough of a Prisma client to use — works with a transaction client too. */
type Db = {
  auditLog: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
};

export interface Actor {
  id?: string | null;
  email?: string | null;
}

/**
 * Note that an order moved from one status to another.
 *
 * Never throws: an order that has genuinely been shipped must not fail to save
 * because we could not write a note about it. A missing entry costs a
 * notification; a failed transition costs the seller a sale.
 */
export async function recordStatusChange(
  db: Db,
  order: { id: string; status?: string; totalAmount?: number | null },
  from: string,
  to: string,
  actor: Actor = {},
): Promise<void> {
  if (!from || !to || from === to) return;
  try {
    await db.auditLog.create({
      data: {
        actorId: String(actor.id || 'system'),
        actorEmail: actor.email || null,
        action: ORDER_STATUS,
        entity: 'order',
        entityId: order.id,
        before: JSON.stringify({ status: from }),
        after: JSON.stringify({ status: to }),
        amount: order.totalAmount ?? null,
      },
    });
  } catch {
    /* the transition is what matters */
  }
}

export interface StatusChange {
  orderId: string;
  from: string;
  to: string;
  amount: number | null;
  by: string | null;
  at: Date;
}

const statusIn = (json: string | null): string => {
  try {
    return String(JSON.parse(json || '{}')?.status || '');
  } catch {
    return '';
  }
};

/**
 * Status changes since a point in time, newest first.
 *
 * Reads our own entries and the admin console's `order.*` ones together, since
 * to whoever is reading the bell they are the same kind of event. Rows whose
 * before/after don't name a status — a refund state change, a funds release —
 * are skipped rather than reported as a move that never happened.
 */
export async function statusChangesSince(db: Db, since: Date, take = 60): Promise<StatusChange[]> {
  const rows = await db.auditLog.findMany({
    where: {
      entity: 'order',
      createdAt: { gte: since },
      OR: [{ action: ORDER_STATUS }, { action: { startsWith: 'order.' } }],
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: { entityId: true, before: true, after: true, amount: true, actorEmail: true, actorId: true, createdAt: true },
  });

  const out: StatusChange[] = [];
  for (const r of rows) {
    const from = statusIn(r.before);
    const to = statusIn(r.after);
    if (!to || from === to) continue;
    out.push({
      orderId: r.entityId,
      from,
      to,
      amount: r.amount ?? null,
      by: r.actorEmail || (r.actorId === 'system' ? null : r.actorId) || null,
      at: r.createdAt,
    });
  }
  return out;
}
