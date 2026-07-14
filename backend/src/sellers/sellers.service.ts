import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PAID = ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'];

function shapeProduct(p: any) {
  return { ...p, images: safeParse(p.images), variants: safeParse(p.variants), sizes: safeParse(p.sizes) };
}
function safeParse(s: string): any[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function safeParseObj(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
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
      storeConfig: seller.storeConfig ? safeParseObj(seller.storeConfig) : null,
      products: seller.products.map(shapeProduct),
    };
  }

  async updateProfile(sellerId: string, data: any) {
    const upd: any = {};
    const strBool = ['storeName', 'description', 'city', 'logoUrl', 'bannerUrl', 'address', 'category', 'tagline', 'contactPhone', 'contactEmail', 'instagram', 'whatsapp', 'payoutEmail', 'payoutMethod', 'payoutUpi', 'payoutAccount', 'payoutName', 'payoutPhone', 'published', 'freeShipEnabled', 'expressShip'];
    for (const k of strBool) if (data?.[k] !== undefined) upd[k] = data[k];
    const nums = ['shippingFee', 'minOrderAmount', 'shipDays', 'freeShipThreshold', 'expressFee', 'establishedYear'];
    for (const k of nums) if (data?.[k] !== undefined && data[k] !== null && data[k] !== '') upd[k] = Math.max(0, Math.round(Number(data[k]) || 0));
    await this.prisma.seller.update({ where: { id: sellerId }, data: upd });
    return { ok: true };
  }

  // day-by-day series helper for the last `days` days
  private series(rows: { createdAt: Date }[], days: number, value: (r: any) => number) {
    const out: { label: string; value: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      out.push({
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: rows.filter((r) => r.createdAt >= d && r.createdAt < next).reduce((s, r) => s + value(r), 0),
      });
    }
    return out;
  }

  // Record a storefront page-view (deduped per session within 30 min).
  async recordVisit(username: string, session?: string, source?: string, referrer?: string) {
    const seller = await this.prisma.seller.findUnique({ where: { username }, select: { id: true } });
    if (!seller) return { ok: false };
    if (session) {
      const recent = await this.prisma.visit.findFirst({
        where: { sellerId: seller.id, session, createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
      });
      if (recent) return { ok: true, deduped: true };
    }
    await this.prisma.visit.create({
      data: { sellerId: seller.id, session: session || null, source: (source || 'Direct').slice(0, 40), referrer: referrer?.slice(0, 300) || null },
    });
    return { ok: true };
  }

  // Everything the dashboard needs: sales, traffic, live users, reviews.
  async getAnalytics(sellerId: string) {
    const [orders, visits, reviews] = await Promise.all([
      this.prisma.order.findMany({ where: { sellerId }, select: { status: true, totalAmount: true, itemsAmount: true, buyerId: true, buyerName: true, buyerPhone: true, createdAt: true } }),
      this.prisma.visit.findMany({ where: { sellerId }, select: { session: true, source: true, createdAt: true } }),
      this.prisma.review.findMany({ where: { sellerId }, select: { rating: true } }),
    ]);
    // traffic sources (top)
    const srcMap = new Map<string, number>();
    visits.forEach((v) => srcMap.set(v.source || 'Direct', (srcMap.get(v.source || 'Direct') || 0) + 1));
    const sources = [...srcMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    const paid = orders.filter((o) => PAID.includes(o.status));
    const now = Date.now();
    const liveWindow = new Date(now - 5 * 60 * 1000);
    const liveSessions = new Set(visits.filter((v) => v.createdAt >= liveWindow).map((v, i) => v.session || `anon-${i}`));
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    return {
      revenue: paid.reduce((s, o) => s + o.itemsAmount, 0),
      orders: orders.length,
      paidOrders: paid.length,
      customers: new Set(orders.map((o) => o.buyerId || o.buyerPhone || o.buyerName).filter(Boolean)).size,
      totalVisits: visits.length,
      visitsToday: visits.filter((v) => v.createdAt >= todayStart).length,
      liveUsers: liveSessions.size,
      conversion: visits.length ? Math.round((paid.length / visits.length) * 1000) / 10 : 0,
      reviewCount: reviews.length,
      avgRating: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0,
      revenueSeries: this.series(paid, 14, (o) => o.itemsAmount),
      ordersSeries: this.series(orders, 14, () => 1),
      trafficSeries: this.series(visits, 14, () => 1),
      sources,
    };
  }

  // Onboarding checklist — computed from real store state.
  async getOnboarding(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Seller not found');
    const productCount = await this.prisma.product.count({ where: { sellerId } });
    const steps = [
      { key: 'product', label: 'Add your first product', hint: 'List an item with images and price to start selling.', href: '/seller/products/new', done: productCount > 0 },
      { key: 'payout', label: 'Add payout details', hint: 'Configure how you’ll receive payments from orders.', href: '/seller/payments', done: !!(seller.payoutUpi || seller.payoutAccount) },
      { key: 'shipping', label: 'Configure shipping', hint: 'Set your shipping rate and pickup address.', href: '/seller/shipping', done: seller.shippingFee !== null && seller.shippingFee !== undefined },
      { key: 'customize', label: 'Customize your store', hint: 'Update colors, logo and pages to match your brand.', href: '/seller/store-editor', done: !!seller.storeConfig },
      { key: 'publish', label: 'Publish your store', hint: 'Make your store live for customers to visit.', href: '/seller/store-editor', done: !!seller.published },
    ];
    return { steps, done: steps.filter((s) => s.done).length, total: steps.length, published: !!seller.published };
  }

  // Reviews for the seller, with the product title, so they can reply.
  async getReviews(sellerId: string) {
    const reviews = await this.prisma.review.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } });
    const productIds = [...new Set(reviews.map((r) => r.productId))];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } });
    const title = (id: string) => products.find((p) => p.id === id)?.title || 'Product';
    return reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, response: r.response, respondedAt: r.respondedAt,
      buyerName: r.buyerName || 'Customer', product: title(r.productId), createdAt: r.createdAt,
    }));
  }

  async respondReview(sellerId: string, reviewId: string, response: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.sellerId !== sellerId) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id: reviewId }, data: { response, respondedAt: new Date() } });
  }

  // ── coupons ──
  async getCoupons(sellerId: string) {
    const coupons = await this.prisma.coupon.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } });
    const now = Date.now();
    return coupons.map((c) => ({ ...c, expired: c.expiresAt ? c.expiresAt.getTime() < now : false }));
  }
  async createCoupon(sellerId: string, dto: any) {
    const code = String(dto.code || '').toUpperCase().trim();
    if (!code) throw new BadRequestException('Coupon code is required');
    const value = Math.max(0, Math.round(Number(dto.value) || 0));
    const minOrder = Math.max(0, Math.round(Number(dto.minOrder) || 0));
    const type = dto.type === 'fixed' ? 'fixed' : 'percent';
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    try {
      return await this.prisma.coupon.create({ data: { sellerId, code, type, value, minOrder, expiresAt } });
    } catch {
      throw new BadRequestException('A coupon with that code already exists');
    }
  }
  async updateCoupon(sellerId: string, id: string, dto: any) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c || c.sellerId !== sellerId) throw new NotFoundException('Coupon not found');
    const data: any = {};
    if (dto.code !== undefined) data.code = String(dto.code).toUpperCase().trim();
    if (dto.type !== undefined) data.type = dto.type === 'fixed' ? 'fixed' : 'percent';
    if (dto.value !== undefined) data.value = Math.max(0, Math.round(Number(dto.value) || 0));
    if (dto.minOrder !== undefined) data.minOrder = Math.max(0, Math.round(Number(dto.minOrder) || 0));
    if (dto.active !== undefined) data.active = !!dto.active;
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return this.prisma.coupon.update({ where: { id }, data });
  }
  async deleteCoupon(sellerId: string, id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c || c.sellerId !== sellerId) throw new NotFoundException('Coupon not found');
    await this.prisma.coupon.delete({ where: { id } });
    return { ok: true };
  }
  // ── notifications ──
  async getNotifications(sellerId: string) {
    const items = await this.prisma.notification.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, take: 40 });
    const unread = items.filter((n) => !n.read).length;
    return { items, unread };
  }
  async markNotificationsRead(sellerId: string) {
    await this.prisma.notification.updateMany({ where: { sellerId, read: false }, data: { read: true } });
    return { ok: true };
  }

  // Registered customers for this store (recorded on signup), enriched with order totals.
  async getCustomers(sellerId: string) {
    const [customers, orders] = await Promise.all([
      this.prisma.customer.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.findMany({ where: { sellerId }, select: { customerId: true, status: true, totalAmount: true } }),
    ]);
    const paidStatuses = PAID;
    return customers.map((c) => {
      const co = orders.filter((o) => o.customerId === c.id);
      const paid = co.filter((o) => paidStatuses.includes(o.status));
      return {
        id: c.id, name: c.name, email: c.email, phone: c.phone, createdAt: c.createdAt,
        orders: co.length, spent: paid.reduce((s, o) => s + o.totalAmount, 0),
      };
    });
  }

  async updateStoreConfig(sellerId: string, config: any) {
    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { storeConfig: JSON.stringify(config ?? {}) },
    });
    return { ok: true };
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
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: { select: { email: true, name: true } } },
    });
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
