/**
 * Close checkouts that were never paid for.
 *
 *   npx ts-node --transpile-only scripts/sweep-abandoned.ts           dry run
 *   npx ts-node --transpile-only scripts/sweep-abandoned.ts --apply   close them
 *
 * A payment session lasts five minutes. Anything still at PendingPayment long
 * after that is an abandoned basket, and it sits in the orders list forever
 * because the automatic sweep only runs when somebody tries to buy the same
 * product again.
 *
 * Every candidate is checked with FamGateway first, because a UPI payment
 * cannot be recalled once the buyer has the details: an order that looks
 * abandoned may have been paid late, and that one is reported rather than
 * cancelled — settle it from the admin order page instead, so the money is
 * recorded against it.
 *
 * Coupon redemptions are rolled back. Stock is not touched: online orders no
 * longer reserve it. Orders created before that change did reserve stock, and
 * those are flagged so the counts can be corrected by hand.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { verifyGatewayOrder } from '../src/payments/famgateway';

/** Well past the gateway's five-minute window. */
const ABANDON_AFTER_MIN = 30;
/** Online orders stopped reserving stock on this date. */
const STOCK_RESERVED_BEFORE = new Date('2026-09-18T00:00:00+05:30');

const apply = process.argv.includes('--apply');

(async () => {
  const prisma = new PrismaClient();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MIN * 60_000);

  const orders = await prisma.order.findMany({
    where: { status: 'PendingPayment', createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    include: { items: { select: { productId: true, title: true, quantity: true } } },
  });

  if (!orders.length) {
    console.log('Nothing to sweep — no unpaid checkouts older than 30 minutes.');
    await prisma.$disconnect();
    return;
  }

  console.log(`${orders.length} unpaid checkout(s) older than ${ABANDON_AFTER_MIN} minutes\n`);
  let closed = 0;
  let paid = 0;

  for (const o of orders) {
    const ref = `#${o.id.slice(-6).toUpperCase()}`;
    const age = Math.round((Date.now() - o.createdAt.getTime()) / 60_000);

    let status = 'no gateway session';
    if (o.razorpayOrderId && !o.razorpayOrderId.startsWith('order_stub_')) {
      try {
        status = (await verifyGatewayOrder(o.razorpayOrderId)).status;
      } catch (e: any) {
        console.log(`${ref}  ₹${o.totalAmount}  could not be checked: ${e?.message}`);
        continue;
      }
    }

    if (status === 'success') {
      paid++;
      console.log(`${ref}  ₹${o.totalAmount}  PAID — leave it; settle it from the admin order page`);
      continue;
    }

    const reserved = o.createdAt < STOCK_RESERVED_BEFORE;
    console.log(
      `${ref}  ₹${o.totalAmount}  ${age} min old  gateway says "${status}"` +
        (reserved ? `  ⚠ may hold stock: ${o.items.map((i) => `${i.title} ×${i.quantity}`).join(', ')}` : ''),
    );

    if (apply) {
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.order.updateMany({
          where: { id: o.id, status: 'PendingPayment' },
          data: {
            status: 'Cancelled',
            cancelledBy: 'system',
            cancelReason: 'Payment was not completed in time.',
            version: { increment: 1 },
          },
        });
        if (count === 0) return; // paid or cancelled while we were looking

        const redemption = await tx.couponRedemption.findFirst({ where: { orderId: o.id } });
        if (redemption) {
          await tx.couponRedemption.delete({ where: { id: redemption.id } });
          await tx.coupon.updateMany({ where: { id: redemption.couponId }, data: { usedCount: { decrement: 1 } } });
        }
      });
      closed++;
    }
  }

  console.log(
    `\n${apply ? `Closed ${closed}` : `Would close ${orders.length - paid}`} checkout(s)` +
      (paid ? `, left ${paid} that were actually paid` : '') +
      (apply ? '' : '\nRun again with --apply to close them.'),
  );

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
