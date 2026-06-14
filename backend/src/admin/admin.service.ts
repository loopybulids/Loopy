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

  async sellers(user: any) {
    this.assertAdmin(user);
    return this.prisma.seller.findMany({ orderBy: { createdAt: 'desc' } });
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
