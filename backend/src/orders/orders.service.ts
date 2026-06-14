import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto';

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
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, seller: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
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
    return this.prisma.order.update({ where: { id }, data, include: { items: true } });
  }

  // Mark delivered (stands in for the Shiprocket "Delivered" webhook).
  async markDelivered(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
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
