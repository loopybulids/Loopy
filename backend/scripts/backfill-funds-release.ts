/**
 * Grandfather orders that were delivered before funds needed releasing.
 *
 *   npx ts-node --transpile-only scripts/backfill-funds-release.ts           dry run
 *   npx ts-node --transpile-only scripts/backfill-funds-release.ts --apply   write it
 *
 * Until release gating landed, delivery made a seller's money withdrawable by
 * itself — which is how the existing payouts came to be requested, approved
 * and in one case rejected. Under the new rules withdrawable money is money an
 * admin released, and none of those older orders carry a release, so every
 * seller's Available reads ₹0 and a rejected payout appears to vanish instead
 * of returning.
 *
 * This writes one `funds.release` audit entry per already-delivered order that
 * has no funds decision yet, attributed to `backfill` so the trail says plainly
 * that no operator pressed a button. It touches nothing else: no orders, no
 * payouts, no balances are written — the balances are derived from these
 * entries (see common/funds).
 *
 * Orders delivered from now on are unaffected and still need an explicit
 * release in the admin console.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { FUNDS_HOLD, FUNDS_RELEASE } from '../src/common/funds';

const DELIVERED = ['Delivered', 'Completed'];
const apply = process.argv.includes('--apply');
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const receivable = (o: { itemsAmount: number; discountAmount: number | null; shippingCharge: number }) =>
  Math.max(0, o.itemsAmount - (o.discountAmount || 0)) + o.shippingCharge;

(async () => {
  const prisma = new PrismaClient();

  const sellers = await prisma.seller.findMany({ select: { id: true, storeName: true, username: true } });
  let totalOrders = 0;
  let totalAmount = 0;

  for (const s of sellers) {
    const orders = await prisma.order.findMany({
      where: { sellerId: s.id, status: { in: DELIVERED } },
      select: { id: true, itemsAmount: true, discountAmount: true, shippingCharge: true, createdAt: true },
    });
    if (!orders.length) continue;

    // Anything already decided — released or explicitly held — is left alone.
    const decided = new Set(
      (await prisma.auditLog.findMany({
        where: { entity: 'order', entityId: { in: orders.map((o) => o.id) }, action: { in: [FUNDS_RELEASE, FUNDS_HOLD] } },
        select: { entityId: true },
      })).map((r) => r.entityId),
    );

    const todo = orders.filter((o) => !decided.has(o.id));
    if (!todo.length) continue;

    const amount = todo.reduce((t, o) => t + receivable(o), 0);
    totalOrders += todo.length;
    totalAmount += amount;
    console.log(`${s.storeName} (@${s.username}): ${todo.length} order(s), ${money(amount)}`);

    if (apply) {
      await prisma.auditLog.createMany({
        data: todo.map((o) => ({
          actorId: 'backfill',
          actorEmail: null,
          action: FUNDS_RELEASE,
          entity: 'order',
          entityId: o.id,
          before: JSON.stringify({ released: false }),
          after: JSON.stringify({ released: true, reason: 'delivered before release gating' }),
          amount: receivable(o),
        })),
      });
    }
  }

  console.log(
    totalOrders
      ? `\n${apply ? 'Released' : 'Would release'} ${totalOrders} order(s), ${money(totalAmount)} in total.` +
        (apply ? '' : '\nRun again with --apply to write it.')
      : '\nNothing to do — every delivered order already has a funds decision.',
  );

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
