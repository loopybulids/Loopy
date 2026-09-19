import { randomBytes } from 'crypto';

/**
 * Messages people send us: the public contact form, and sellers reporting
 * problems with the platform.
 *
 * They are kept as `AuditLog` rows rather than in a table of their own. That
 * is a deliberate trade, not an accident of laziness: the log already has the
 * shape this needs — an actor, an action, a subject and a timestamp, in
 * insertion order — and adding a model would mean a schema migration and a
 * regenerated Prisma client before the feature could run at all. Low volume,
 * append-only, and read through the helpers below, so the storage choice stays
 * in this file.
 *
 * State works the same way as funds release (common/funds): a message is
 * resolved if its most recent decision row says so.
 */

export const SUPPORT_ENTITY = 'support';
export const SUPPORT_CONTACT = 'support.contact';
export const SUPPORT_SELLER = 'support.seller';
export const SUPPORT_RESOLVED = 'support.resolved';
export const SUPPORT_REOPENED = 'support.reopened';

export const SUPPORT_ACTIONS = [SUPPORT_CONTACT, SUPPORT_SELLER, SUPPORT_RESOLVED, SUPPORT_REOPENED];

/** What a seller can be reporting. Mirrored by the form's options. */
export const SELLER_TOPICS = ['Bug', 'Payments', 'Orders', 'Store or products', 'Feature request', 'Something else'] as const;
export type SellerTopic = (typeof SELLER_TOPICS)[number];

export type SupportKind = 'contact' | 'seller';

export interface SupportMessage {
  id: string;
  kind: SupportKind;
  subject: string;
  message: string;
  /** Who wrote it — a visitor's typed name, or the seller's store. */
  from: string;
  email: string | null;
  topic: string | null;
  sellerId: string | null;
  at: Date;
  resolved: boolean;
  decidedBy: string | null;
  decidedAt: Date | null;
}

type LogClient = {
  auditLog: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
  };
};

/** Short, sortable, and readable when an operator has to quote it. */
export function newSupportId(): string {
  return `msg_${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
}

function parse(v: unknown): Record<string, any> {
  try {
    const o = JSON.parse(String(v || '{}'));
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

/**
 * Every message, newest first, with its current state folded in.
 *
 * One query: the submissions and the decisions live in the same table, so they
 * are read together and matched up here rather than in two round trips.
 */
export async function listSupport(
  db: LogClient,
  opts: { from?: Date; to?: Date; take?: number } = {},
): Promise<SupportMessage[]> {
  const rows = await db.auditLog.findMany({
    where: {
      entity: SUPPORT_ENTITY,
      action: { in: SUPPORT_ACTIONS },
      ...(opts.from || opts.to ? { createdAt: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lt: opts.to } : {}) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { action: true, entityId: true, actorId: true, actorEmail: true, after: true, createdAt: true },
  });

  const byId = new Map<string, SupportMessage>();

  for (const r of rows) {
    if (r.action === SUPPORT_CONTACT || r.action === SUPPORT_SELLER) {
      const d = parse(r.after);
      byId.set(r.entityId, {
        id: r.entityId,
        kind: r.action === SUPPORT_SELLER ? 'seller' : 'contact',
        subject: String(d.subject || '(no subject)'),
        message: String(d.message || ''),
        from: String(d.from || d.name || 'Someone'),
        email: d.email ? String(d.email) : null,
        topic: d.topic ? String(d.topic) : null,
        sellerId: d.sellerId ? String(d.sellerId) : null,
        at: r.createdAt,
        resolved: false,
        decidedBy: null,
        decidedAt: null,
      });
      continue;
    }

    // A decision on a message we can see; ignore one whose message has aged
    // out of the window being read.
    const msg = byId.get(r.entityId);
    if (!msg) continue;
    msg.resolved = r.action === SUPPORT_RESOLVED;
    msg.decidedBy = r.actorEmail || r.actorId || null;
    msg.decidedAt = r.createdAt;
  }

  const all = [...byId.values()].sort((a, b) => +b.at - +a.at);
  return opts.take ? all.slice(0, opts.take) : all;
}

/** Record a new message. Returns its id. */
export async function writeSupport(
  db: LogClient,
  kind: SupportKind,
  payload: { subject: string; message: string; from: string; email?: string | null; topic?: string | null; sellerId?: string | null },
  actor: { id: string; email?: string | null },
): Promise<string> {
  const id = newSupportId();
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email || null,
      action: kind === 'seller' ? SUPPORT_SELLER : SUPPORT_CONTACT,
      entity: SUPPORT_ENTITY,
      entityId: id,
      after: JSON.stringify(payload),
    },
  });
  return id;
}
