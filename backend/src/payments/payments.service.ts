import {
  BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { orderReceiptEmail, sendMail } from '../mail/mailer';
import {
  createGatewayOrder, famGatewayConfigured, GatewayStatus, PaymentGatewayError,
  validWebhookSignature, verifyGatewayOrder,
} from './famgateway';

/** An unpaid order older than this is closed, and its coupon use given back. */
const ABANDON_AFTER_MS = 30 * 60 * 1000;

export type SettleStatus = 'paid' | 'pending' | 'expired' | 'mismatch' | 'late' | 'cancelled' | 'unpaid' | 'oversold';

/**
 * Taking a buyer's money for an order.
 *
 * The order is created first, as PendingPayment. It holds a coupon use, but no
 * stock: nothing leaves the catalogue until the money is confirmed. A
 * FamGateway session is then opened for the order total and the buyer pays on
 * the gateway's hosted UPI page. Only `settle()` can make the order Paid, and
 * only once FamGateway itself confirms the money arrived — whichever way that
 * news reaches us first, the buyer coming back from checkout or the gateway's
 * webhook. Taking the stock is part of the same step.
 *
 * The gateway's order id is kept in `Order.razorpayOrderId`. That column was
 * always "the payment provider's order id"; only the provider changed, and
 * reusing it avoids a migration.
 */
@Injectable()
export class PaymentsService {
  private readonly log = new Logger('Payments');

  constructor(private prisma: PrismaService) {}

  get enabled(): boolean {
    return famGatewayConfigured();
  }

  /** Same rule as OrdersService: the buyer, the seller, or an admin. */
  private assertAccess(order: { sellerId: string; customerId: string | null; buyerId: string | null }, user: any) {
    if (!user) throw new ForbiddenException('Sign in to continue');
    if (user.role === 'admin') return;
    if (user.role === 'seller' && user.sellerId && order.sellerId === user.sellerId) return;
    if (user.role === 'customer' && order.customerId && order.customerId === user.userId) return;
    if (user.role === 'buyer' && order.buyerId && order.buyerId === user.userId) return;
    throw new ForbiddenException('Not your order');
  }

  /** Only a public HTTPS API can receive webhooks; on localhost the buyer's return does the work. */
  private webhookUrl(): string | null {
    const base = (process.env.PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    return /^https:\/\//i.test(base) ? `${base}/payments/famgateway/webhook` : null;
  }

  /** The page to send the buyer back to, tagged with the order so it can be verified there. */
  private returnUrlFor(base: unknown, orderId: string): string | null {
    try {
      const u = new URL(String(base || ''));
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      u.searchParams.set('paid', orderId);
      return u.toString();
    } catch {
      return null;
    }
  }

  private reload(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { items: true } });
  }

  private audit(entityId: string, action: string, after: Record<string, unknown>, entity = 'order') {
    return this.prisma.auditLog
      .create({ data: { actorId: 'famgateway', actorEmail: null, action, entity, entityId, after: JSON.stringify(after) } })
      .catch(() => undefined);
  }

  /** Open (or re-open) a payment session for an unpaid order. */
  async startPayment(orderId: string, user: any, returnUrl?: string) {
    if (!this.enabled) throw new ServiceUnavailableException('Online payments are not set up yet.');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    this.assertAccess(order, user);
    if (order.status !== 'PendingPayment') {
      throw new BadRequestException(
        order.status === 'Cancelled' ? 'This order was cancelled — please place it again.' : 'This order has already been paid.',
      );
    }

    const customer = order.customerId
      ? await this.prisma.customer.findUnique({ where: { id: order.customerId }, select: { name: true, phone: true } })
      : null;

    let session;
    try {
      session = await createGatewayOrder({
        amount: order.totalAmount,
        customerName: customer?.name || order.buyerName,
        customerPhone: customer?.phone || order.buyerPhone,
        redirectUrl: this.returnUrlFor(returnUrl, order.id),
        webhookUrl: this.webhookUrl(),
      });
    } catch (e) {
      this.log.warn(`Could not open a payment for order ${order.id}: ${(e as Error)?.message}`);
      throw new ServiceUnavailableException(e instanceof PaymentGatewayError ? e.message : 'Could not start the payment.');
    }

    await this.prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: session.gatewayOrderId } });
    return { orderId: order.id, amount: order.totalAmount, ...session };
  }

  /**
   * Find out whether an order has been paid, and record it if it has.
   *
   * Always asks the gateway. Neither the buyer's return — anyone can type
   * `?paid=` into an address bar — nor a signed webhook is taken as proof on
   * its own: the webhook is signed with the same key we use to ask, so asking
   * costs nothing and removes a whole class of forged-callback bugs.
   *
   * Safe to call any number of times. The write is conditional on the order
   * still being unpaid, so a webhook and a returning buyer racing each other
   * record the payment once.
   */
  async settle(orderId: string, opts: { user?: any; source: 'return' | 'webhook' | 'sweep' }): Promise<{ status: SettleStatus; order: any }> {
    const order = await this.reload(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (opts.user) this.assertAccess(order, opts.user);

    // We gave up on it, but a UPI payment cannot be recalled once the buyer has
    // the details — so an order we timed out is still worth asking about.
    const timedOut = order.status === 'Cancelled' && order.cancelledBy === 'system' && !order.refundState;
    if (order.status !== 'PendingPayment' && !timedOut) {
      return { status: order.status === 'Cancelled' ? 'cancelled' : 'paid', order };
    }

    const stale = Date.now() - order.createdAt.getTime() > ABANDON_AFTER_MS;
    const gatewayId = order.razorpayOrderId;

    if (!gatewayId || gatewayId.startsWith('order_stub_')) {
      // Never reached the gateway: the session failed to open and nobody retried.
      if (opts.source === 'sweep' && stale && !timedOut) {
        await this.release(order);
        return { status: 'cancelled', order: await this.reload(order.id) };
      }
      return { status: timedOut ? 'cancelled' : 'unpaid', order };
    }
    if (!this.enabled) throw new ServiceUnavailableException('Online payments are not set up yet.');

    let g: GatewayStatus;
    try {
      g = await verifyGatewayOrder(gatewayId);
    } catch (e) {
      throw new ServiceUnavailableException(e instanceof PaymentGatewayError ? e.message : 'Could not check the payment.');
    }

    if (g.status === 'success') {
      const receipt = {
        source: opts.source, gatewayOrderId: gatewayId, amount: g.amount,
        transactionId: g.transactionId, utr: g.utr, sender: g.senderName,
      };

      // Less than the total is not a partial success. Record it for a human and
      // leave the order unpaid, rather than shipping goods against a short payment.
      if (!(g.amount + 0.01 >= order.totalAmount)) {
        this.log.warn(`Order ${order.id}: received ₹${g.amount}, expected ₹${order.totalAmount}`);
        await this.audit(order.id, 'payment.amount_mismatch', { ...receipt, expected: order.totalAmount });
        return { status: 'mismatch', order };
      }

      // The UTR goes into paymentId: it is what a bank or a buyer quotes in a
      // dispute, and the admin order search already looks through this field.
      const paymentId = ['online', 'upi', g.transactionId, g.utr].filter(Boolean).join(':');

      if (timedOut) {
        const updated = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId,
            refundState: 'Required',
            cancelReason: 'Payment arrived after this order had timed out — a full refund is due.',
            version: { increment: 1 },
          },
          include: { items: true },
        });
        this.log.warn(`Late payment on timed-out order ${order.id} (UTR ${g.utr || '—'}) — refund required`);
        await this.audit(order.id, 'payment.late', receipt);
        return { status: 'late', order: updated };
      }

      /*
       * Recording the payment and taking the stock are one transaction.
       *
       * Nothing was reserved at checkout, so the last item can be paid for
       * twice — the decrement is conditional, and an order that loses that
       * race is recorded as paid with a refund owed rather than quietly
       * shipped. Money that arrived is never discarded just because the goods
       * ran out.
       */
      const result = await this.prisma.$transaction(
        async (tx) => {
          const { count } = await tx.order.updateMany({
            where: { id: order.id, status: 'PendingPayment' },
            data: { status: 'Paid', paymentId, version: { increment: 1 } },
          });
          // Someone else recorded it first; their transaction took the stock.
          if (count === 0) return { recorded: false, soldOut: [] as string[] };

          const soldOut: string[] = [];
          for (const it of order.items) {
            const taken = await tx.product.updateMany({
              where: { id: it.productId, quantity: { gte: it.quantity } },
              data: { quantity: { decrement: it.quantity } },
            });
            if (taken.count === 0) soldOut.push(it.title);
          }

          if (soldOut.length) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'Cancelled',
                cancelledBy: 'system',
                cancelReason: `${soldOut.join(', ')} sold out before this payment was confirmed — a full refund is due.`,
                refundState: 'Required',
                version: { increment: 1 },
              },
            });
          }
          return { recorded: true, soldOut };
        },
        { timeout: 20000, maxWait: 15000 },
      );

      if (result.recorded && result.soldOut.length) {
        this.log.warn(`Order ${order.id} was paid but ${result.soldOut.join(', ')} had sold out — refund required`);
        await this.audit(order.id, 'payment.received_oversold', { ...receipt, soldOut: result.soldOut });
        return { status: 'oversold', order: await this.reload(order.id) };
      }

      if (result.recorded) {
        await this.audit(order.id, 'payment.received', receipt);
        // The buyer's receipt: what they ordered, what it cost, where it is
        // going. Sent here rather than at checkout, because until the gateway
        // confirms the money there is nothing to be a receipt for.
        await this.emailReceipt({ ...order, paymentId }).catch(() => undefined);
        // The seller hears about an online order once it is paid, not when it is merely started.
        await this.prisma.notification
          .create({
            data: {
              sellerId: order.sellerId, type: 'new_order', title: 'New order 🎉',
              // What this order is worth to the seller. `totalAmount` includes
              // the platform fee, which is not theirs and which they are not
              // shown anywhere else.
              body: `${order.buyerName || 'A customer'} placed an order worth ₹${(
                Math.max(0, (order.itemsAmount || 0) - (order.discountAmount || 0)) + (order.shippingCharge || 0)
              ).toLocaleString('en-IN')}.`,
              link: '/seller/orders',
            },
          })
          .catch(() => undefined);
      }
      return { status: 'paid', order: await this.reload(order.id) };
    }

    if (opts.source === 'sweep' && stale && !timedOut && g.status === 'expired') {
      await this.release(order);
      return { status: 'cancelled', order: await this.reload(order.id) };
    }
    if (timedOut) return { status: 'cancelled', order };
    return { status: g.status === 'expired' ? 'expired' : 'pending', order };
  }

  /** Email the buyer their receipt. Never allowed to fail a settled payment. */
  private async emailReceipt(order: any) {
    const [store, customer] = await Promise.all([
      this.prisma.seller.findUnique({
        where: { id: order.sellerId },
        select: { storeName: true, username: true, contactEmail: true, user: { select: { email: true } } },
      }),
      order.customerId
        ? this.prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true } })
        : null,
    ]);
    if (!customer?.email) return;

    const base = (process.env.PUBLIC_WEB_URL || '').replace(/\/$/, '');
    const mail = orderReceiptEmail(order, {
      storeName: store?.storeName,
      storeContact: store?.contactEmail || store?.user?.email || null,
      ordersUrl: base && store?.username ? `${base}/s/${store.username}/orders` : null,
    });
    await sendMail(customer.email, mail.subject, mail.html, mail.text);
  }

  /**
   * Give back the stock held by abandoned unpaid orders for these products.
   *
   * Run from checkout, for just the products being bought, rather than on a
   * timer: this API runs serverless, where a background interval does not
   * reliably run, and held stock only matters at the moment someone else wants
   * it. Every candidate is checked with the gateway first — an order that looks
   * abandoned may simply have been paid without the webhook reaching us.
   */
  async releaseAbandoned(productIds: string[]) {
    if (!productIds.length) return;
    const stale = await this.prisma.order.findMany({
      where: {
        status: 'PendingPayment',
        createdAt: { lt: new Date(Date.now() - ABANDON_AFTER_MS) },
        items: { some: { productId: { in: productIds } } },
      },
      select: { id: true },
      take: 10,
    });
    for (const o of stale) {
      await this.settle(o.id, { source: 'sweep' }).catch((e) => this.log.warn(`Sweep of order ${o.id} failed: ${e?.message}`));
    }
  }

  /**
   * Close an abandoned unpaid order and give back its coupon use.
   *
   * No stock is returned because none was taken: an online order decrements
   * stock only when the payment is confirmed (see settle). The coupon is
   * different — its redemption is written at checkout to hold the buyer's
   * place in a usage limit, so it has to be undone here.
   */
  private async release(order: { id: string; items: { productId: string; quantity: number }[] }) {
    await this.prisma.$transaction(
      async (tx) => {
        const { count } = await tx.order.updateMany({
          where: { id: order.id, status: 'PendingPayment' },
          data: {
            status: 'Cancelled',
            cancelledBy: 'system',
            cancelReason: 'Payment was not completed in time.',
            version: { increment: 1 },
          },
        });
        if (count === 0) return; // paid, or cancelled, in the meantime

        const redemption = await tx.couponRedemption.findFirst({ where: { orderId: order.id } });
        if (redemption) {
          await tx.couponRedemption.delete({ where: { id: redemption.id } });
          await tx.coupon.updateMany({ where: { id: redemption.couponId }, data: { usedCount: { decrement: 1 } } });
        }
      },
      { timeout: 20000, maxWait: 15000 },
    );
    await this.audit(order.id, 'payment.abandoned', {});
  }

  /** FamGateway's `payment.success` callback. */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined, body: any) {
    if (!validWebhookSignature(rawBody, signature)) throw new UnauthorizedException('Invalid signature');

    const gatewayOrderId = String(body?.order_id || '');
    if (!gatewayOrderId) return { ok: true, ignored: 'no order_id' };

    const order = await this.prisma.order.findFirst({ where: { razorpayOrderId: gatewayOrderId }, select: { id: true } });
    if (!order) {
      // Money may still have arrived — for a session later replaced by a retry.
      // Acknowledge (so the gateway stops retrying) but leave a trail to find it by.
      this.log.warn(`Webhook for unknown gateway order ${gatewayOrderId}`);
      await this.audit(gatewayOrderId, 'payment.unmatched', { body }, 'payment');
      return { ok: true, ignored: 'unknown order' };
    }

    const { status } = await this.settle(order.id, { source: 'webhook' });
    return { ok: true, status };
  }
}
