import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto';
import { orderAcceptedEmail, orderRejectedEmail, orderShippedEmail, reviewRequestEmail, sendMail } from '../mail/mailer';
import { computeAmounts } from '../common/money';
import { storeUrl } from '../common/store-url';
import { recordStatusChange } from '../common/order-events';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private commissionPct = Number(process.env.COMMISSION_PERCENT || 5);
  private shippingFlat = Number(process.env.SHIPPING_FLAT || 60);

  // POST /orders/checkout — reserve, price, and create a PendingPayment order.
  async checkout(dto: CheckoutDto) {
    if (!dto.items?.length) throw new BadRequestException('Cart is empty');

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });
    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more items are unavailable');
    }

    // PRD assumption §8.3 — every order is from exactly one seller.
    const sellerIds = [...new Set(products.map((p) => p.sellerId))];
    if (sellerIds.length > 1) {
      throw new BadRequestException('All items must be from the same store');
    }

    let itemsAmount = 0;
    const itemRows = dto.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      const qty = i.quantity || 1;
      if (p.quantity < qty) throw new BadRequestException(`"${p.title}" is out of stock`);
      itemsAmount += p.price * qty;
      return { productId: p.id, title: p.title, unitPrice: p.price, quantity: qty };
    });

    const a = computeAmounts(itemsAmount, this.shippingFlat, 0, this.commissionPct);
    const commissionAmount = a.fee;
    const shippingCharge = a.shipping;
    const totalAmount = a.customerTotal;

    const order = await this.prisma.order.create({
      data: {
        sellerId: sellerIds[0],
        buyerName: dto.buyerName,
        buyerPhone: dto.buyerPhone,
        address: dto.address,
        itemsAmount,
        commissionAmount,
        shippingCharge,
        totalAmount,
        status: 'PendingPayment',
        // Stub for Razorpay order id. Real impl: POST /v1/orders (PRD §15.1).
        razorpayOrderId: 'order_stub_' + Math.random().toString(36).slice(2, 12),
        items: { create: itemRows },
      },
      include: { items: true },
    });
    return order;
  }

  // Seller manually records a sale (e.g. an order that came via DM). Marks it
  // Paid and auto-decrements stock.
  async createManual(sellerId: string, dto: any) {
    if (!dto.items?.length) throw new BadRequestException('Add at least one item');
    const ids = dto.items.map((i: any) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids }, sellerId } });
    if (products.length !== new Set(ids).size) throw new BadRequestException('Invalid product selection');

    let itemsAmount = 0;
    const itemRows = dto.items.map((i: any) => {
      const p = products.find((x) => x.id === i.productId)!;
      const qty = Number(i.quantity) || 1;
      if (p.quantity < qty) throw new BadRequestException(`"${p.title}" is out of stock`);
      itemsAmount += p.price * qty;
      return { productId: p.id, title: p.title, unitPrice: p.price, quantity: qty };
    });

    const a = computeAmounts(itemsAmount, Number(dto.shippingCharge ?? this.shippingFlat), 0, this.commissionPct);
    const commissionAmount = a.fee;
    const shippingCharge = a.shipping;
    const totalAmount = a.customerTotal;

    // See the note in customers.service checkout: Prisma's 5s default is too
    // tight for per-statement round trips to Neon, especially on a cold compute.
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sellerId,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          address: dto.address,
          itemsAmount,
          commissionAmount,
          shippingCharge,
          totalAmount,
          status: 'Paid',
          items: { create: itemRows },
        },
        include: { items: true },
      });
      for (const row of itemRows) {
        await tx.product.update({ where: { id: row.productId }, data: { quantity: { decrement: row.quantity } } });
      }
      return order;
    }, { timeout: 20000, maxWait: 15000 });
  }

  // POST /orders/:id/confirm — verify payment + finalize (stubbed).
  // Real impl verifies Razorpay HMAC signature on the webhook (PRD §15.1).
  async confirmPayment(id: string, user?: any) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    this.assertOrderAccess(order, user);
    if (order.status !== 'PendingPayment') return order;

    // Decrement inventory transactionally to prevent oversell (PRD §12/§20).
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
        if (res.count === 0) throw new BadRequestException(`"${item.title}" just sold out`);
      }
      return tx.order.update({
        where: { id },
        data: {
          status: 'Paid',
          paymentId: 'pay_stub_' + Math.random().toString(36).slice(2, 12),
        },
        include: { items: true },
      });
    }, { timeout: 20000, maxWait: 15000 });
  }

  /**
   * Only the buyer who placed an order, the seller fulfilling it, or an admin
   * may see or act on it.
   *
   * Order ids are cuids, but "unguessable" is not an access control: these
   * records carry the buyer's name, phone and full delivery address.
   */
  private assertOrderAccess(order: { sellerId: string; customerId: string | null; buyerId: string | null }, user: any) {
    if (!user) throw new ForbiddenException('Sign in to continue');
    if (user.role === 'admin') return;
    if (user.role === 'seller' && user.sellerId && order.sellerId === user.sellerId) return;
    if (user.role === 'customer' && order.customerId && order.customerId === user.userId) return;
    if (user.role === 'buyer' && order.buyerId && order.buyerId === user.userId) return;
    throw new ForbiddenException('Not your order');
  }

  /** Buyer-only actions (confirm delivery, review, dispute). */
  private assertBuyer(order: { customerId: string | null; buyerId: string | null }, user: any) {
    if (!user) throw new ForbiddenException('Sign in to continue');
    const isCustomer = user.role === 'customer' && order.customerId && order.customerId === user.userId;
    const isBuyer = user.role === 'buyer' && order.buyerId && order.buyerId === user.userId;
    if (!isCustomer && !isBuyer) throw new ForbiddenException('Only the buyer can do this');
  }

  async findOne(id: string, user?: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, seller: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertOrderAccess(order, user);
    return order;
  }

  /** Store name + the buyer's email, for order notification mail. */
  private async notifyTargets(order: any) {
    const [seller, customer] = await Promise.all([
      this.prisma.seller.findUnique({ where: { id: order.sellerId }, select: { storeName: true, username: true } }),
      order.customerId
        ? this.prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true } })
        : Promise.resolve(null),
    ]);
    return { storeName: seller?.storeName, username: seller?.username, email: customer?.email || null };
  }

  /**
   * Advance an order. Shipping additionally records the courier — a tracking
   * number is useless to the buyer without knowing who to track it with — and
   * emails them the details.
   */
  async transition(
    id: string,
    sellerId: string,
    to: 'Accepted' | 'Shipped',
    courier?: string,
    awbNumber?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');

    const data: any = { status: to };
    if (to === 'Shipped') {
      const name = String(courier || '').trim();
      if (!name) throw new BadRequestException('Enter the courier / shipping agency name.');
      if (name.length > 60) throw new BadRequestException('Courier name is too long.');
      data.courier = name;

      // The seller's real tracking number when they have one — a generated
      // stub is useless on the courier's website, so anything they enter wins.
      const awb = String(awbNumber || '').trim();
      if (awb) {
        if (awb.length > 40) throw new BadRequestException('Tracking number is too long.');
        if (!/^[A-Za-z0-9-]+$/.test(awb)) {
          throw new BadRequestException('A tracking number can only contain letters, numbers and dashes.');
        }
        data.awbNumber = awb.toUpperCase();
      } else {
        // Placeholder so the buyer sees something until the real one is added.
        // Real impl: Shiprocket order_create → order_ship (PRD §15.2).
        data.awbNumber = 'DL' + Math.floor(1000000000 + Math.random() * 8999999999);
      }
    }
    const updated = await this.prisma.order.update({ where: { id }, data, include: { items: true } });
    // Awaited, not fired and forgotten: this runs as a serverless function, and
    // the response ending kills anything still in flight.
    await recordStatusChange(this.prisma, updated, order.status, to, { id: sellerId });

    // Fire-and-forget: a mail failure must never fail the status change itself.
    if (to === 'Accepted' || to === 'Shipped') {
      this.notifyTargets(updated).then(({ storeName, email }) => {
        if (!email) return;
        const m = to === 'Accepted'
          ? orderAcceptedEmail(updated, storeName)
          : orderShippedEmail(updated, storeName);
        return sendMail(email, m.subject, m.html, m.text);
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Step an order back one stage, for when the seller advances it by mistake.
   *
   * Only walks the normal chain backwards. Cancelled is deliberately excluded:
   * un-cancelling would have to re-reserve stock that may since have sold, so
   * that's a new order rather than a status flip.
   */
  async revertStatus(id: string, sellerId: string) {
    const BACK: Record<string, string> = {
      Accepted: 'Paid',
      Shipped: 'Accepted',
      Delivered: 'Shipped',
      Completed: 'Delivered',
    };
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');

    const to = BACK[order.status];
    if (!to) throw new BadRequestException(`An order that is ${order.status} can't be moved back.`);

    const data: any = { status: to };
    // Going back before "Shipped" invalidates the tracking number.
    if (order.status === 'Shipped') { data.awbNumber = null; data.courier = null; }

    const reverted = await this.prisma.order.update({ where: { id }, data, include: { items: true } });
    await recordStatusChange(this.prisma, reverted, order.status, to, { id: sellerId });
    return reverted;
  }

  /**
   * Seller declines an order: cancel it and put the reserved stock back.
   *
   * Only valid before the goods move — once shipped, cancelling is a refund/
   * dispute matter rather than a rejection.
   */
  async rejectOrder(id: string, sellerId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');
    if (!['Paid', 'PendingPayment', 'Accepted'].includes(order.status)) {
      throw new BadRequestException(`An order that is already ${order.status} can't be rejected.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: {
          status: 'Cancelled',
          cancelledBy: 'seller',
          cancelReason: String(reason || '').trim().slice(0, 300) || null,
        },
        include: { items: true },
      });
    }, { timeout: 20000, maxWait: 15000 });
    await recordStatusChange(this.prisma, updated, order.status, 'Cancelled', { id: sellerId });

    this.notifyTargets(updated).then(({ storeName, email }) => {
      if (!email) return;
      const m = orderRejectedEmail(updated, storeName, reason);
      return sendMail(email, m.subject, m.html, m.text);
    }).catch(() => {});

    return updated;
  }

  // Mark delivered (stands in for the Shiprocket "Delivered" webhook).
  async markDelivered(id: string, sellerId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (sellerId && order.sellerId !== sellerId) throw new ForbiddenException('Not your order');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'Delivered' },
      include: { items: true },
    });
    await recordStatusChange(this.prisma, updated, order.status, 'Delivered', { id: sellerId || null });

    // Delivery is the moment to ask for a review: the buyer has the goods and
    // an opinion. Sent only if they haven't already reviewed, and
    // fire-and-forget — a mail failure must not fail the status change.
    this.requestReview(updated).catch(() => {});

    return updated;
  }

  /** Email the buyer asking them to rate a delivered order. */
  private async requestReview(order: any) {
    const already = await this.prisma.review.findUnique({ where: { orderId: order.id } });
    if (already) return;

    const { storeName, username, email } = await this.notifyTargets(order);
    if (!email) return;

    // The buyer's orders tab, with this order opened on its rating form.
    const url = storeUrl(username, `/orders?review=${order.id}`) || undefined;

    const m = reviewRequestEmail(order, storeName, url);
    return sendMail(email, m.subject, m.html, m.text);
  }

  // Buyer confirms delivery → release escrow + complete the order.
  async confirmDelivery(id: string, user?: any) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    this.assertBuyer(order, user);
    const done = await this.prisma.order.update({
      where: { id },
      data: { status: 'Completed' },
      include: { items: true },
    });
    await recordStatusChange(this.prisma, done, order.status, 'Completed', { id: user?.userId || null });
    return done;
  }

  async addReview(orderId: string, rating: number, comment?: string, user?: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertBuyer(order, user);
    if (!['Delivered', 'Completed'].includes(order.status)) {
      throw new BadRequestException('You can review an order once it has been delivered.');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be a whole number from 1 to 5.');
    }
    // One review per order. Without this a buyer could post repeatedly and
    // move a store's average on their own.
    const already = await this.prisma.review.findUnique({ where: { orderId } });
    if (already) throw new BadRequestException('You have already reviewed this order.');

    // A review completes the order. It does not release the money: that is an
    // explicit admin decision now (common/funds).
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'Completed' } });

    // Attribute the review, so the seller sees who wrote it and the admin can
    // look up everything one customer has ever written.
    const customer = order.customerId
      ? await this.prisma.customer.findUnique({ where: { id: order.customerId }, select: { name: true } })
      : null;

    const review = await this.prisma.review.create({
      data: {
        orderId,
        productId: order.items[0]?.productId || '',
        sellerId: order.sellerId,
        customerId: order.customerId,
        buyerName: customer?.name || order.buyerName || 'Customer',
        rating,
        comment,
      },
    });

    // The storefront's star rating is stored on the Seller row, so it has to
    // be refreshed here or the new review would never show up in it.
    const agg = await this.prisma.review.aggregate({
      where: { sellerId: order.sellerId, hidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.seller.update({
      where: { id: order.sellerId },
      data: {
        rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
        ratingCount: agg._count,
      },
    });

    return review;
  }

  async openDispute(orderId: string, issueType: string, description?: string, user?: any) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    this.assertBuyer(order, user);
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'Disputed' } });
    await recordStatusChange(this.prisma, order, order.status, 'Disputed', { id: user?.userId || null });
    return this.prisma.dispute.create({
      data: {
        orderId,
        sellerId: order.sellerId,
        buyerName: order.buyerName,
        issueType,
        description,
      },
    });
  }
}
