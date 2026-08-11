import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto';
import { orderAcceptedEmail, orderRejectedEmail, sendMail } from '../mail/mailer';

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

    const commissionAmount = Math.round((itemsAmount * this.commissionPct) / 100);
    const shippingCharge = this.shippingFlat;
    const totalAmount = itemsAmount + commissionAmount + shippingCharge;

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

    const commissionAmount = Math.round((itemsAmount * this.commissionPct) / 100);
    const shippingCharge = Number(dto.shippingCharge ?? this.shippingFlat);
    const totalAmount = itemsAmount + shippingCharge;

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
  async confirmPayment(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
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

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, seller: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** Store name + the buyer's email, for order notification mail. */
  private async notifyTargets(order: any) {
    const [seller, customer] = await Promise.all([
      this.prisma.seller.findUnique({ where: { id: order.sellerId }, select: { storeName: true } }),
      order.customerId
        ? this.prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true } })
        : Promise.resolve(null),
    ]);
    return { storeName: seller?.storeName, email: customer?.email || null };
  }

  async transition(id: string, sellerId: string, to: 'Accepted' | 'Shipped') {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');

    const data: any = { status: to };
    if (to === 'Shipped') {
      // Stub AWB. Real impl: Shiprocket order_create → order_ship (PRD §15.2).
      data.awbNumber = 'DL' + Math.floor(1000000000 + Math.random() * 8999999999);
    }
    const updated = await this.prisma.order.update({ where: { id }, data, include: { items: true } });

    if (to === 'Accepted') {
      // Fire-and-forget: a mail failure must never fail the acceptance itself.
      this.notifyTargets(updated).then(({ storeName, email }) => {
        if (!email) return;
        const m = orderAcceptedEmail(updated, storeName);
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
    if (order.status === 'Shipped') data.awbNumber = null;

    return this.prisma.order.update({ where: { id }, data, include: { items: true } });
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
      return tx.order.update({ where: { id }, data: { status: 'Cancelled' }, include: { items: true } });
    }, { timeout: 20000, maxWait: 15000 });

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
    return this.prisma.order.update({
      where: { id },
      data: { status: 'Delivered' },
      include: { items: true },
    });
  }

  // Buyer confirms delivery → release escrow + complete the order.
  async confirmDelivery(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id },
      data: { status: 'Completed' },
      include: { items: true },
    });
  }

  async addReview(orderId: string, rating: number, comment?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    // releasing escrow on review keeps the demo's happy path moving
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'Completed' } });
    return this.prisma.review.create({
      data: {
        orderId,
        productId: order.items[0]?.productId || '',
        sellerId: order.sellerId,
        rating,
        comment,
      },
    });
  }

  async openDispute(orderId: string, issueType: string, description?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'Disputed' } });
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
