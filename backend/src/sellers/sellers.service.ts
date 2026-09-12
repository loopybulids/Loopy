import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sellerReceivableOf } from '../common/money';

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

  // Fallback when a seller hasn't set their own rate — same default checkout uses.
  private shippingFlat = Number(process.env.SHIPPING_FLAT || 60);

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

  /**
   * Just the storefront's identity — name, logo and accent colour.
   *
   * The account pages need the same brand mark the storefront header shows, but
   * `getStore` returns the whole catalogue (images included, ~900KB). This keeps
   * those pages cheap.
   */
  async getBrand(username: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { username },
      select: { storeName: true, username: true, logoUrl: true, storeConfig: true },
    });
    if (!seller) throw new NotFoundException('Store not found');
    const cfg: any = seller.storeConfig ? safeParseObj(seller.storeConfig) : null;
    return {
      storeName: seller.storeName,
      username: seller.username,
      // The header logo is edited in the store editor; the profile logo is only
      // a fallback when the editor has never set one. An empty string there is
      // a removal and must be honoured, or a logo the seller deleted comes
      // straight back on the storefront.
      logoUrl: cfg?.header?.logoUrl !== undefined
        ? (cfg.header.logoUrl || null)
        : (seller.logoUrl || null),
      accent: cfg?.theme?.accent || null,
    };
  }

  async getStore(username: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { username },
      include: {
        products: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!seller) throw new NotFoundException('Store not found');

    // Published collections, so the store editor can arrange them into rows.
    const collections = await this.prisma.collection.findMany({
      where: { sellerId: seller.id, published: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { items: { orderBy: { position: 'asc' }, select: { productId: true } } },
    });

    // Visible reviews only — a hidden one must not reach the storefront by
    // any route. Capped because this payload is already large.
    const reviews = await this.prisma.review.findMany({
      where: { sellerId: seller.id, hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, rating: true, comment: true, response: true, buyerName: true, createdAt: true },
    });
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
      published: seller.published,
      // a store is "live" only once it's published AND has shipping + payout set up
      live: seller.published && seller.shippingFee !== null && !!(seller.payoutUpi || seller.payoutAccount),
      // Shipping rules, so checkout can show the real cost before the order is
      // placed instead of a vague "+ shipping". Mirrors the maths in
      // customers.service.checkout, which stays the source of truth.
      shipping: {
        fee: seller.shippingFee ?? this.shippingFlat,
        minOrderAmount: seller.minOrderAmount ?? null,
        freeShipEnabled: !!seller.freeShipEnabled,
        freeShipThreshold: seller.freeShipThreshold ?? null,
        shipDays: seller.shipDays ?? null,
      },
      // Collections reference products already in the `products` array above,
      // so only ids travel — the catalogue isn't duplicated per collection.
      collections: collections.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        productIds: c.items.map((i) => i.productId),
      })),
      // Platform fee rate, so checkout can show the real total before payment.
      // The server recomputes it on checkout — this is display only.
      platformFeePct: Number(process.env.COMMISSION_PERCENT || 5),
      // What buyers said, newest first. Hidden ones are excluded here — this
      // is the public list, and that is the whole point of hiding.
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        response: r.response,
        buyerName: r.buyerName || 'Customer',
        createdAt: r.createdAt,
      })),
      storeConfig: seller.storeConfig ? safeParseObj(seller.storeConfig) : null,
      products: seller.products.map(shapeProduct),
    };
  }

  async updateProfile(sellerId: string, data: any) {
    const upd: any = {};
    // Store handle (username) → your public /s/<handle> URL. Slugified + unique.
    if (typeof data?.username === 'string') {
      const slug = data.username.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (slug.length < 3) throw new BadRequestException('Handle must be at least 3 characters (letters, numbers or hyphens).');
      const taken = await this.prisma.seller.findFirst({ where: { username: slug, NOT: { id: sellerId } }, select: { id: true } });
      if (taken) throw new BadRequestException('That handle is already taken — try another.');
      upd.username = slug;
    }
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
    // Only the last 14 days of visit rows are ever read — that's the width of
    // every chart on the page. Pulling the store's entire visit history to
    // compute a 14-day series is the dashboard's slowest query and it grows
    // without limit, so the running totals come from counts instead.
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [orders, visits, visitTotal, reviewAgg] = await Promise.all([
      this.prisma.order.findMany({ where: { sellerId }, select: { status: true, totalAmount: true, itemsAmount: true, shippingCharge: true, discountAmount: true, buyerId: true, buyerName: true, buyerPhone: true, createdAt: true } }),
      this.prisma.visit.findMany({
        where: { sellerId, createdAt: { gte: since } },
        select: { session: true, source: true, createdAt: true },
      }),
      this.prisma.visit.count({ where: { sellerId } }),
      // Count and mean computed in the database rather than by pulling every
      // review row back to add them up here. Hidden reviews are excluded
      // because this is the rating shoppers see.
      this.prisma.review.aggregate({ where: { sellerId, hidden: false }, _avg: { rating: true }, _count: true }),
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
      // What the seller actually earns — goods net of their coupon discounts,
      // plus shipping. Previously this summed itemsAmount alone, so the
      // dashboard's "Revenue" was smaller than the wallet's lifetime earnings
      // for the same orders. Same formula as getWallet now. See common/money.
      revenue: sellerReceivableOf(paid),
      orders: orders.length,
      paidOrders: paid.length,
      customers: new Set(orders.map((o) => o.buyerId || o.buyerPhone || o.buyerName).filter(Boolean)).size,
      totalVisits: visitTotal,
      visitsToday: visits.filter((v) => v.createdAt >= todayStart).length,
      liveUsers: liveSessions.size,
      conversion: visitTotal ? Math.round((paid.length / visitTotal) * 1000) / 10 : 0,
      reviewCount: reviewAgg._count,
      avgRating: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : 0,
      revenueSeries: this.series(paid, 14, (o) => (o.itemsAmount || 0) - (o.discountAmount || 0) + (o.shippingCharge || 0)),
      ordersSeries: this.series(orders, 14, () => 1),
      trafficSeries: this.series(visits, 14, () => 1),
      sources,
    };
  }

  // Onboarding checklist — computed from real store state.
  /**
   * Progress through store setup.
   *
   * Every step here is a yes/no, but this used to load the whole Seller row and
   * then a product count, one after the other. Logos, banners and storeConfig
   * are stored inline as base64/JSON — nearly a megabyte for some stores — so
   * the checklist was pulling all of it across the wire to ask six boolean
   * questions, which made it the slowest call on the dashboard.
   *
   * The columns are now reduced to booleans in the database and the count runs
   * alongside it rather than after it.
   */
  async getOnboarding(sellerId: string) {
    const [rows, productCount] = await Promise.all([
      this.prisma.$queryRaw<Array<{
        description: string | null; tagline: string | null; category: string | null;
        city: string | null; contactPhone: string | null; contactEmail: string | null;
        hasLogo: boolean; payoutUpi: string | null; payoutAccount: string | null;
        shippingFee: number | null; hasConfig: boolean; published: boolean;
      }>>`
        SELECT description, tagline, category, city, "contactPhone", "contactEmail",
               (COALESCE("logoUrl", '') <> '')     AS "hasLogo",
               "payoutUpi", "payoutAccount", "shippingFee",
               ("storeConfig" IS NOT NULL)         AS "hasConfig",
               published
        FROM "Seller" WHERE id = ${sellerId} LIMIT 1
      `,
      this.prisma.product.count({ where: { sellerId } }),
    ]);

    const seller = rows[0];
    if (!seller) throw new NotFoundException('Seller not found');
    // "Profile complete" = the details a buyer actually needs to trust and
    // contact the store. Social links and established year are optional extras,
    // so they're deliberately not required here.
    const profileFields = [
      seller.description || seller.tagline, // something describing the store
      seller.category,
      seller.city,
      seller.contactPhone || seller.contactEmail, // at least one way to reach them
      seller.hasLogo ? 'logo' : '', // a boolean from SQL, not the base64 itself
    ];
    const profileDone = profileFields.filter((v) => !!String(v || '').trim()).length;

    const steps = [
      {
        key: 'profile',
        label: 'Complete your store profile',
        hint: 'Add your logo, description, category, city and a contact — buyers see these on your storefront.',
        href: '/seller/profile',
        done: profileDone === profileFields.length,
        progress: `${profileDone}/${profileFields.length}`,
      },
      { key: 'product', label: 'Add your first product', hint: 'List an item with images and price to start selling.', href: '/seller/products/new', done: productCount > 0 },
      { key: 'payout', label: 'Add payout details', hint: 'Configure how you’ll receive payments from orders.', href: '/seller/payments', done: !!(seller.payoutUpi || seller.payoutAccount) },
      { key: 'shipping', label: 'Configure shipping', hint: 'Set your shipping rate and pickup address.', href: '/seller/shipping', done: seller.shippingFee !== null && seller.shippingFee !== undefined },
      { key: 'customize', label: 'Customize your store', hint: 'Update colors, logo and pages to match your brand.', href: '/seller/store-editor', done: seller.hasConfig },
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
      hidden: r.hidden, hiddenReason: r.hiddenReason, hiddenAt: r.hiddenAt,
    }));
  }

  /**
   * Recompute a store's public star rating from its visible reviews.
   *
   * `Seller.rating` and `ratingCount` are displayed on the storefront and the
   * Shop listing but were seed values nothing ever updated — so the stars a
   * shopper saw had no relationship to what buyers actually wrote. Called
   * whenever a review is added or its visibility changes, and it counts only
   * visible reviews, since that is what the number claims to represent.
   */
  async recomputeSellerRating(sellerId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { sellerId, hidden: false },
      _avg: { rating: true },
      _count: true,
    });
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: {
        rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
        ratingCount: agg._count,
      },
      select: { rating: true, ratingCount: true },
    });
  }

  /**
   * Hide or unhide one of the seller's reviews.
   *
   * Hiding removes it from the storefront and from the public rating. It does
   * not delete it: the row stays, the reason is recorded, and Loopy's admins
   * still see it — so a seller can decline to display criticism but cannot
   * make it disappear.
   */
  async hideReview(sellerId: string, id: string, hidden: boolean, reason?: string) {
    const review = await this.prisma.review.findFirst({ where: { id, sellerId } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        hidden,
        hiddenReason: hidden ? (reason?.trim() || null) : null,
        hiddenAt: hidden ? new Date() : null,
      },
      select: { id: true, hidden: true, hiddenReason: true, hiddenAt: true },
    });

    // The storefront's stars must follow what is actually on display.
    await this.recomputeSellerRating(sellerId);
    return updated;
  }

  async respondReview(sellerId: string, reviewId: string, response: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.sellerId !== sellerId) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id: reviewId }, data: { response, respondedAt: new Date() } });
  }

  // ── collections ──

  /**
   * Turn a title into a per-seller unique slug.
   *
   * Collections are addressed as /s/<store>/c/<slug>, so the slug has to be
   * stable and unique within the store. A clash gets a numeric suffix rather
   * than an error, because a seller naming two collections "Sale" is a
   * reasonable thing to do and shouldn't be a failure.
   */
  private async collectionSlug(sellerId: string, title: string, exceptId?: string) {
    const base = (title || 'collection')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'collection';

    const taken = new Set(
      (await this.prisma.collection.findMany({
        where: { sellerId, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
        select: { slug: true },
      })).map((c) => c.slug),
    );

    if (!taken.has(base)) return base;
    for (let i = 2; i < 500; i++) {
      const next = `${base}-${i}`;
      if (!taken.has(next)) return next;
    }
    return `${base}-${Date.now()}`;
  }

  /** Only the seller's own products may go in their collections. */
  private async ownProductIds(sellerId: string, productIds: unknown): Promise<string[] | null> {
    if (!Array.isArray(productIds)) return null;
    const wanted = [...new Set(productIds.map(String))];
    if (!wanted.length) return [];
    const mine = await this.prisma.product.findMany({
      where: { id: { in: wanted }, sellerId },
      select: { id: true },
    });
    // Keep the order the seller sent — that's the display order.
    const allowed = new Set(mine.map((p) => p.id));
    return wanted.filter((id) => allowed.has(id));
  }

  async getCollections(sellerId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { sellerId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { items: { orderBy: { position: 'asc' }, select: { productId: true } } },
    });

    const ids = [...new Set(collections.flatMap((c) => c.items.map((i) => i.productId)))];
    const products = ids.length
      ? await this.prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, title: true, price: true, images: true, quantity: true, isActive: true },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));

    return collections.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      published: c.published,
      position: c.position,
      productIds: c.items.map((i) => i.productId),
      // Enough to render a row of thumbnails without a second request.
      products: c.items
        .map((i) => byId.get(i.productId))
        .filter(Boolean)
        .map((pr: any) => ({
          id: pr.id, title: pr.title, price: pr.price,
          // Images are stored as a JSON array string; the thumbnail is the first.
          image: safeParse(pr.images)[0] || null,
          inStock: pr.quantity > 0,
          isActive: pr.isActive,
        })),
    }));
  }

  async createCollection(sellerId: string, dto: any) {
    const title = String(dto?.title || '').trim();
    if (!title) throw new BadRequestException('Give the collection a name.');
    if (title.length > 60) throw new BadRequestException('That name is too long (60 characters max).');

    const productIds = (await this.ownProductIds(sellerId, dto?.productIds)) || [];
    const slug = await this.collectionSlug(sellerId, title);
    const last = await this.prisma.collection.findFirst({
      where: { sellerId }, orderBy: { position: 'desc' }, select: { position: true },
    });

    const created = await this.prisma.collection.create({
      data: {
        sellerId, title, slug,
        description: String(dto?.description || '').trim() || null,
        imageUrl: dto?.imageUrl || null,
        published: dto?.published !== false,
        position: (last?.position ?? -1) + 1,
        items: { create: productIds.map((productId, i) => ({ productId, position: i })) },
      },
    });
    return { id: created.id, slug: created.slug };
  }

  async updateCollection(sellerId: string, id: string, dto: any) {
    const existing = await this.prisma.collection.findFirst({ where: { id, sellerId } });
    if (!existing) throw new NotFoundException('Collection not found');

    const data: any = {};
    if (typeof dto?.title === 'string') {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Give the collection a name.');
      if (title.length > 60) throw new BadRequestException('That name is too long (60 characters max).');
      data.title = title;
      // Re-slug only on a real rename, so existing links keep working otherwise.
      if (title !== existing.title) data.slug = await this.collectionSlug(sellerId, title, id);
    }
    if (dto?.description !== undefined) data.description = String(dto.description || '').trim() || null;
    if (dto?.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;
    if (dto?.published !== undefined) data.published = !!dto.published;
    if (dto?.position !== undefined) data.position = Math.max(0, Math.round(Number(dto.position) || 0));

    const productIds = await this.ownProductIds(sellerId, dto?.productIds);

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.collection.update({ where: { id }, data });
      if (productIds) {
        // Replace membership wholesale — the editor sends the full list, and
        // diffing it here would only be a chance to get it wrong.
        await tx.collectionItem.deleteMany({ where: { collectionId: id } });
        if (productIds.length) {
          await tx.collectionItem.createMany({
            data: productIds.map((productId, i) => ({ collectionId: id, productId, position: i })),
          });
        }
      }
      const after = await tx.collection.findUnique({ where: { id }, select: { id: true, slug: true } });
      return after!;
    });
  }

  async deleteCollection(sellerId: string, id: string) {
    const existing = await this.prisma.collection.findFirst({ where: { id, sellerId }, select: { id: true } });
    if (!existing) throw new NotFoundException('Collection not found');
    // Items cascade; the products themselves are untouched.
    await this.prisma.collection.delete({ where: { id } });
    return { ok: true };
  }

  // ── coupons ──
  async getCoupons(sellerId: string) {
    const coupons = await this.prisma.coupon.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } });
    const now = Date.now();
    return coupons.map((c) => ({ ...c, expired: c.expiresAt ? c.expiresAt.getTime() < now : false }));
  }
  private optInt(v: any): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Math.round(Number(v));
    return isNaN(n) ? null : Math.max(0, n);
  }
  async createCoupon(sellerId: string, dto: any) {
    const code = String(dto.code || '').toUpperCase().trim();
    if (!code) throw new BadRequestException('Coupon code is required');
    try {
      return await this.prisma.coupon.create({
        data: {
          sellerId, code,
          type: dto.type === 'fixed' ? 'fixed' : 'percent',
          value: Math.max(0, Math.round(Number(dto.value) || 0)),
          maxDiscount: this.optInt(dto.maxDiscount),
          minOrder: this.optInt(dto.minOrder) ?? 0,
          usageLimit: this.optInt(dto.usageLimit),
          perCustomerLimit: this.optInt(dto.perCustomerLimit),
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          active: dto.active !== undefined ? !!dto.active : true,
        },
      });
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
    if (dto.maxDiscount !== undefined) data.maxDiscount = this.optInt(dto.maxDiscount);
    if (dto.minOrder !== undefined) data.minOrder = this.optInt(dto.minOrder) ?? 0;
    if (dto.usageLimit !== undefined) data.usageLimit = this.optInt(dto.usageLimit);
    if (dto.perCustomerLimit !== undefined) data.perCustomerLimit = this.optInt(dto.perCustomerLimit);
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.active !== undefined) data.active = !!dto.active;
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

    // Order stores a customerId but has no declared relation to Customer, so
    // attach the shopper's contact details in one extra query rather than N.
    const ids = [...new Set(orders.map((o) => o.customerId).filter(Boolean))] as string[];
    if (!ids.length) return orders.map((o) => ({ ...o, customer: null }));

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const byId = new Map(customers.map((c) => [c.id, c]));
    return orders.map((o) => ({ ...o, customer: (o.customerId && byId.get(o.customerId)) || null }));
  }

  /**
   * The three things the console shell needs: handle, logo, live-or-not.
   *
   * The sidebar was calling `getMe`, which returns the whole Seller row — and
   * logos, banners and storeConfig live in that row as base64/JSON. For one
   * store that was a 350KB transfer measured at 2.4s, on every single page
   * load, to render a nav bar. The logo is still included because the switcher
   * shows it; the banner and storeConfig are not.
   */
  async getSummary(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        username: true, storeName: true, logoUrl: true, published: true,
        // The signing-in email, because two stores can share a name, an owner
        // name and a logo — this is the only thing that always differs. The
        // login response doesn't carry it, so it has to come from here.
        user: { select: { email: true } },
      },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return { ...seller, email: seller.user?.email ?? null, user: undefined };
  }

  /**
   * Everything the dashboard renders, in one request.
   *
   * The page used to fire four calls at once. They queued behind each other on
   * a single high-latency link to Neon, so four ~550ms calls became four ~2.2s
   * calls that all landed together. Running them server-side in parallel means
   * one round trip for the browser and one connection for the database.
   */
  async getDashboard(sellerId: string) {
    const [orders, wallet, analytics, onboarding] = await Promise.all([
      this.getSellerOrders(sellerId),
      this.getWallet(sellerId),
      this.getAnalytics(sellerId),
      this.getOnboarding(sellerId),
    ]);
    return { orders, wallet, analytics, onboarding };
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
  /**
   * The seller's money, in four figures that add up.
   *
   *   lifetime  — everything ever earned on delivered orders, before payouts
   *   pending   — sold but not yet delivered, so not yet claimable (escrow)
   *   requested — withdrawal asked for, awaiting an admin decision
   *   settled   — approved and paid out
   *   available — lifetime minus settled minus requested: withdrawable now
   *
   * Each key is returned under both the name the dashboard uses and the name
   * the payments page uses. They were different, which is why "Pending" and
   * "Settled" on the payments screen read ₹0 no matter how much had sold —
   * the page was reading keys the API never sent.
   *
   * The seller receives goods (net of their own coupon discounts) plus
   * shipping; Loopy's fee is charged to the customer on top and so is never
   * deducted here. See common/money.
   */
  async getWallet(sellerId: string) {
    const [orders, payouts] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId },
        select: { status: true, itemsAmount: true, shippingCharge: true, discountAmount: true },
      }),
      this.prisma.payout.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const pending = sellerReceivableOf(orders.filter((o) => ['Paid', 'Accepted', 'Shipped'].includes(o.status)));
    const lifetime = sellerReceivableOf(orders.filter((o) => ['Delivered', 'Completed'].includes(o.status)));

    const settled = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const requested = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0);
    // Money already requested is in flight: it is neither withdrawable again
    // nor settled yet. Leaving it in `available` would let a seller request
    // the same rupees twice and make the three cards overlap.
    const available = Math.max(0, lifetime - settled - requested);

    return {
      available,
      lifetime,
      pending,
      settled,
      requested,
      // Legacy aliases — the dashboard reads these two.
      held: pending,
      paidOut: settled,
      payouts,
    };
  }

  /**
   * Raise a payout request for everything currently available.
   *
   * A seller with one request already open cannot raise another: `available`
   * is computed from delivered orders minus payouts already *paid*, so an
   * open request is not yet deducted, and a second click would ask for the
   * same money twice. Returning the existing request makes a double submit
   * harmless rather than expensive.
   */
  async requestPayout(sellerId: string) {
    const open = await this.prisma.payout.findFirst({
      where: { sellerId, status: 'requested' },
      orderBy: { createdAt: 'desc' },
    });
    if (open) {
      return { ok: true, payout: open, alreadyRequested: true,
        message: 'You already have a payout request being processed.' };
    }

    const { available } = await this.getWallet(sellerId);
    if (available <= 0) return { ok: false, message: 'No funds available yet' };
    const payout = await this.prisma.payout.create({
      data: { sellerId, amount: available, status: 'requested' },
    });
    return { ok: true, payout };
  }
}
