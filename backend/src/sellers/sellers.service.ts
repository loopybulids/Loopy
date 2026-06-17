import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function shapeProduct(p: any) {
  return { ...p, images: safeParse(p.images) };
}
function safeParse(s: string): string[] {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  // All approved stores with a few preview products, for the Shop page.
  async discover() {
    const sellers = await this.prisma.seller.findMany({
      where: { kycStatus: 'approved' },
      include: { products: { where: { isActive: true }, take: 4, orderBy: { createdAt: 'desc' } } },
      orderBy: { ratingCount: 'desc' },
    });
    return sellers.map((s) => ({
      id: s.id, storeName: s.storeName, username: s.username, description: s.description,
      bannerUrl: s.bannerUrl, logoUrl: s.logoUrl, rating: s.rating, ratingCount: s.ratingCount,
      city: s.city, productCount: s.products.length,
      preview: s.products.map(shapeProduct),
    }));
  }

  async getStore(username: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { username },
      include: {
        products: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!seller) throw new NotFoundException('Store not found');
    return {
      id: seller.id,
      storeName: seller.storeName,
      username: seller.username,
      description: seller.description,
      bannerUrl: seller.bannerUrl,
      logoUrl: seller.logoUrl,
      rating: seller.rating,
      ratingCount: seller.ratingCount,
      city: seller.city,
      kycStatus: seller.kycStatus,
      products: seller.products.map(shapeProduct),
    };
  }

  async getSellerOrders(sellerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { sellerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders;
  }

  async getMe(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  async getProducts(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(shapeProduct);
  }

  // Escrow wallet computed from the order ledger (PRD §12 Payment/Escrow).
  async getWallet(sellerId: string) {
    const orders = await this.prisma.order.findMany({ where: { sellerId } });
    const net = (o: any) => o.itemsAmount; // seller earns item value (fee is on top)
    const held = orders
      .filter((o) => ['Paid', 'Accepted', 'Shipped'].includes(o.status))
      .reduce((s, o) => s + net(o), 0);
    const available = orders
      .filter((o) => ['Delivered', 'Completed'].includes(o.status))
      .reduce((s, o) => s + net(o), 0);
    const payouts = await this.prisma.payout.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
    const paid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    return { available: Math.max(0, available - paid), held, paidOut: paid, payouts };
  }

  async requestPayout(sellerId: string) {
    const { available } = await this.getWallet(sellerId);
    if (available <= 0) return { ok: false, message: 'No funds available yet' };
    const payout = await this.prisma.payout.create({
      data: { sellerId, amount: available, status: 'requested' },
    });
    return { ok: true, payout };
  }
}
