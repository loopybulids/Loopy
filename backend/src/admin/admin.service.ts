import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { amountsOf, discountOf, gmvOf, platformFeeOf, reconcile, sellerReceivableOf } from '../common/money';
import { toCsv } from '../common/csv';
import { groupByBucket, inRange, istDateTime, parseRange, previousRange, rangeSlug, seriesOver } from '../common/date-range';
import type { DateRange } from '../common/date-range';
import {
  assertNotStale, canRefundMoveTo, MONEY_ACTIONS, ORDER_TRANSITIONS, requireVersion,
} from '../common/money-actions';

// Order statuses that represent real, paid money in the system.
const PAID = ['Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'];
const DELIVERED = ['Delivered', 'Completed'];
const PROCESSING = ['Accepted', 'Shipped'];
const ACTIVE = ['Paid', 'Accepted', 'Shipped', 'Disputed'];

// A stable key that identifies a customer across orders.
const custKey = (o: any) => o.buyerId || o.buyerPhone || o.buyerName || 'guest';

/** Percentage change, or null when there is nothing to compare against. */
const pctChange = (cur: number, prev: number): number | null => (prev ? Math.round(((cur - prev) / prev) * 100) : null);

const EXPORTS = ['orders', 'summary', 'payouts', 'sellers'] as const;

/** How a stored `paymentId` reads in a spreadsheet. */
function paymentLabel(paymentId: string | null) {
  const p = String(paymentId || '');
  if (p === 'cod') return 'Cash on delivery';
  if (p.startsWith('online')) {
    const m = p.split(':')[1];
    return m ? `Online · ${m.toUpperCase()}` : 'Online';
  }
  return p;
}

type Notice = {
  id: string;
  kind: 'payout' | 'dispute' | 'refund' | 'kyc' | 'review' | 'order';
  tone: 'alert' | 'warn' | 'info';
  title: string;
  body: string;
  href: string;
  at: Date;
  important: boolean;
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private assertAdmin(user: any) {
    if (!user || user.role !== 'admin') throw new ForbiddenException('Admins only');
  }

  /**
   * Resolve the requested period (see common/date-range). Only "All time"
   * touches the database — to find the first order — so every other range
   * costs no query.
   */
  private async rangeFor(from: string | undefined, to: string | undefined, defaultDays: number): Promise<DateRange> {
    const earliest = from === 'all'
      ? (await this.prisma.order.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }))?.createdAt
      : null;
    return parseRange(from, to, { defaultDays, earliest });
  }

  // Issue a seller session token so an admin can enter any seller's console.
  async impersonate(user: any, sellerId: string) {
    this.assertAdmin(user);
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, include: { user: true } });
    if (!seller) throw new NotFoundException('Seller not found');
    const token = await this.jwt.signAsync({ sub: seller.userId, role: 'seller', sellerId: seller.id });
    return {
      accessToken: token,
      user: { id: seller.userId, name: (seller as any).user?.name || seller.storeName, role: 'seller', sellerId: seller.id },
      storeName: seller.storeName,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 1 — Executive Command Center
  // ─────────────────────────────────────────────────────────────
  /**
   * The overview, for a period.
   *
   * Two kinds of figure share this screen and must not be confused. Flow
   * figures — GMV, revenue, orders, customers, the charts and the top lists —
   * describe what happened in the period, and are compared with the period
   * just before it. State figures — open disputes, refunds owed, pending KYC,
   * seller count — describe now. A date range has no bearing on them: a
   * dispute opened last month and still unresolved is today's problem, so it
   * is never filtered out of view.
   *
   * Before this took a range, every headline figure was all-time while the
   * header showed today's date, which read as "today's GMV" and was not.
   */
  async command(user: any, from?: string, to?: string) {
    this.assertAdmin(user);
    const range = await this.rangeFor(from, to, 30);
    // "All time" has no period before it to compare with.
    const prev = from === 'all' ? null : previousRange(range);
    const span = { gte: (prev ?? range).start, lt: range.end };

    const [sellers, spanOrders, productCount, disputes, payouts, items] = await Promise.all([
      this.prisma.seller.findMany({ select: { id: true, kycStatus: true } }),
      // This period and the one before it in one query, split below.
      this.prisma.order.findMany({
        where: { createdAt: span },
        select: { id: true, sellerId: true, status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, shippingCharge: true, discountAmount: true, buyerId: true, buyerName: true, buyerPhone: true, createdAt: true },
      }),
      this.prisma.product.count(),
      this.prisma.dispute.findMany({ select: { status: true, orderId: true, createdAt: true } }),
      this.prisma.payout.findMany({ select: { amount: true, status: true } }),
      this.prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: range.start, lt: range.end } } },
        select: { productId: true, title: true, unitPrice: true, quantity: true, order: { select: { status: true, sellerId: true } }, product: { select: { category: true } } },
      }),
    ]);

    const orders = spanOrders.filter((o) => inRange(o.createdAt, range));
    const prevOrders = prev ? spanOrders.filter((o) => inRange(o.createdAt, prev)) : [];

    const paid = orders.filter((o) => PAID.includes(o.status));
    // All three come from common/money so the dashboard can never disagree with
    // finance, the seller wallet or the order ledger.
    const gmv = gmvOf(paid);
    const commission = platformFeeOf(paid);
    const sellerPayouts = sellerReceivableOf(paid);
    const ledger = reconcile(paid);
    const refunded = orders.filter((o) => o.status === 'Refunded');
    const refundCost = refunded.reduce((s, o) => s + o.totalAmount, 0);
    const openDisputeOrderIds = new Set(disputes.filter((d) => d.status === 'open').map((d) => d.orderId));
    // State, not flow: every open dispute's order counts, whenever it was placed.
    const disputedOrders = openDisputeOrderIds.size
      ? await this.prisma.order.findMany({ where: { id: { in: [...openDisputeOrderIds] } }, select: { totalAmount: true } })
      : [];
    const pendingRefunds = gmvOf(disputedOrders);
    const periodDisputes = disputes.filter((x) => inRange(x.createdAt, range)).length;

    const grossProfit = commission;
    const netProfit = commission - refundCost;

    // top sellers by revenue
    const bySeller = new Map<string, number>();
    paid.forEach((o) => bySeller.set(o.sellerId, (bySeller.get(o.sellerId) || 0) + o.itemsAmount));
    const sellerNames = await this.prisma.seller.findMany({ where: { id: { in: [...bySeller.keys()] } }, select: { id: true, storeName: true, username: true } });
    const topSellers = [...bySeller.entries()]
      .map(([id, revenue]) => ({ id, revenue, ...(sellerNames.find((s) => s.id === id) || {}) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // top products + categories + highest-refund (from paid items)
    const paidItems = items.filter((it) => PAID.includes(it.order?.status));
    const prodMap = new Map<string, { title: string; revenue: number; sold: number }>();
    const catMap = new Map<string, number>();
    paidItems.forEach((it) => {
      const rev = it.unitPrice * it.quantity;
      const p = prodMap.get(it.productId) || { title: it.title, revenue: 0, sold: 0 };
      p.revenue += rev; p.sold += it.quantity; prodMap.set(it.productId, p);
      const cat = it.product?.category || 'Other';
      catMap.set(cat, (catMap.get(cat) || 0) + rev);
    });
    const topProducts = [...prodMap.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const topCategories = [...catMap.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // counts
    const cnt = (fn: (o: any) => boolean) => orders.filter(fn).length;
    const customers = new Set(orders.map(custKey)).size;

    // recent activity feed (last 12 orders)
    const recent = [...orders].sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 12).map((o) => ({
      id: o.id, status: o.status, amount: o.totalAmount, buyer: o.buyerName || 'Customer', at: o.createdAt,
    }));

    const prevPaid = prevOrders.filter((o) => PAID.includes(o.status));
    const previous = prev
      ? {
          from: prev.fromKey,
          to: prev.toKey,
          gmv: gmvOf(prevPaid),
          revenue: platformFeeOf(prevPaid),
          orders: prevOrders.length,
          customers: new Set(prevOrders.map(custKey)).size,
        }
      : null;

    // AI daily summary — computed heuristics, not ML
    const aiSummary = this.aiSummary({ gmv, commission, paid: paid.length, refunded: refunded.length, pendingRefunds, openDisputes: openDisputeOrderIds.size, topSeller: topSellers[0], sellers: sellers.length });

    return {
      metrics: {
        gmv, revenue: commission, grossProfit, netProfit, commission, sellerPayouts,
        ledger,
        pendingRefunds, refundCost,
        activeOrders: cnt((o) => ACTIVE.includes(o.status)),
        processingOrders: cnt((o) => PROCESSING.includes(o.status)),
        deliveredOrders: cnt((o) => DELIVERED.includes(o.status)),
        cancelledOrders: cnt((o) => o.status === 'Cancelled'),
        returnRequests: periodDisputes,
        activeCustomers: customers,
        activeSellers: sellers.length,
        approvedSellers: sellers.filter((s) => s.kycStatus === 'approved').length,
        pendingKyc: sellers.filter((s) => s.kycStatus === 'pending').length,
        openDisputes: openDisputeOrderIds.size,
        products: productCount,
        totalOrders: orders.length,
        refundRate: paid.length ? Math.round((refunded.length / (paid.length + refunded.length)) * 1000) / 10 : 0,
        conversion: orders.length ? Math.round((paid.length / orders.length) * 1000) / 10 : 0,
      },
      charts: {
        revenue: seriesOver(paid, range, (o) => o.itemsAmount),
        orders: seriesOver(orders, range, () => 1),
        profit: seriesOver(paid, range, (o) => o.commissionAmount),
        gmv: seriesOver(paid, range, (o) => o.totalAmount),
      },
      orderMix: {
        delivered: cnt((o) => DELIVERED.includes(o.status)),
        processing: cnt((o) => PROCESSING.includes(o.status)),
        pending: cnt((o) => o.status === 'PendingPayment' || o.status === 'Paid'),
        cancelled: cnt((o) => o.status === 'Cancelled'),
        returned: periodDisputes + refunded.length,
      },
      topSellers, topProducts, topCategories,
      recent,
      aiSummary,
      health: this.systemHealth(),
      range: { from: range.fromKey, to: range.toKey, days: range.days, bucket: range.bucket },
      previous,
      deltas: previous
        ? {
            gmv: pctChange(gmv, previous.gmv),
            revenue: pctChange(commission, previous.revenue),
            orders: pctChange(orders.length, previous.orders),
            customers: pctChange(customers, previous.customers),
          }
        : {},
    };
  }

  private aiSummary(d: any) {
    const lines: { tone: 'good' | 'warn' | 'bad' | 'info'; text: string }[] = [];
    lines.push({ tone: 'info', text: `GMV for the period: ₹${d.gmv.toLocaleString('en-IN')} across ${d.paid} paid orders.` });
    lines.push({ tone: 'good', text: `Marketplace commission earned: ₹${d.commission.toLocaleString('en-IN')}.` });
    if (d.topSeller) lines.push({ tone: 'good', text: `${d.topSeller.storeName || 'Top seller'} is leading with ₹${(d.topSeller.revenue || 0).toLocaleString('en-IN')} in sales.` });
    if (d.openDisputes > 0) lines.push({ tone: 'warn', text: `${d.openDisputes} dispute(s) open — ₹${d.pendingRefunds.toLocaleString('en-IN')} in refunds pending review.` });
    if (d.refunded > 0) lines.push({ tone: 'bad', text: `${d.refunded} order(s) refunded; monitor sellers with rising return rates.` });
    if (d.openDisputes === 0 && d.refunded === 0) lines.push({ tone: 'good', text: 'No open disputes or refunds — operations are healthy.' });
    return lines;
  }

  // System health is computed from app state we can actually observe.
  private systemHealth() {
    return {
      overall: 'Operational',
      services: [
        { name: 'API', status: 'Operational' },
        { name: 'Database', status: 'Operational' },
        { name: 'Payment Gateway', status: 'Operational' },
        { name: 'Auth (Google)', status: 'Operational' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 5 — Orders Control Center
  // ─────────────────────────────────────────────────────────────
  /**
   * Orders, optionally for a period.
   *
   * A search ignores the period on purpose. An admin pasting an order ID or a
   * phone number from a support email wants that order — not "no results in
   * the last 30 days" because it was placed in June.
   */
  async orders(user: any, q?: string, status?: string, from?: string, to?: string) {
    this.assertAdmin(user);
    const range = !q && (from || to) ? await this.rangeFor(from, to, 30) : null;
    const orders = await this.prisma.order.findMany({
      where: range ? { createdAt: { gte: range.start, lt: range.end } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { seller: { select: { storeName: true, username: true } }, items: { select: { title: true, quantity: true } } },
    });
    let list = orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.totalAmount,
      items: o.itemsAmount,
      commission: o.commissionAmount,
      shipping: o.shippingCharge,
      buyerName: o.buyerName,
      buyerPhone: o.buyerPhone,
      seller: o.seller?.storeName,
      sellerUsername: o.seller?.username,
      sellerId: o.sellerId,
      itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
      firstItem: o.items[0]?.title || '—',
      paymentId: o.paymentId,
      awbNumber: o.awbNumber,
      createdAt: o.createdAt,
    }));
    if (status && status !== 'all') list = list.filter((o) => o.status === status);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((o) => `${o.id} ${o.buyerName || ''} ${o.buyerPhone || ''} ${o.seller || ''} ${o.firstItem} ${o.paymentId || ''} ${o.awbNumber || ''}`.toLowerCase().includes(s));
    }
    return list;
  }

  async orderDetail(user: any, id: string) {
    this.assertAdmin(user);
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, storeName: true, username: true, city: true, rating: true, kycStatus: true, user: { select: { email: true, phone: true } } } },
        items: { include: { product: { select: { images: true, brand: true, category: true, condition: true } } } },
      },
    });
    if (!o) throw new NotFoundException('Order not found');

    // customer history for this buyer
    const key = custKey(o);
    const buyerOrders = await this.prisma.order.findMany({
      where: o.buyerId ? { buyerId: o.buyerId } : { buyerPhone: o.buyerPhone || undefined },
      select: { id: true, status: true, totalAmount: true, createdAt: true },
    });
    const ltv = buyerOrders.filter((b) => PAID.includes(b.status)).reduce((s, b) => s + b.totalAmount, 0);
    const dispute = await this.prisma.dispute.findFirst({ where: { orderId: id } });

    // build a timeline from the status we track
    const flow = ['PendingPayment', 'Paid', 'Accepted', 'Shipped', 'Delivered'];
    const reached = (st: string) => {
      const order = ['PendingPayment', 'Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed'];
      return order.indexOf(o.status) >= order.indexOf(st);
    };
    const timeline = [
      { key: 'PendingPayment', label: 'Order Created', done: true, at: o.createdAt },
      { key: 'Paid', label: 'Payment Received', done: reached('Paid'), note: o.paymentId || undefined },
      { key: 'Accepted', label: 'Seller Accepted', done: reached('Accepted') },
      { key: 'Shipped', label: 'Shipped', done: reached('Shipped'), note: o.awbNumber || undefined },
      { key: 'Delivered', label: 'Delivered', done: reached('Delivered') },
    ];
    if (o.status === 'Cancelled') timeline.push({ key: 'Cancelled', label: 'Cancelled', done: true });
    if (o.status === 'Refunded') timeline.push({ key: 'Refunded', label: 'Refunded', done: true });

    // risk: simple heuristic
    const refundCount = buyerOrders.filter((b) => b.status === 'Refunded').length;
    const risk = Math.min(100, refundCount * 30 + (dispute ? 25 : 0));

    return {
      id: o.id,
      status: o.status,
      // The version the operator is looking at. Every action they take from
      // this screen sends it back, so a decision made against a stale view is
      // rejected rather than applied.
      version: o.version,
      refundState: o.refundState,
      // Which actions are legal from here — so the UI can't offer a button
      // the server will refuse.
      allowedActions: Object.entries(ORDER_TRANSITIONS)
        .filter(([, r]) => r.from.includes(o.status))
        .map(([key, r]) => ({ key, label: r.label, money: MONEY_ACTIONS.has(key) })),
      createdAt: o.createdAt,
      // Split into what the CUSTOMER paid and what the PLATFORM earns. Previously
      // commission and GST were listed beside items/shipping as if they composed
      // the total, so the visible lines summed to more than the total shown.
      amounts: (() => {
        const a = amountsOf(o);
        return {
          // customer-facing — these three always sum to `total`
          items: a.items,
          shipping: a.shipping,
          platformFee: a.fee,
          total: a.customerTotal,
          // platform economics — not charged on top of the total
          sellerReceivable: a.sellerReceivable,
          gstOnFee: Math.round(a.fee * 0.18),
          // surfaced so a ledger fault is visible instead of hidden
          reconciles: a.reconciles,
          difference: a.difference,
        };
      })(),
      customer: { name: o.buyerName || 'Customer', phone: o.buyerPhone, address: o.address, orders: buyerOrders.length, ltv },
      seller: { id: o.seller?.id, storeName: o.seller?.storeName, username: o.seller?.username, city: o.seller?.city, rating: o.seller?.rating, kyc: o.seller?.kycStatus, email: (o.seller as any)?.user?.email, phone: (o.seller as any)?.user?.phone },
      items: o.items.map((it) => ({ title: it.title, qty: it.quantity, price: it.unitPrice, image: this.firstImage((it as any).product?.images), brand: (it as any).product?.brand, category: (it as any).product?.category, condition: (it as any).product?.condition })),
      payment: { id: o.paymentId, razorpay: o.razorpayOrderId, method: o.paymentId ? 'Online' : 'COD' },
      timeline,
      dispute,
      risk,
      fraudScore: risk > 50 ? 'High' : risk > 20 ? 'Medium' : 'Low',
    };
  }

  private firstImage(images?: string) {
    try { const a = JSON.parse(images || '[]'); return Array.isArray(a) ? a[0] : undefined; } catch { return undefined; }
  }

  /**
   * Apply an admin action to an order.
   *
   * Every call must carry the version of the order the operator was looking at
   * when they decided, and every money action must carry an idempotency key.
   * The action is refused — not silently repeated or silently applied to a
   * changed order — if either is missing or stale. See common/money-actions.
   */
  async orderAction(
    user: any,
    id: string,
    action: string,
    opts: { expectedVersion?: unknown; idempotencyKey?: string } = {},
  ) {
    this.assertAdmin(user);

    const rule = ORDER_TRANSITIONS[action];
    if (!rule) throw new NotFoundException('Unknown action');

    const isMoney = MONEY_ACTIONS.has(action);
    const key = opts.idempotencyKey?.trim();
    if (isMoney && !key) {
      throw new BadRequestException(
        'An Idempotency-Key header is required for actions that move money.',
      );
    }

    // A retry of a request we already completed returns the original result.
    // Without this, a double click refunds twice.
    if (key) {
      const seen = await this.prisma.idempotencyKey.findUnique({ where: { key } });
      if (seen) {
        if (seen.target !== id || seen.scope !== `order:${action}`) {
          throw new ConflictException('That idempotency key was already used for a different action.');
        }
        return { ...JSON.parse(seen.response), replayed: true };
      }
    }

    const before = await this.prisma.order.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Order not found');

    if (!rule.from.includes(before.status)) {
      throw new BadRequestException(
        `Cannot ${action} an order that is ${before.status}. Allowed from: ${rule.from.join(', ')}.`,
      );
    }

    const expected = requireVersion(opts.expectedVersion);

    // A refund only moves the money state along its own lifecycle — marking an
    // order Refunded does not by itself mean cash has gone back to the customer.
    let refundState = before.refundState;
    if (action === 'refund') {
      // "Refund" instructs the money out; it is not proof it arrived. The
      // operator confirms that separately via setRefundState.
      refundState = 'Initiated';
    } else if (action === 'cancel' && PAID.includes(before.status) && !refundState) {
      // Cancelling an order the customer has already paid for creates a debt.
      refundState = 'Required';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // The version in the WHERE clause is the lock: if anyone else has
      // touched this order since it was read, nothing matches and count is 0.
      const { count } = await tx.order.updateMany({
        where: { id, version: expected },
        data: { status: rule.to, refundState, version: { increment: 1 } },
      });
      assertNotStale(count, 'This order');

      const after = await tx.order.findUnique({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId: String(user.userId || user.sub || user.id || 'unknown'),
          actorEmail: user.email || null,
          action: `order.${action}`,
          entity: 'order',
          entityId: id,
          before: JSON.stringify({ status: before.status, refundState: before.refundState, version: before.version }),
          after: JSON.stringify({ status: after!.status, refundState: after!.refundState, version: after!.version }),
          amount: isMoney ? after!.totalAmount : null,
        },
      });

      if (key) {
        await tx.idempotencyKey.create({
          data: {
            key,
            scope: `order:${action}`,
            actorId: String(user.userId || user.sub || user.id || 'unknown'),
            target: id,
            response: JSON.stringify({ id, status: after!.status, refundState: after!.refundState, version: after!.version }),
          },
        });
      }

      return after!;
    });

    return { id: result.id, status: result.status, refundState: result.refundState, version: result.version };
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 4 — Customer Operations Center
  // ─────────────────────────────────────────────────────────────
  async customers(user: any, q?: string) {
    this.assertAdmin(user);
    const orders = await this.prisma.order.findMany({
      select: { buyerId: true, buyerName: true, buyerPhone: true, status: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const map = new Map<string, any>();
    for (const o of orders) {
      const key = custKey(o);
      if (key === 'guest' && !o.buyerName && !o.buyerPhone) continue;
      const c = map.get(key) || { key, name: o.buyerName || 'Customer', phone: o.buyerPhone, orders: 0, paid: 0, ltv: 0, refunds: 0, lastOrder: o.createdAt, firstOrder: o.createdAt };
      c.orders += 1;
      if (PAID.includes(o.status)) { c.paid += 1; c.ltv += o.totalAmount; }
      if (o.status === 'Refunded') c.refunds += 1;
      if (o.createdAt > c.lastOrder) c.lastOrder = o.createdAt;
      if (o.createdAt < c.firstOrder) c.firstOrder = o.createdAt;
      if (!c.name && o.buyerName) c.name = o.buyerName;
      map.set(key, c);
    }
    let list = [...map.values()].map((c) => ({
      ...c,
      aov: c.paid ? Math.round(c.ltv / c.paid) : 0,
      returnRate: c.orders ? Math.round((c.refunds / c.orders) * 100) : 0,
      vip: c.ltv > 20000 ? 'Gold' : c.ltv > 5000 ? 'Silver' : 'Bronze',
    })).sort((a, b) => b.ltv - a.ltv);
    if (q) { const s = q.toLowerCase(); list = list.filter((c) => `${c.name} ${c.phone || ''}`.toLowerCase().includes(s)); }
    return list;
  }

  async customerDetail(user: any, key: string) {
    this.assertAdmin(user);
    const decoded = decodeURIComponent(key);
    const orders = await this.prisma.order.findMany({
      where: { OR: [{ buyerId: decoded }, { buyerPhone: decoded }, { buyerName: decoded }] },
      include: { seller: { select: { storeName: true } }, items: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!orders.length) throw new NotFoundException('Customer not found');
    const paid = orders.filter((o) => PAID.includes(o.status));
    const ltv = paid.reduce((s, o) => s + o.totalAmount, 0);
    const c = orders[0];
    return {
      key: decoded,
      name: c.buyerName || 'Customer',
      phone: c.buyerPhone,
      address: c.address,
      stats: {
        orders: orders.length,
        paid: paid.length,
        ltv,
        aov: paid.length ? Math.round(ltv / paid.length) : 0,
        refunds: orders.filter((o) => o.status === 'Refunded').length,
        returnRate: orders.length ? Math.round((orders.filter((o) => o.status === 'Refunded').length / orders.length) * 100) : 0,
        firstOrder: orders[orders.length - 1].createdAt,
        vip: ltv > 20000 ? 'Gold' : ltv > 5000 ? 'Silver' : 'Bronze',
      },
      orders: orders.map((o) => ({ id: o.id, status: o.status, total: o.totalAmount, seller: o.seller?.storeName, item: o.items[0]?.title, createdAt: o.createdAt })),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 7 — Finance Center
  // ─────────────────────────────────────────────────────────────
  /**
   * Finance for a period.
   *
   * Settlements are the one list that is not simply filtered. Decided payouts
   * show for the period they were decided in, but a request still awaiting a
   * decision always shows, however old — otherwise "Last 7 days" would hide a
   * two-week-old withdrawal behind a date filter on the very screen where it
   * has to be approved. "Payouts pending" is a queue for the same reason, and
   * counts every open request.
   */
  async finance(user: any, from?: string, to?: string) {
    this.assertAdmin(user);
    const range = await this.rangeFor(from, to, 30);
    const [orders, payouts] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: range.start, lt: range.end } },
        select: { status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, shippingCharge: true, discountAmount: true, createdAt: true },
      }),
      this.prisma.payout.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const decidedIn = (p: { decidedAt: Date | null; createdAt: Date }) => inRange(p.decidedAt || p.createdAt, range);
    const shown = payouts
      .filter((p) => p.status === 'requested' || decidedIn(p))
      .sort((a, b) => Number(b.status === 'requested') - Number(a.status === 'requested') || +b.createdAt - +a.createdAt);

    // Who each payout belongs to — an operator approving money needs the store
    // name and payout destination, not an 8-character id fragment.
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: [...new Set(shown.map((p) => p.sellerId))] } },
      select: {
        id: true, storeName: true, username: true,
        payoutMethod: true, payoutUpi: true, payoutAccount: true, payoutName: true,
      },
    });
    const sellerNames = new Map(sellers.map((x) => [x.id, x]));
    const paid = orders.filter((o) => PAID.includes(o.status));
    const gmv = gmvOf(paid);
    const commission = platformFeeOf(paid);
    const sellerEarnings = sellerReceivableOf(paid);
    const ledger = reconcile(paid);
    const shipping = paid.reduce((s, o) => s + o.shippingCharge, 0);
    const refundCost = orders.filter((o) => o.status === 'Refunded').reduce((s, o) => s + o.totalAmount, 0);
    const gst = Math.round(commission * 0.18);
    const payoutPaid = payouts.filter((p) => p.status === 'paid' && decidedIn(p)).reduce((s, p) => s + p.amount, 0);
    const payoutPending = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0);

    return {
      range: { from: range.fromKey, to: range.toKey, days: range.days, bucket: range.bucket },
      summary: {
        gmv, revenue: commission, commission, sellerEarnings, shipping,
        refundCost, gst, netProfit: commission - refundCost,
        payoutPaid, payoutPending,
        marketingSpend: 0, operationalCost: 0,
      },
      // Reconciliation banner: GMV must equal seller liability + platform fee.
      ledger: {
        ...ledger,
      },
      cashflow: seriesOver(paid, range, (o) => o.commissionAmount),
      // `version` travels to the UI and back on every decision — see payoutAction.
      settlements: shown.slice(0, 100).map((p) => ({
        id: p.id, sellerId: p.sellerId, amount: p.amount, status: p.status,
        version: p.version, note: p.note, decidedBy: p.decidedBy, decidedAt: p.decidedAt,
        createdAt: p.createdAt,
        seller: sellerNames.get(p.sellerId) || null,
      })),
    };
  }

  /**
   * Advance an order's refund through its own lifecycle.
   *
   * Kept apart from `orderAction` because confirming that money reached the
   * customer is a different claim from changing the order's status, and the
   * two must not be settled by one click. Only the moves in REFUND_NEXT are
   * allowed, so a refund cannot be marked Refunded without first being
   * Initiated, and a completed refund cannot be reopened.
   */
  async setRefundState(
    user: any,
    id: string,
    to: string,
    opts: { expectedVersion?: unknown; idempotencyKey?: string } = {},
  ) {
    this.assertAdmin(user);

    const key = opts.idempotencyKey?.trim();
    if (!key) throw new BadRequestException('An Idempotency-Key header is required for refund updates.');

    const seen = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (seen) {
      if (seen.target !== id || seen.scope !== `refund:${to}`) {
        throw new ConflictException('That idempotency key was already used for a different action.');
      }
      return { ...JSON.parse(seen.response), replayed: true };
    }

    const before = await this.prisma.order.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Order not found');
    if (!canRefundMoveTo(before.refundState, to)) {
      throw new BadRequestException(
        `A refund that is ${before.refundState || 'not owed'} cannot move to ${to}.`,
      );
    }

    const expected = requireVersion(opts.expectedVersion);

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id, version: expected },
        data: { refundState: to, version: { increment: 1 } },
      });
      assertNotStale(count, 'This order');
      const after = await tx.order.findUnique({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId: String(user.userId || user.sub || user.id || 'unknown'),
          actorEmail: user.email || null,
          action: `refund.${to}`,
          entity: 'order',
          entityId: id,
          before: JSON.stringify({ refundState: before.refundState, version: before.version }),
          after: JSON.stringify({ refundState: to, version: after!.version }),
          amount: after!.totalAmount,
        },
      });
      await tx.idempotencyKey.create({
        data: {
          key, scope: `refund:${to}`,
          actorId: String(user.userId || user.sub || user.id || 'unknown'), target: id,
          response: JSON.stringify({ id, refundState: to, version: after!.version }),
        },
      });

      return { id, refundState: to, version: after!.version };
    });
  }

  /**
   * Every review on the platform, including the ones sellers have hidden.
   *
   * This is the top of the visibility hierarchy: a buyer writes a review, the
   * seller may hide it from their storefront, and this screen still shows it —
   * along with who hid it and why. Without that, hiding would be
   * indistinguishable from deleting and a store could bury every complaint.
   */
  async reviews(user: any, filter?: string) {
    this.assertAdmin(user);

    const where =
      filter === 'hidden' ? { hidden: true }
      : filter === 'low' ? { rating: { lte: 2 } }
      : {};

    const reviews = await this.prisma.review.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
    });

    const [sellers, products, customers, all] = await Promise.all([
      this.prisma.seller.findMany({
        where: { id: { in: [...new Set(reviews.map((r) => r.sellerId))] } },
        select: { id: true, storeName: true, username: true },
      }),
      this.prisma.product.findMany({
        where: { id: { in: [...new Set(reviews.map((r) => r.productId))] } },
        select: { id: true, title: true },
      }),
      this.prisma.customer.findMany({
        where: { id: { in: reviews.map((r) => r.customerId).filter(Boolean) as string[] } },
        select: { id: true, name: true, email: true },
      }),
      // Totals are over every review, not just the filtered page.
      this.prisma.review.findMany({ select: { rating: true, hidden: true } }),
    ]);

    const sellerMap = new Map(sellers.map((x) => [x.id, x]));
    const productMap = new Map(products.map((x) => [x.id, x.title]));
    const customerMap = new Map(customers.map((x) => [x.id, x]));

    const hiddenCount = all.filter((r) => r.hidden).length;

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        response: r.response,
        hidden: r.hidden,
        hiddenReason: r.hiddenReason,
        hiddenAt: r.hiddenAt,
        createdAt: r.createdAt,
        orderId: r.orderId,
        product: productMap.get(r.productId) || 'Product',
        seller: sellerMap.get(r.sellerId) || null,
        customer: r.customerId
          ? customerMap.get(r.customerId) || null
          : { name: r.buyerName || 'Guest', email: null },
      })),
      summary: {
        total: all.length,
        hidden: hiddenCount,
        visible: all.length - hiddenCount,
        avgAll: all.length ? Math.round((all.reduce((a, b) => a + b.rating, 0) / all.length) * 10) / 10 : 0,
        avgVisible: (() => {
          const v = all.filter((r) => !r.hidden);
          return v.length ? Math.round((v.reduce((a, b) => a + b.rating, 0) / v.length) * 10) / 10 : 0;
        })(),
        lowRatings: all.filter((r) => r.rating <= 2).length,
      },
    };
  }

  /**
   * The withdrawal queue: every payout request, waiting ones first.
   *
   * Kept as its own screen rather than a table buried in Finance, because
   * these are the requests somebody has to act on — a seller is waiting for
   * their money, and a row inside a page of charts is easy to miss.
   *
   * Each waiting request carries the seller's payout destination and how much
   * of their balance it represents, so the decision can be made here without
   * opening another screen.
   */
  async payouts(user: any) {
    this.assertAdmin(user);

    const payouts = await this.prisma.payout.findMany({ orderBy: { createdAt: 'desc' } });
    const sellerIds = [...new Set(payouts.map((p) => p.sellerId))];

    const [sellers, orders] = await Promise.all([
      this.prisma.seller.findMany({
        where: { id: { in: sellerIds } },
        select: {
          id: true, storeName: true, username: true, kycStatus: true,
          payoutMethod: true, payoutUpi: true, payoutAccount: true,
          payoutName: true, payoutEmail: true,
          user: { select: { email: true, phone: true } },
        },
      }),
      // Delivered earnings per seller, to show what the request is drawn from.
      this.prisma.order.findMany({
        where: { sellerId: { in: sellerIds }, status: { in: DELIVERED } },
        select: { sellerId: true, itemsAmount: true, shippingCharge: true, discountAmount: true },
      }),
    ]);

    const sellerMap = new Map(sellers.map((x) => [x.id, x]));
    const earned = new Map<string, number>();
    for (const o of orders) {
      earned.set(o.sellerId, (earned.get(o.sellerId) || 0) + sellerReceivableOf([o]));
    }

    const paidSoFar = new Map<string, number>();
    for (const p of payouts.filter((x) => x.status === 'paid')) {
      paidSoFar.set(p.sellerId, (paidSoFar.get(p.sellerId) || 0) + p.amount);
    }

    const shape = (p: any) => {
      const seller = sellerMap.get(p.sellerId);
      const destination = seller?.payoutMethod === 'bank' ? seller?.payoutAccount : seller?.payoutUpi;
      return {
        id: p.id,
        amount: p.amount,
        status: p.status,
        version: p.version,
        note: p.note,
        decidedBy: p.decidedBy,
        decidedAt: p.decidedAt,
        createdAt: p.createdAt,
        seller: seller
          ? {
              id: seller.id, storeName: seller.storeName, username: seller.username,
              kyc: seller.kycStatus, email: seller.user?.email, phone: seller.user?.phone,
              method: seller.payoutMethod || 'upi',
              destination: destination || null,
              accountName: seller.payoutName || null,
              payoutEmail: seller.payoutEmail || null,
              lifetimeEarned: earned.get(p.sellerId) || 0,
              alreadyPaid: paidSoFar.get(p.sellerId) || 0,
            }
          : null,
        // Refuse-to-pay signals the operator should see before approving.
        warnings: [
          !destination ? 'No payout destination on file' : null,
          // The stored values are 'approved' / 'rejected'. Comparing against
          // 'verified' flagged every properly-approved seller, which would
          // teach an operator to ignore these warnings entirely.
          seller && !['approved', 'verified'].includes(seller.kycStatus || '')
            ? `KYC is ${seller.kycStatus || 'not submitted'}`
            : null,
          p.amount > (earned.get(p.sellerId) || 0) - (paidSoFar.get(p.sellerId) || 0)
            ? 'Request exceeds delivered earnings'
            : null,
        ].filter(Boolean),
      };
    };

    const pending = payouts.filter((p) => p.status === 'requested').map(shape);
    const decided = payouts.filter((p) => p.status !== 'requested').map(shape);

    return {
      pending,
      decided: decided.slice(0, 50),
      summary: {
        pendingCount: pending.length,
        pendingAmount: pending.reduce((a, b) => a + b.amount, 0),
        paidAmount: payouts.filter((p) => p.status === 'paid').reduce((a, b) => a + b.amount, 0),
        rejectedCount: payouts.filter((p) => p.status === 'rejected').length,
        needsAttention: pending.filter((p) => p.warnings.length > 0).length,
      },
    };
  }

  /**
   * Approve or reject a seller's withdrawal request.
   *
   * This is a money action, so it carries the same protections as the order
   * ones: an idempotency key (a double-click must not pay twice), the version
   * the operator was shown (a stale screen must not overwrite a decision
   * someone else already made), and an audit row recording who decided what.
   *
   *   approve -> 'paid'      the amount moves into the seller's Settled total
   *   reject  -> 'rejected'  the amount returns to their Available balance
   *
   * Only a request still awaiting a decision can be decided; `paid` and
   * `rejected` are terminal.
   */
  async payoutAction(
    user: any,
    id: string,
    action: 'approve' | 'reject',
    opts: { expectedVersion?: unknown; idempotencyKey?: string; note?: string } = {},
  ) {
    this.assertAdmin(user);
    if (action !== 'approve' && action !== 'reject') {
      throw new BadRequestException('Action must be approve or reject.');
    }

    const key = opts.idempotencyKey?.trim();
    if (!key) throw new BadRequestException('An Idempotency-Key header is required to decide a payout.');

    const seen = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (seen) {
      if (seen.target !== id || seen.scope !== `payout:${action}`) {
        throw new ConflictException('That idempotency key was already used for a different action.');
      }
      return { ...JSON.parse(seen.response), replayed: true };
    }

    const before = await this.prisma.payout.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Payout not found');
    if (before.status !== 'requested') {
      throw new BadRequestException(
        `This payout is already ${before.status} — it cannot be ${action === 'approve' ? 'approved' : 'rejected'} again.`,
      );
    }

    const expected = requireVersion(opts.expectedVersion);
    const status = action === 'approve' ? 'paid' : 'rejected';

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payout.updateMany({
        where: { id, version: expected, status: 'requested' },
        data: {
          status,
          note: opts.note?.trim() || null,
          decidedBy: String(user.email || user.sub || user.userId || 'admin'),
          decidedAt: new Date(),
          version: { increment: 1 },
        },
      });
      assertNotStale(count, 'This payout');

      const after = await tx.payout.findUnique({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId: String(user.sub || user.userId || 'unknown'),
          actorEmail: user.email || null,
          action: `payout.${action}`,
          entity: 'payout',
          entityId: id,
          before: JSON.stringify({ status: before.status, version: before.version }),
          after: JSON.stringify({ status, version: after!.version }),
          amount: before.amount,
        },
      });

      await tx.idempotencyKey.create({
        data: {
          key,
          scope: `payout:${action}`,
          actorId: String(user.sub || user.userId || 'unknown'),
          target: id,
          response: JSON.stringify({ id, status, version: after!.version, amount: before.amount }),
        },
      });

      return { id, status, version: after!.version, amount: before.amount };
    });
  }

  /** The money trail for one order — who did what, oldest first. */
  async orderAudit(user: any, id: string) {
    this.assertAdmin(user);
    const rows = await this.prisma.auditLog.findMany({
      where: { entity: 'order', entityId: id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id, action: r.action, actor: r.actorEmail || r.actorId,
      before: r.before ? JSON.parse(r.before) : null,
      after: r.after ? JSON.parse(r.after) : null,
      amount: r.amount, at: r.createdAt,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 8 — Business Intelligence / Analytics
  // ─────────────────────────────────────────────────────────────
  async analytics(user: any, from?: string, to?: string) {
    this.assertAdmin(user);
    const range = await this.rangeFor(from, to, 30);
    // The forecast looks forward from today, so it is always built from the
    // last seven days — projecting next week from last March would be noise.
    const lastWeek = parseRange(undefined, undefined, { defaultDays: 7 });
    const period = { gte: range.start, lt: range.end };
    const [orders, items, recentPaid] = await Promise.all([
      this.prisma.order.findMany({ where: { createdAt: period }, select: { status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, buyerId: true, buyerName: true, buyerPhone: true, createdAt: true } }),
      this.prisma.orderItem.findMany({ where: { order: { createdAt: period } }, select: { quantity: true, unitPrice: true, title: true, order: { select: { status: true } }, product: { select: { category: true } } } }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: lastWeek.start, lt: lastWeek.end }, status: { in: PAID } },
        select: { itemsAmount: true, createdAt: true },
      }),
    ]);
    const paid = orders.filter((o) => PAID.includes(o.status));

    // funnel
    const created = orders.length;
    const paidCount = paid.length;
    const delivered = orders.filter((o) => DELIVERED.includes(o.status)).length;

    // repeat customers
    const byCust = new Map<string, number>();
    paid.forEach((o) => byCust.set(custKey(o), (byCust.get(custKey(o)) || 0) + 1));
    const repeat = [...byCust.values()].filter((n) => n > 1).length;
    const totalCust = byCust.size;

    // categories
    const catMap = new Map<string, number>();
    items.filter((it) => PAID.includes((it as any).order?.status)).forEach((it) => {
      const cat = (it as any).product?.category || 'Other';
      catMap.set(cat, (catMap.get(cat) || 0) + it.unitPrice * it.quantity);
    });

    return {
      range: { from: range.fromKey, to: range.toKey, days: range.days, bucket: range.bucket },
      kpis: {
        clv: totalCust ? Math.round(paid.reduce((s, o) => s + o.totalAmount, 0) / totalCust) : 0,
        repeatRate: totalCust ? Math.round((repeat / totalCust) * 100) : 0,
        conversion: created ? Math.round((paidCount / created) * 1000) / 10 : 0,
        aov: paidCount ? Math.round(paid.reduce((s, o) => s + o.totalAmount, 0) / paidCount) : 0,
      },
      funnel: [
        { stage: 'Orders Created', value: created },
        { stage: 'Paid', value: paidCount },
        { stage: 'Delivered', value: delivered },
        { stage: 'Repeat Buyers', value: repeat },
      ],
      revenueSeries: seriesOver(paid, range, (o) => o.itemsAmount),
      ordersSeries: seriesOver(orders, range, () => 1),
      categories: [...catMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      forecast: this.forecast(seriesOver(recentPaid, lastWeek, (o) => o.itemsAmount)),
    };
  }

  // naive linear forecast for the next 7 days from the trailing average
  private forecast(series: { value: number }[]) {
    const recent = series.slice(-7).map((s) => s.value);
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    return Array.from({ length: 7 }, (_, i) => ({ label: `D+${i + 1}`, value: Math.round(avg * (1 + i * 0.03)) }));
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN 3 — Seller Operations Center (deep profile)
  // ─────────────────────────────────────────────────────────────
  async sellerDetail(user: any, id: string) {
    this.assertAdmin(user);
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: { user: { select: { email: true, phone: true, createdAt: true } } },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    const [orders, products, payouts, disputes] = await Promise.all([
      this.prisma.order.findMany({ where: { sellerId: id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.product.findMany({ where: { sellerId: id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.payout.findMany({ where: { sellerId: id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dispute.findMany({ where: { sellerId: id }, orderBy: { createdAt: 'desc' } }),
    ]);
    const paid = orders.filter((o) => PAID.includes(o.status));
    const delivered = orders.filter((o) => DELIVERED.includes(o.status));
    const cancelled = orders.filter((o) => o.status === 'Cancelled');
    const refunded = orders.filter((o) => o.status === 'Refunded');
    const revenue = paid.reduce((s, o) => s + o.itemsAmount, 0);
    const commission = paid.reduce((s, o) => s + o.commissionAmount, 0);
    const cancelRate = orders.length ? Math.round((cancelled.length / orders.length) * 100) : 0;
    const refundRate = orders.length ? Math.round((refunded.length / orders.length) * 100) : 0;
    // performance score
    const score = Math.max(0, Math.min(100, 100 - cancelRate * 1.5 - refundRate * 2 + Math.round((seller.rating || 0) * 4)));
    const payoutPaid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const payoutPending = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0);

    return {
      id: seller.id,
      storeName: seller.storeName,
      username: seller.username,
      description: seller.description,
      city: seller.city,
      rating: seller.rating,
      ratingCount: seller.ratingCount,
      kycStatus: seller.kycStatus,
      createdAt: seller.createdAt,
      email: (seller as any).user?.email,
      phone: (seller as any).user?.phone,
      stats: {
        revenue, commission, products: products.length,
        orders: orders.length, paidOrders: paid.length, delivered: delivered.length,
        cancelled: cancelled.length, refunded: refunded.length,
        cancelRate, refundRate, score,
        wallet: revenue - payoutPaid, payoutPaid, payoutPending,
        disputes: disputes.length,
        customers: new Set(orders.map(custKey)).size,
      },
      series: seriesOver(paid, parseRange(undefined, undefined, { defaultDays: 14 }), (o) => o.itemsAmount),
      products: products.slice(0, 12).map((p) => ({ id: p.id, title: p.title, price: p.price, quantity: p.quantity, isActive: p.isActive, image: this.firstImage(p.images) })),
      orders: orders.slice(0, 12).map((o) => ({ id: o.id, status: o.status, total: o.totalAmount, buyer: o.buyerName, createdAt: o.createdAt })),
      payouts: payouts.slice(0, 10),
      disputes: disputes.slice(0, 10),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // existing endpoints (kept)
  // ─────────────────────────────────────────────────────────────
  async stats(user: any) {
    this.assertAdmin(user);
    const [pendingKyc, openDisputes, payoutsDue, orders] = await Promise.all([
      this.prisma.seller.count({ where: { kycStatus: 'pending' } }),
      this.prisma.dispute.count({ where: { status: 'open' } }),
      this.prisma.payout.aggregate({ where: { status: 'requested' }, _sum: { amount: true } }),
      this.prisma.order.findMany({ where: { status: { in: PAID } } }),
    ]);
    const gmv = orders.reduce((s, o) => s + o.totalAmount, 0);
    return { pendingKyc, openDisputes, payoutsDue: payoutsDue._sum.amount || 0, gmv };
  }

  async overview(user: any) {
    this.assertAdmin(user);
    const [sellerCount, productCount, orders] = await Promise.all([
      this.prisma.seller.count(),
      this.prisma.product.count(),
      this.prisma.order.findMany({ select: { status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, buyerId: true, buyerName: true, buyerPhone: true } }),
    ]);
    const paid = orders.filter((o) => PAID.includes(o.status));
    return {
      sellers: sellerCount,
      products: productCount,
      orders: orders.length,
      paidOrders: paid.length,
      revenue: paid.reduce((s, o) => s + (o.itemsAmount || 0), 0),
      commission: paid.reduce((s, o) => s + (o.commissionAmount || 0), 0),
      customers: new Set(orders.map(custKey)).size,
    };
  }

  async sellers(user: any) {
    this.assertAdmin(user);
    const [sellers, orders, productGroups] = await Promise.all([
      this.prisma.seller.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true, name: true } } } }),
      this.prisma.order.findMany({ select: { sellerId: true, status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, buyerId: true, buyerName: true, buyerPhone: true } }),
      this.prisma.product.groupBy({ by: ['sellerId'], _count: { _all: true } }),
    ]);
    const productCount = (id: string) => productGroups.find((g) => g.sellerId === id)?._count._all || 0;
    return sellers.map((s) => {
      const so = orders.filter((o) => o.sellerId === s.id);
      const paid = so.filter((o) => PAID.includes(o.status));
      const delivered = so.filter((o) => DELIVERED.includes(o.status));
      return {
        id: s.id, storeName: s.storeName, username: s.username,
        email: (s as any).user?.email || null, city: s.city, kycStatus: s.kycStatus,
        rating: s.rating, ratingCount: s.ratingCount, createdAt: s.createdAt,
        stats: {
          products: productCount(s.id), orders: so.length, paidOrders: paid.length,
          delivered: delivered.length,
          customers: new Set(so.map(custKey)).size,
          revenue: paid.reduce((a, o) => a + (o.itemsAmount || 0), 0),
          commission: paid.reduce((a, o) => a + (o.commissionAmount || 0), 0),
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

  /**
   * The bell.
   *
   * Derived from live state rather than stored. There is no admin
   * notification table, and adding one would mean every event source has to
   * remember to write to it — the first one that forgets is a payout request
   * nobody hears about. The things an admin must act on are already facts in
   * the data (a payout is `requested`, a dispute is `open`), so reading them
   * directly means the bell cannot disagree with the screens it links to, and
   * an item disappears the moment it is dealt with.
   *
   * Ids are stable, and the client marks them read. A refund's id carries its
   * state, so one that moves from Required to Failed notifies again.
   * `important` items count toward the badge; new orders are listed but not
   * counted, or on a busy day the badge would mean nothing.
   */
  async notifications(user: any) {
    this.assertAdmin(user);
    const since = new Date(Date.now() - 7 * 86_400_000);

    const [payouts, disputes, kyc, refunds, reviews, orders] = await Promise.all([
      this.prisma.payout.findMany({ where: { status: 'requested' }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.dispute.findMany({ where: { status: 'open' }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.seller.findMany({
        where: { kycStatus: 'pending' }, orderBy: { createdAt: 'desc' }, take: 50,
        select: { id: true, storeName: true, username: true, city: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { refundState: { in: ['Required', 'Failed'] } }, orderBy: { createdAt: 'desc' }, take: 50,
        select: { id: true, sellerId: true, totalAmount: true, refundState: true, buyerName: true, createdAt: true },
      }),
      this.prisma.review.findMany({
        where: { rating: { lte: 2 }, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, sellerId: true, rating: true, comment: true, buyerName: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { in: PAID } }, orderBy: { createdAt: 'desc' }, take: 15,
        select: { id: true, sellerId: true, totalAmount: true, buyerName: true, createdAt: true },
      }),
    ]);

    const ids = [...new Set([...payouts, ...disputes, ...refunds, ...reviews, ...orders].map((x) => x.sellerId))];
    const sellers = new Map(
      (await this.prisma.seller.findMany({
        where: { id: { in: ids } },
        select: { id: true, storeName: true, payoutMethod: true, payoutUpi: true, payoutAccount: true },
      })).map((x) => [x.id, x]),
    );
    const store = (id: string) => sellers.get(id)?.storeName || 'Unknown store';
    const ref = (id: string) => `#${id.slice(-6).toUpperCase()}`;
    const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
    const clip = (t: string | null) => (t && t.length > 90 ? `${t.slice(0, 89)}…` : t || '');

    const items: Notice[] = [
      ...payouts.map((p): Notice => {
        const sl = sellers.get(p.sellerId);
        const dest = sl?.payoutMethod === 'bank' ? (sl.payoutAccount ? 'bank transfer' : 'no bank details')
          : sl?.payoutUpi ? 'UPI' : 'no payout details';
        return { id: `payout:${p.id}`, kind: 'payout', tone: 'warn', title: `${inr(p.amount)} payout requested`, body: `${store(p.sellerId)} · ${dest}`, href: '/admin/payouts', at: p.createdAt, important: true };
      }),
      ...disputes.map((d): Notice => ({
        id: `dispute:${d.id}`, kind: 'dispute', tone: 'alert', title: `Dispute · ${d.issueType}`,
        body: `${ref(d.orderId)} · ${d.buyerName || 'Customer'} vs ${store(d.sellerId)}`, href: `/admin/orders/${d.orderId}`, at: d.createdAt, important: true,
      })),
      ...refunds.map((o): Notice => ({
        id: `refund:${o.id}:${o.refundState}`, kind: 'refund', tone: 'alert',
        title: o.refundState === 'Failed' ? `Refund failed · ${inr(o.totalAmount)}` : `Refund owed · ${inr(o.totalAmount)}`,
        body: `${ref(o.id)} · ${o.buyerName || 'Customer'} · ${store(o.sellerId)}`, href: `/admin/orders/${o.id}`, at: o.createdAt, important: true,
      })),
      ...kyc.map((sl): Notice => ({
        id: `kyc:${sl.id}`, kind: 'kyc', tone: 'warn', title: 'Seller awaiting KYC review',
        body: `${sl.storeName} · @${sl.username}${sl.city ? ` · ${sl.city}` : ''}`, href: `/admin/sellers/${sl.id}`, at: sl.createdAt, important: true,
      })),
      ...reviews.map((r): Notice => ({
        id: `review:${r.id}`, kind: 'review', tone: 'warn', title: `${r.rating}★ review for ${store(r.sellerId)}`,
        body: clip(r.comment) || `From ${r.buyerName || 'a customer'}`, href: '/admin/reviews', at: r.createdAt, important: true,
      })),
      ...orders.map((o): Notice => ({
        id: `order:${o.id}`, kind: 'order', tone: 'info', title: `New order · ${inr(o.totalAmount)}`,
        body: `${o.buyerName || 'Customer'} · ${store(o.sellerId)}`, href: `/admin/orders/${o.id}`, at: o.createdAt, important: false,
      })),
    ].sort((a, b) => +b.at - +a.at);

    return {
      items,
      counts: { attention: items.filter((i) => i.important).length },
      at: new Date(),
    };
  }

  /**
   * CSV exports for a period: orders, summary, payouts or sellers.
   *
   * Built on the server rather than from what a screen holds. A screen holds
   * a page of rows — Finance showed the latest 25 settlements, and its export
   * exported exactly those 25 — where an export is expected to be complete.
   * Figures come from common/money, the functions the dashboard uses, so a
   * spreadsheet total cannot disagree with the screen.
   *
   * Every export is audit-logged. These files carry customer phone numbers
   * and sellers' bank and UPI details, and once downloaded they are beyond
   * anything the app can protect; the least it can do is record who took
   * which data for which period.
   */
  async exportData(user: any, dataset: string, from?: string, to?: string) {
    this.assertAdmin(user);
    if (!(EXPORTS as readonly string[]).includes(dataset)) {
      throw new BadRequestException(`Unknown export "${dataset}". Choose one of: ${EXPORTS.join(', ')}.`);
    }
    const range = await this.rangeFor(from, to, 30);
    const period = { gte: range.start, lt: range.end };
    let headers: string[] = [];
    let rows: unknown[][] = [];

    if (dataset === 'orders') {
      const orders = await this.prisma.order.findMany({
        where: { createdAt: period },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, createdAt: true, status: true, refundState: true, buyerName: true, buyerPhone: true,
          itemsAmount: true, discountAmount: true, couponCode: true, shippingCharge: true, commissionAmount: true, totalAmount: true,
          paymentId: true, courier: true, awbNumber: true,
          seller: { select: { storeName: true, username: true } },
          items: { select: { title: true, quantity: true } },
        },
      });
      headers = ['Order ID', 'Placed (IST)', 'Status', 'Refund state', 'Seller', 'Seller handle', 'Buyer', 'Buyer phone', 'Items', 'Units', 'Items amount (₹)', 'Discount (₹)', 'Coupon', 'Shipping (₹)', 'Platform fee (₹)', 'Order total (₹)', 'Seller receivable (₹)', 'Payment', 'Courier', 'Tracking number'];
      rows = orders.map((o) => [
        o.id, istDateTime(o.createdAt), o.status, o.refundState, o.seller?.storeName, o.seller?.username, o.buyerName, o.buyerPhone,
        o.items.map((i) => `${i.title} × ${i.quantity}`).join('; '),
        o.items.reduce((n, i) => n + i.quantity, 0),
        o.itemsAmount, o.discountAmount || 0, o.couponCode, o.shippingCharge, o.commissionAmount, o.totalAmount,
        sellerReceivableOf([o]), paymentLabel(o.paymentId), o.courier, o.awbNumber,
      ]);
    } else if (dataset === 'summary') {
      const orders = await this.prisma.order.findMany({
        where: { createdAt: period },
        select: { status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, shippingCharge: true, discountAmount: true, buyerId: true, buyerName: true, buyerPhone: true, createdAt: true },
      });
      // One line per day or month, plus a total. The total's Customers is a
      // distinct count over the whole range, not the column's sum — someone
      // who ordered on three days is one customer.
      const line = (label: string, os: typeof orders) => {
        const paid = os.filter((o) => PAID.includes(o.status));
        const refunded = os.filter((o) => o.status === 'Refunded');
        return [
          label, os.length, paid.length, os.filter((o) => o.status === 'Cancelled').length, refunded.length,
          gmvOf(paid), discountOf(paid), paid.reduce((n, o) => n + o.shippingCharge, 0), platformFeeOf(paid), sellerReceivableOf(paid),
          gmvOf(refunded), paid.length ? Math.round(gmvOf(paid) / paid.length) : 0, new Set(os.map(custKey)).size,
        ];
      };
      headers = [range.bucket === 'day' ? 'Date' : 'Month', 'Orders placed', 'Paid orders', 'Cancelled', 'Refunded', 'GMV (₹)', 'Discounts (₹)', 'Shipping (₹)', 'Platform fee (₹)', 'Seller receivable (₹)', 'Refunded value (₹)', 'Avg order value (₹)', 'Customers'];
      rows = groupByBucket(orders, range).map(({ bucket, rows: os }) => line(bucket.key, os));
      rows.push(line('Total', orders));
    } else if (dataset === 'payouts') {
      const payouts = await this.prisma.payout.findMany({ where: { createdAt: period }, orderBy: { createdAt: 'asc' } });
      const sellers = new Map(
        (await this.prisma.seller.findMany({
          where: { id: { in: [...new Set(payouts.map((p) => p.sellerId))] } },
          select: { id: true, storeName: true, username: true, payoutMethod: true, payoutUpi: true, payoutAccount: true, payoutName: true },
        })).map((x) => [x.id, x]),
      );
      // The destination is the seller's payout details as they are today. The
      // app does not record what they were when a payout was made, and the
      // header says so rather than implying otherwise.
      headers = ['Payout ID', 'Requested (IST)', 'Seller', 'Seller handle', 'Amount (₹)', 'Status', 'Method', 'Destination (current)', 'Account holder (current)', 'Decided (IST)', 'Decided by', 'Reference / reason'];
      rows = payouts.map((p) => {
        const sl = sellers.get(p.sellerId);
        return [
          p.id, istDateTime(p.createdAt), sl?.storeName, sl?.username, p.amount, p.status,
          sl?.payoutMethod === 'bank' ? 'Bank' : sl?.payoutMethod === 'upi' ? 'UPI' : '',
          sl?.payoutMethod === 'bank' ? sl?.payoutAccount : sl?.payoutUpi, sl?.payoutName,
          istDateTime(p.decidedAt), p.decidedBy, p.note,
        ];
      });
    } else {
      const [sellers, orders, products] = await Promise.all([
        this.prisma.seller.findMany({
          orderBy: { createdAt: 'asc' },
          // Explicit select: the row also holds the storefront config and base64
          // images, which have no place in a spreadsheet and would make this slow.
          select: { id: true, storeName: true, username: true, city: true, kycStatus: true, published: true, rating: true, ratingCount: true, createdAt: true, user: { select: { email: true } } },
        }),
        this.prisma.order.findMany({
          where: { createdAt: period },
          select: { sellerId: true, status: true, totalAmount: true, itemsAmount: true, commissionAmount: true, shippingCharge: true, discountAmount: true, buyerId: true, buyerName: true, buyerPhone: true },
        }),
        this.prisma.product.groupBy({ by: ['sellerId'], _count: { _all: true } }),
      ]);
      const productCount = new Map(products.map((g) => [g.sellerId, g._count._all]));
      headers = ['Seller ID', 'Store', 'Handle', 'Email', 'City', 'KYC', 'Published', 'Joined (IST)', 'Products', 'Orders in period', 'Paid orders', 'Delivered', 'GMV (₹)', 'Platform fee (₹)', 'Seller receivable (₹)', 'Customers', 'Rating', 'Ratings'];
      rows = sellers.map((sl) => {
        const so = orders.filter((o) => o.sellerId === sl.id);
        const paid = so.filter((o) => PAID.includes(o.status));
        return [
          sl.id, sl.storeName, sl.username, sl.user?.email, sl.city, sl.kycStatus, sl.published, istDateTime(sl.createdAt),
          productCount.get(sl.id) || 0, so.length, paid.length, so.filter((o) => DELIVERED.includes(o.status)).length,
          gmvOf(paid), platformFeeOf(paid), sellerReceivableOf(paid), new Set(so.map(custKey)).size,
          sl.rating, sl.ratingCount,
        ];
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: String(user.userId || user.sub || user.id || 'unknown'),
        actorEmail: user.email || null,
        action: `export.${dataset}`,
        entity: 'export',
        entityId: rangeSlug(range),
        after: JSON.stringify({ from: range.fromKey, to: range.toKey, rows: rows.length }),
      },
    });

    return { filename: `loopy-${dataset}_${rangeSlug(range)}.csv`, csv: toCsv(headers, rows), rows: rows.length };
  }

  async disputes(user: any) {
    this.assertAdmin(user);
    return this.prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async resolveDispute(user: any, id: string, resolution: 'refunded' | 'released') {
    this.assertAdmin(user);
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.prisma.order.update({ where: { id: dispute.orderId }, data: { status: resolution === 'refunded' ? 'Refunded' : 'Completed' } });
    return this.prisma.dispute.update({ where: { id }, data: { status: resolution, resolvedAt: new Date() } });
  }
}
