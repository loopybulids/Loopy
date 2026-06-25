import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private assertAdmin(user: any) {
    if (!user || user.role !== 'admin') throw new ForbiddenException('Admins only');
  }

  async stats(user: any) {
    this.assertAdmin(user);
    const [pendingKyc, openDisputes, payoutsDue, orders] = await Promise.all([
      this.prisma.seller.count({ where: { kycStatus: 'pending' } }),
      this.prisma.dispute.count({ where: { status: 'open' } }),
      this.prisma.payout.aggregate({ where: { status: 'requested' }, _sum: { amount: true } }),
      this.prisma.order.findMany({ where: { status: { in: ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'] } } }),
    ]);
    const gmv = orders.reduce((s, o) => s + o.totalAmount, 0);
    return { pendingKyc, openDisputes, payoutsDue: payoutsDue._sum.amount || 0, gmv };
  }

  private static PAID = ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'];

  // Platform-wide totals for the admin overview cards.
  async overview(user: any) {
    this.assertAdmin(user);
    const [sellerCount, productCount, orders] = await Promise.all([
      this.prisma.seller.count(),
      this.prisma.product.count(),
      this.prisma.order.findMany({ select: { status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, buyerId: true, buyerName: true, buyerPhone: true } }),
    ]);
    const paid = orders.filter((o) => AdminService.PAID.includes(o.status));
    const revenue = paid.reduce((s, o) => s + (o.itemsAmount || 0), 0);
    const commission = paid.reduce((s, o) => s + (o.commissionAmount || 0), 0);
    const customers = new Set(orders.map((o) => o.buyerId || o.buyerName || o.buyerPhone).filter(Boolean)).size;
    return {
      sellers: sellerCount,
      products: productCount,
      orders: orders.length,
      paidOrders: paid.length,
      revenue,
      commission,
      customers,
    };
  }

  // Every seller with their individual analytics.
  async sellers(user: any) {
    this.assertAdmin(user);
    const [sellers, orders, productGroups] = await Promise.all([
      this.prisma.seller.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.order.findMany({
        select: { sellerId: true, status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, buyerId: true, buyerName: true, buyerPhone: true },
      }),
      this.prisma.product.groupBy({ by: ['sellerId'], _count: { _all: true } }),
    ]);

    const productCount = (id: string) => productGroups.find((g) => g.sellerId === id)?._count._all || 0;

    return sellers.map((s) => {
      const so = orders.filter((o) => o.sellerId === s.id);
      const paid = so.filter((o) => AdminService.PAID.includes(o.status));
      const delivered = so.filter((o) => ['Delivered', 'Completed'].includes(o.status));
      const revenue = paid.reduce((a, o) => a + (o.itemsAmount || 0), 0);
      const commission = paid.reduce((a, o) => a + (o.commissionAmount || 0), 0);
      const customers = new Set(so.map((o) => o.buyerId || o.buyerName || o.buyerPhone).filter(Boolean)).size;
      return {
        id: s.id,
        storeName: s.storeName,
        username: s.username,
        email: (s as any).user?.email || null,
        city: s.city,
        kycStatus: s.kycStatus,
        rating: s.rating,
        ratingCount: s.ratingCount,
        createdAt: s.createdAt,
        stats: {
          products: productCount(s.id),
          orders: so.length,
          paidOrders: paid.length,
          delivered: delivered.length,
          customers,
          revenue,
          commission,
        },
      };
    });
  }

  async setKyc(user: any, id: string, status: 'approved' | 'rejected') {
    this.assertAdmin(user);
    const seller = await this.prisma.seller.findUnique({ where: { id } });
    if (!seller) throw new NotFoundException('Seller not found');
    return this.prisma.seller.update({ where: { id }, data: { kycStatus: status } });
  }

  async disputes(user: any) {
    this.assertAdmin(user);
    return this.prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async resolveDispute(user: any, id: string, resolution: 'refunded' | 'released') {
    this.assertAdmin(user);
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.prisma.order.update({
      where: { id: dispute.orderId },
      data: { status: resolution === 'refunded' ? 'Refunded' : 'Completed' },
    });
    return this.prisma.dispute.update({
      where: { id },
      data: { status: resolution, resolvedAt: new Date() },
    });
  }
}
