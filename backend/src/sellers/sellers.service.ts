import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { COMMISSION_PCT, FEE_FLAT, FEE_FLAT_BELOW, sellerReceivableOf } from '../common/money';
import { releasedOrderIds } from '../common/funds';
import { toCsv } from '../common/csv';
import { groupByBucket, istDateTime, parseRange, rangeSlug } from '../common/date-range';

const PAID = ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'];

const SELLER_EXPORTS = ['orders', 'summary', 'payouts', 'products'] as const;

/**
 * How a stored `paymentId` reads in a spreadsheet.
 *
 * `online:<method>` on its own is the method the buyer chose, written when the
 * order was created — only a confirmed payment appends the transaction id, so
 * a bare value means no money arrived. Same rule as the order screens.
 */
function payLabel(paymentId: string | null) {
  const p = String(paymentId || '');
  if (p === 'cod') return 'Cash on delivery';
  if (/^online:[^:]+:.+/.test(p)) return `Paid online (${(p.split(':')[1] || '').toUpperCase()})`;
  if (p.startsWith('online')) return 'Not confirmed';
  return p || '—';
}

/** The gateway's transaction id and UTR, when there is a real payment. */
function payReference(paymentId: string | null) {
  const parts = String(paymentId || '').split(':');
  return parts.length > 2 ? parts.slice(2).join(' · ') : '';
}

/**
 * Just enough of a Prisma client to read the wallet, so the same code can run
 * against `this.prisma` or a transaction client without either being widened.
 */
type PrismaClientLike = {
  order: { findMany: (args: any) => Promise<any[]> };
  payout: { findMany: (args: any) => Promise<any[]> };
  auditLog: { findMany: (args: any) => Promise<any[]> };
};

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
      platformFeePct: COMMISSION_PCT,
      /*
       * The whole fee rule, not just the rate. Checkout has to show the total
       * it will actually be charged, and a client that knew only the
       * percentage would quote a rupee on a small order and then charge five.
       */
      platformFee: { pct: COMMISSION_PCT, flat: FEE_FLAT, flatBelow: FEE_FLAT_BELOW },
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
    // Orders that exist as far as the seller is concerned. A checkout still
    // waiting for payment is neither an order nor a customer yet, and counting
    // it made the dashboard disagree with the (now filtered) orders queue.
    const real = orders.filter((o) => o.status !== 'PendingPayment');
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
      orders: real.length,
      paidOrders: paid.length,
      customers: new Set(real.map((o) => o.buyerId || o.buyerPhone || o.buyerName).filter(Boolean)).size,
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

  /**
   * The seller's order queue — everything except orders still waiting to be
   * paid for.
   *
   * An unpaid order is not a sale. It is a checkout someone started, and it
   * disappears again if they abandon it, so showing it here gave the seller a
   * row with nothing to do ("No further action while this order is
   * PendingPayment"), counted it in their totals, and would have had them
   * packing goods nobody had paid for. It becomes visible the moment the
   * payment is confirmed.
   *
   * Admins still see unpaid orders — that is where a payment that arrived but
   * was not recorded gets sorted out.
   */
  /**
   * A seller's own data as CSV, for a period.
   *
   * Every query filters on `sellerId`, so no dataset can reach another store's
   * rows. Built on the same helpers as the admin exports (common/csv and
   * common/date-range) — Excel-safe quoting and encoding, and IST day
   * boundaries rather than the server's.
   *
   * The platform fee has no column here on purpose: the buyer is charged it on
   * top and it never reaches the seller, so the figure that belongs in their
   * spreadsheet is what they receive.
   */
  async exportData(sellerId: string, dataset: string, from?: string, to?: string) {
    if (!(SELLER_EXPORTS as readonly string[]).includes(dataset)) {
      throw new BadRequestException(`Unknown export "${dataset}". Choose one of: ${SELLER_EXPORTS.join(', ')}.`);
    }

    const earliest = from === 'all'
      ? (await this.prisma.order.findFirst({ where: { sellerId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }))?.createdAt
      : null;
    const range = parseRange(from, to, { defaultDays: 30, earliest });
    const period = { gte: range.start, lt: range.end };
    let headers: string[] = [];
    let rows: unknown[][] = [];

    if (dataset === 'orders') {
      // Unpaid checkouts are left out for the same reason they are kept off the
      // orders screen: they are not sales, and half of them never will be.
      const orders = await this.prisma.order.findMany({
        where: { sellerId, createdAt: period, status: { not: 'PendingPayment' } },
        orderBy: { createdAt: 'asc' },
        include: { items: { select: { title: true, quantity: true } } },
      });
      headers = [
        'Order ID', 'Placed (IST)', 'Status', 'Customer', 'Phone', 'Items', 'Units',
        'Items total (₹)', 'Discount (₹)', 'Coupon', 'Shipping (₹)', 'You receive (₹)',
        'Payment', 'Payment reference', 'Courier', 'Tracking number',
      ];
      rows = orders.map((o) => [
        o.id, istDateTime(o.createdAt), o.status, o.buyerName, o.buyerPhone,
        o.items.map((i) => `${i.title} × ${i.quantity}`).join('; '),
        o.items.reduce((n, i) => n + i.quantity, 0),
        o.itemsAmount, o.discountAmount || 0, o.couponCode, o.shippingCharge,
        sellerReceivableOf([o]), payLabel(o.paymentId), payReference(o.paymentId),
        o.courier, o.awbNumber,
      ]);
    } else if (dataset === 'summary') {
      const orders = await this.prisma.order.findMany({
        where: { sellerId, createdAt: period, status: { not: 'PendingPayment' } },
        select: {
          status: true, itemsAmount: true, shippingCharge: true, discountAmount: true,
          buyerId: true, buyerName: true, buyerPhone: true, createdAt: true,
        },
      });
      // The total's Customers is a distinct count across the whole period, not
      // the sum of the column — one shopper ordering on three days is one
      // customer.
      const line = (label: string, os: typeof orders) => {
        const paid = os.filter((o) => PAID.includes(o.status));
        return [
          label,
          os.length,
          paid.length,
          os.filter((o) => ['Delivered', 'Completed'].includes(o.status)).length,
          os.filter((o) => o.status === 'Cancelled').length,
          paid.reduce((n, o) => n + o.itemsAmount, 0),
          paid.reduce((n, o) => n + (o.discountAmount || 0), 0),
          paid.reduce((n, o) => n + o.shippingCharge, 0),
          sellerReceivableOf(paid),
          new Set(os.map((o) => o.buyerId || o.buyerPhone || o.buyerName || 'guest')).size,
        ];
      };
      headers = [
        range.bucket === 'day' ? 'Date' : 'Month', 'Orders', 'Paid', 'Delivered', 'Cancelled',
        'Items total (₹)', 'Discounts (₹)', 'Shipping (₹)', 'You receive (₹)', 'Customers',
      ];
      rows = groupByBucket(orders, range).map(({ bucket, rows: os }) => line(bucket.key, os));
      rows.push(line('Total', orders));
    } else if (dataset === 'payouts') {
      const payouts = await this.prisma.payout.findMany({
        where: { sellerId, createdAt: period },
        orderBy: { createdAt: 'asc' },
      });
      headers = ['Payout ID', 'Requested (IST)', 'Amount (₹)', 'Status', 'Decided (IST)', 'Reference / reason'];
      rows = payouts.map((x) => [
        x.id, istDateTime(x.createdAt), x.amount,
        x.status === 'paid' ? 'Paid' : x.status === 'rejected' ? 'Rejected' : 'Awaiting approval',
        istDateTime(x.decidedAt), x.note,
      ]);
    } else {
      const [products, items] = await Promise.all([
        this.prisma.product.findMany({
          where: { sellerId },
          orderBy: { createdAt: 'asc' },
          // Explicit select: the row also holds base64 images, which have no
          // place in a spreadsheet and would make this enormous.
          select: { id: true, title: true, category: true, price: true, quantity: true, isActive: true, createdAt: true },
        }),
        this.prisma.orderItem.findMany({
          where: { order: { sellerId, createdAt: period, status: { in: PAID } } },
          select: { productId: true, quantity: true, unitPrice: true },
        }),
      ]);
      const sold = new Map<string, { units: number; value: number }>();
      for (const it of items) {
        const acc = sold.get(it.productId) || { units: 0, value: 0 };
        acc.units += it.quantity;
        acc.value += it.unitPrice * it.quantity;
        sold.set(it.productId, acc);
      }
      headers = [
        'Product ID', 'Title', 'Category', 'Price (₹)', 'Stock', 'Listed', 'Created (IST)',
        'Units sold (period)', 'Sales value (period) (₹)',
      ];
      rows = products.map((pr) => [
        pr.id, pr.title, pr.category, pr.price, pr.quantity, pr.isActive, istDateTime(pr.createdAt),
        sold.get(pr.id)?.units || 0, sold.get(pr.id)?.value || 0,
      ]);
    }

    return { filename: `loopy-${dataset}_${rangeSlug(range)}.csv`, csv: toCsv(headers, rows), rows: rows.length };
  }

  async getSellerOrders(sellerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { sellerId, status: { not: 'PendingPayment' } },
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
    return this.walletOn(this.prisma, sellerId);
  }

  /**
   * The wallet figures, computed against a given client.
   *
   * Takes the client as an argument so `requestPayout` can recompute the same
   * numbers inside its transaction. Two copies of this arithmetic is how a
   * balance starts disagreeing with itself, so there is only ever one.
   */
  private async walletOn(db: PrismaClientLike, sellerId: string) {
    const [orders, payouts] = await Promise.all([
      db.order.findMany({
        where: { sellerId },
        select: { id: true, status: true, itemsAmount: true, shippingCharge: true, discountAmount: true },
      }),
      db.payout.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } }),
    ]);

    /*
     * Withdrawable money is released money, not delivered money.
     *
     * An order stays in escrow even after the seller marks it delivered, until
     * an admin releases it (see common/funds). Delivery is the seller's own
     * word for what happened; release is Loopy's, and the balance answers to
     * that one. Previously the two were the same event, so a seller could make
     * their own money withdrawable the moment they pressed "delivered".
     */
    const earning = orders.filter((o) => PAID.includes(o.status));
    const released = await releasedOrderIds(db, earning.map((o) => o.id));
    const pending = sellerReceivableOf(earning.filter((o) => !released.has(o.id)));
    const releasedTotal = sellerReceivableOf(earning.filter((o) => released.has(o.id)));
    // Earned either way — what this seller has actually sold and delivered.
    const delivered = orders.filter((o) => ['Delivered', 'Completed'].includes(o.status));
    const lifetime = sellerReceivableOf(delivered);
    /*
     * The value of the goods alone, net of the seller's own coupons.
     *
     * `lifetime` is what reaches their wallet, which includes the shipping
     * they collect and hand to a courier — so it reads higher than what they
     * sold. The dashboard's headline answers "how much have I sold", and that
     * is this figure.
     */
    const goods = delivered.reduce((t, o) => t + Math.max(0, (o.itemsAmount || 0) - (o.discountAmount || 0)), 0);

    const settled = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const requested = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0);
    // Money already requested is in flight: it is neither withdrawable again
    // nor settled yet. Leaving it in `available` would let a seller request
    // the same rupees twice and make the three cards overlap.
    const available = Math.max(0, releasedTotal - settled - requested);

    return {
      available,
      /** Released by Loopy, before payouts are taken off. */
      released: releasedTotal,
      lifetime,
      /** Goods value of everything delivered, excluding shipping. */
      goods,
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
   * This used to refuse outright if any request was already open, on the
   * stated grounds that `available` did not deduct open requests and a second
   * click would ask for the same money twice. That has not been true since
   * `walletOn` started subtracting `requested` as well as `settled` — so the
   * guard was blocking a legitimate and ordinary case: an order is delivered
   * and requested, another is delivered the next day, and the seller cannot
   * touch it until an admin gets round to the first request. It reported
   * "already requested" while the newly available money sat there.
   *
   * The row lock is what makes dropping it safe. The real hazard was never a
   * second considered click but two arriving together: both read the same
   * `available`, both create a request for it, and the seller has asked for
   * the same rupees twice. Locking the seller row serialises them, so the
   * second recomputes after the first has committed and finds nothing left.
   */
  async requestPayout(sellerId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Held only for the few milliseconds this transaction runs. Nothing
      // else in the app takes this lock, so it contends with nothing but
      // another payout request for the same seller — which is the point.
      await tx.$queryRaw`SELECT id FROM "Seller" WHERE id = ${sellerId} FOR UPDATE`;

      const { available, requested } = await this.walletOn(tx, sellerId);

      if (available <= 0) {
        // Distinguish the two reasons there is nothing to request: everything
        // is already in flight, or nothing has been delivered yet. The old
        // single "No funds available yet" was wrong in the first case and the
        // seller had no way to tell which they were looking at.
        return requested > 0
          ? { ok: false, reason: 'all-requested' as const,
              message: `Your whole available balance (${requested}) is already awaiting approval.` }
          : { ok: false, reason: 'no-funds' as const,
              message: 'No funds available yet — money is released once an order is delivered.' };
      }

      const payout = await tx.payout.create({
        data: { sellerId, amount: available, status: 'requested' },
      });
      return { ok: true as const, payout, amount: available };
    }, {
      /*
       * Prisma's 5s default is too tight for this database. The lock, two
       * reads and the insert are four round trips to a Neon compute in
       * us-east-2, ~300ms each from India, and a cold compute spends about
       * 2.6s waking up on the first one — so a seller unlucky enough to be
       * the first request after an idle period could trip the default and see
       * a failure that was pure latency. Contention is only ever between two
       * payout requests from the same seller, so a longer hold costs nothing.
       */
      timeout: 20_000,
      maxWait: 10_000,
    });
  }
}
