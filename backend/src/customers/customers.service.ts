import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { verifyGoogleIdToken } from '../auth/google-verify';
import { cancelRequestEmail, orderReceiptEmail, sendMail, verificationEmail } from '../mail/mailer';
import { computeAmounts } from '../common/money';
import { describeCoupon, discountFor, normalizeCode } from '../common/coupons';
import { PaymentsService } from '../payments/payments.service';

const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Statuses a buyer may still cancel on their own — everything before the
 * parcel leaves. After dispatch it is a return, which the store has to
 * arrange.
 */
const BUYER_CANCELLABLE = ['PendingPayment', 'Paid', 'Accepted'];
const MAX_OTP_ATTEMPTS = 5;

function parse(s: string): any[] { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }
function shape(p: any) { return { ...p, images: parse(p.images), variants: parse(p.variants), sizes: parse(p.sizes) }; }

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private payments: PaymentsService) {}

  private commissionPct = Number(process.env.COMMISSION_PERCENT || 5);
  private shippingFlat = Number(process.env.SHIPPING_FLAT || 60);

  private async storeId(username: string) {
    const seller = await this.prisma.seller.findUnique({ where: { username }, select: { id: true } });
    if (!seller) throw new NotFoundException('Store not found');
    return seller.id;
  }

  private async session(customer: { id: string; name: string | null; email: string | null }, sellerId: string, isNew = false) {
    const accessToken = await this.jwt.signAsync({ sub: customer.id, role: 'customer', sellerId });
    return { accessToken, customer: { id: customer.id, name: customer.name, email: customer.email }, isNew };
  }

  /**
   * First time a shopper appears on a store, create their per-store account and
   * ping the seller. Shared by the Google and email/password entry points.
   */
  private async findOrCreate(sellerId: string, email: string, name: string, password?: string) {
    const existing = await this.prisma.customer.findUnique({ where: { sellerId_email: { sellerId, email } } });
    if (existing) return { customer: existing, isNew: false };

    const customer = await this.prisma.customer.create({
      data: { sellerId, email, name, password: password ?? null },
    });
    await this.prisma.notification.create({
      data: {
        sellerId, type: 'new_customer', title: 'New customer 👋',
        body: `${name} (${email}) signed up on your store.`, link: '/seller/customers',
      },
    });
    return { customer, isNew: true };
  }

  // ── Google Sign-In ──
  async authGoogle(username: string, token: string) {
    const sellerId = await this.storeId(username);
    const { email, name } = await verifyGoogleIdToken(token);
    const { customer, isNew } = await this.findOrCreate(sellerId, email, name);
    return this.session(customer, sellerId, isNew);
  }

  // ── email + password (with 6-digit email verification on signup) ──

  /**
   * Step 1 of signup: stash the details and email a code. Deliberately does NOT
   * create the Customer — an unverified address must not be able to occupy an
   * account, otherwise anyone could squat on someone else's email.
   */
  async registerCustomer(username: string, dto: { name?: string; email?: string; password?: string }) {
    const sellerId = await this.storeId(username);
    const email = (dto?.email || '').toLowerCase().trim();
    const password = dto?.password || '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException('Enter a valid email address');
    if (password.length < 6) throw new BadRequestException('Password must be at least 6 characters');

    const existing = await this.prisma.customer.findUnique({ where: { sellerId_email: { sellerId, email } } });
    if (existing?.password) throw new ConflictException('You already have an account here — sign in instead.');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const [passwordHash, codeHash] = await Promise.all([bcrypt.hash(password, 10), bcrypt.hash(code, 10)]);
    const name = dto?.name?.trim() || existing?.name || email.split('@')[0];
    const data = {
      name, passwordHash, codeHash, attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    };
    await this.prisma.pendingSignup.upsert({
      where: { sellerId_email: { sellerId, email } },
      create: { sellerId, email, ...data },
      update: data,
    });

    const store = await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { storeName: true } });
    const mail = verificationEmail(code, store?.storeName);
    const sent = await sendMail(email, mail.subject, mail.html, mail.text);

    // With no SMTP configured (or if Gmail is down) hand the code back so local
    // dev still works. Never leak it once mail is actually being delivered.
    return { pending: true, email, sent, ...(sent ? {} : { devCode: code }) };
  }

  /** Step 2 of signup: check the code, then create the real account. */
  async verifySignup(username: string, email?: string, code?: string) {
    const sellerId = await this.storeId(username);
    const mail = (email || '').toLowerCase().trim();
    const pending = mail
      ? await this.prisma.pendingSignup.findUnique({ where: { sellerId_email: { sellerId, email: mail } } })
      : null;
    if (!pending) throw new BadRequestException('Start again — we don’t have a pending signup for that email.');

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.pendingSignup.delete({ where: { id: pending.id } });
      throw new BadRequestException('That code has expired. Request a new one.');
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.pendingSignup.delete({ where: { id: pending.id } });
      throw new BadRequestException('Too many incorrect attempts. Request a new code.');
    }
    if (!(await bcrypt.compare(String(code || ''), pending.codeHash))) {
      await this.prisma.pendingSignup.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException('That code isn’t right.');
    }

    const existing = await this.prisma.customer.findUnique({ where: { sellerId_email: { sellerId, email: mail } } });
    let customer;
    if (existing) {
      // Signed up with Google first, now adding a password.
      customer = await this.prisma.customer.update({
        where: { id: existing.id },
        data: { password: pending.passwordHash, name: existing.name || pending.name },
      });
    } else {
      customer = (await this.findOrCreate(sellerId, mail, pending.name || mail.split('@')[0], pending.passwordHash)).customer;
    }
    await this.prisma.pendingSignup.delete({ where: { id: pending.id } });
    return this.session(customer, sellerId, !existing);
  }

  async loginCustomer(username: string, email?: string, password?: string) {
    const sellerId = await this.storeId(username);
    const mail = (email || '').toLowerCase().trim();
    const customer = mail
      ? await this.prisma.customer.findUnique({ where: { sellerId_email: { sellerId, email: mail } } })
      : null;
    // Same message either way so this can't be used to probe which emails exist.
    if (!customer?.password) throw new UnauthorizedException('Invalid email or password');
    if (!(await bcrypt.compare(password || '', customer.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.session(customer, sellerId);
  }

  private assertCustomer(user: any) {
    if (!user || user.role !== 'customer') throw new ForbiddenException('Sign in to continue');
    return { customerId: user.userId as string, sellerId: user.sellerId as string };
  }

  async me(user: any) {
    const { customerId } = this.assertCustomer(user);
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true,
                addresses: { orderBy: { isDefault: 'desc' } } },
    });
  }

  /**
   * Shopper edits their own profile. Email is intentionally not editable — it's
   * the account's identity within a store (`@@unique([sellerId, email])`) and is
   * what Google sign-in matches on.
   */
  async updateMe(user: any, dto: { name?: string; phone?: string }) {
    const { customerId } = this.assertCustomer(user);
    const data: { name?: string; phone?: string | null } = {};

    if (dto?.name !== undefined) {
      const name = String(dto.name).trim();
      if (!name) throw new BadRequestException('Name cannot be empty');
      data.name = name;
    }
    if (dto?.phone !== undefined) {
      const phone = String(dto.phone).trim();
      if (phone && !/^[0-9+\-\s()]{6,20}$/.test(phone)) throw new BadRequestException('Enter a valid phone number');
      data.phone = phone || null;
    }
    if (!Object.keys(data).length) throw new BadRequestException('Nothing to update');

    return this.prisma.customer.update({
      where: { id: customerId },
      data,
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  // ── wishlist ──
  async getWishlist(user: any) {
    const { customerId } = this.assertCustomer(user);
    const items = await this.prisma.wishlistItem.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
    const products = await this.prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
    // preserve wishlist order
    return items.map((i) => products.find((p) => p.id === i.productId)).filter(Boolean).map(shape);
  }
  async addWishlist(user: any, productId: string) {
    const { customerId } = this.assertCustomer(user);
    await this.prisma.wishlistItem.upsert({ where: { customerId_productId: { customerId, productId } }, create: { customerId, productId }, update: {} });
    return { ok: true };
  }
  async removeWishlist(user: any, productId: string) {
    const { customerId } = this.assertCustomer(user);
    await this.prisma.wishlistItem.deleteMany({ where: { customerId, productId } });
    return { ok: true };
  }
  async wishlistIds(user: any) {
    const { customerId } = this.assertCustomer(user);
    const items = await this.prisma.wishlistItem.findMany({ where: { customerId }, select: { productId: true } });
    return items.map((i) => i.productId);
  }

  // ── addresses ──
  async getAddresses(user: any) {
    const { customerId } = this.assertCustomer(user);
    return this.prisma.address.findMany({ where: { customerId }, orderBy: { isDefault: 'desc' } });
  }
  async addAddress(user: any, dto: any) {
    const { customerId } = this.assertCustomer(user);
    for (const f of ['name', 'phone', 'line1', 'city', 'pincode']) if (!dto?.[f]) throw new BadRequestException(`${f} is required`);
    const count = await this.prisma.address.count({ where: { customerId } });
    return this.prisma.address.create({
      data: { customerId, name: dto.name, phone: dto.phone, line1: dto.line1, line2: dto.line2 || null, city: dto.city, state: dto.state || null, pincode: dto.pincode, isDefault: count === 0 },
    });
  }

  // ── coupons ──

  /** Look up a coupon for this store by code, case-insensitively. */
  private async findCoupon(sellerId: string, code: string) {
    const wanted = normalizeCode(code);
    if (!wanted) return null;
    // Codes are stored as the seller typed them, so match in memory rather
    // than relying on the database's collation.
    const all = await this.prisma.coupon.findMany({ where: { sellerId } });
    const found = all.find((c) => normalizeCode(c.code) === wanted);
    if (!found) throw new BadRequestException('That code isn’t valid for this store.');
    return found;
  }

  /**
   * Identify the shopper from a bearer token on an unguarded route.
   *
   * Returns null for anything that isn't a valid customer token for this
   * store — a guest, an expired token, a seller's token — because the caller
   * only uses this to tighten limits, never to grant access.
   */
  private async customerFromHeader(authHeader: string | undefined, sellerId: string) {
    const token = /^Bearer\s+(.+)$/i.exec(String(authHeader || ''))?.[1];
    if (!token) return null;
    try {
      const payload: any = await this.jwt.verifyAsync(token);
      if (payload?.role !== 'customer' || payload?.sellerId !== sellerId) return null;
      return String(payload.sub);
    } catch {
      return null;
    }
  }

  /** How many times this customer has already redeemed a given coupon. */
  private async couponUses(couponId: string, customerId?: string | null) {
    if (!customerId) return 0;
    return this.prisma.couponRedemption.count({ where: { couponId, customerId } });
  }

  /**
   * Price a coupon against a cart without redeeming it.
   *
   * Shares `discountFor` with checkout, so the figure quoted here is exactly
   * the figure charged — the buyer can never be shown one price and billed
   * another.
   */
  async previewCoupon(authHeader: string | undefined, username: string, code: string, itemsSubtotal: number) {
    const seller = await this.prisma.seller.findUnique({ where: { username }, select: { id: true } });
    if (!seller) throw new NotFoundException('Store not found');

    const subtotal = Math.max(0, Math.round(Number(itemsSubtotal) || 0));
    const coupon = await this.findCoupon(seller.id, code);
    if (!coupon) throw new BadRequestException('Enter a code.');

    // The route is public so a guest can price a code, but if the shopper is
    // signed in their token is read here — otherwise a per-customer limit
    // would quote a discount at preview that checkout then refuses.
    const customerId = await this.customerFromHeader(authHeader, seller.id);
    const discount = discountFor(coupon, subtotal, {
      customerUses: await this.couponUses(coupon.id, customerId),
    });

    return {
      code: coupon.code,
      description: describeCoupon(coupon as any),
      discount,
      // Recomputed by the server on checkout regardless of what's shown here.
      newItemsTotal: subtotal - discount,
    };
  }

  // ── checkout ──
  async checkout(user: any, dto: any) {
    const { customerId, sellerId } = this.assertCustomer(user);
    if (!dto.items?.length) throw new BadRequestException('Your cart is empty');
    const ids = [...new Set(dto.items.map((i: any) => i.productId))];
    // Free stock still held by abandoned unpaid orders for these products
    // before checking availability — see PaymentsService.releaseAbandoned.
    await this.payments.releaseAbandoned(ids as string[]);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids as string[] }, sellerId } });
    if (products.length !== ids.length) throw new BadRequestException('An item is unavailable');

    let address = dto.address as string | undefined;
    if (dto.addressId) {
      const a = await this.prisma.address.findFirst({ where: { id: dto.addressId, customerId } });
      if (a) address = `${a.name}, ${a.line1}${a.line2 ? ', ' + a.line2 : ''}, ${a.city} - ${a.pincode}${a.state ? ', ' + a.state : ''} · ${a.phone}`;
    }
    if (!address) throw new BadRequestException('A delivery address is required');

    let itemsAmount = 0;
    const rows = dto.items.map((i: any) => {
      const p = products.find((x) => x.id === i.productId)!;
      const qty = Number(i.quantity) || 1;
      if (p.quantity < qty) throw new BadRequestException(`"${p.title}" is out of stock`);
      itemsAmount += p.price * qty;
      return { productId: p.id, title: i.size ? `${p.title} (${i.size})` : p.title, unitPrice: p.price, quantity: qty };
    });

    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { shippingFee: true, minOrderAmount: true, freeShipEnabled: true, freeShipThreshold: true } });
    if (seller?.minOrderAmount && itemsAmount < seller.minOrderAmount) {
      throw new BadRequestException(`Minimum order is ₹${seller.minOrderAmount.toLocaleString('en-IN')} — add more items to check out.`);
    }
    let shippingCharge = seller?.shippingFee != null ? seller.shippingFee : this.shippingFlat;
    if (seller?.freeShipEnabled && seller.freeShipThreshold != null && itemsAmount >= seller.freeShipThreshold) shippingCharge = 0;

    // Coupon, if the buyer supplied one. The discount is recomputed here from
    // the coupon row — never taken from the request — so a tampered client
    // cannot award itself money.
    const coupon = dto.couponCode ? await this.findCoupon(sellerId, dto.couponCode) : null;
    const discountAmount = coupon
      ? discountFor(coupon, itemsAmount, { customerUses: await this.couponUses(coupon.id, customerId) })
      : 0;

    // One formula, from common/money — customer pays net goods + shipping + fee.
    const amounts = computeAmounts(itemsAmount, shippingCharge, discountAmount, this.commissionPct);
    const commissionAmount = amounts.fee;
    const totalAmount = amounts.customerTotal;
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    // Payment method: 'cod' (Cash on Delivery) or 'online:<upi|card|netbanking>'.
    // Stored in paymentId so no schema migration is needed. COD orders still enter
    // the seller's queue (status 'Paid' = confirmed) so they can accept & ship; cash
    // is collected on delivery.
    const method = dto.paymentMethod === 'online' ? 'online' : 'cod';
    // Online orders are created unpaid and become Paid only when the gateway
    // confirms the money (PaymentsService.settle). Until now they were created
    // as Paid with nothing collected, so every "online" order counted toward
    // seller balances and payouts without anyone having paid.
    //
    // With no gateway configured, checkout refuses rather than falling back to
    // that: an order marked Paid that nobody paid for is worse than no order.
    if (method === 'online' && !this.payments.enabled) {
      throw new BadRequestException('Online payments aren’t available right now. Please try again shortly.');
    }
    // FamGateway takes UPI only, whatever the client asked for.
    const paymentId = method === 'online' ? 'online:upi' : 'cod';

    // Only the order + stock decrement need to be atomic. The seller
    // notification is fired after the commit so a slow insert can't roll back a
    // paid order.
    //
    // The timeout is well above Prisma's 5s default on purpose: every statement
    // is a round trip to Neon, and a suspended Neon compute takes seconds to
    // wake, which blew the default and 500'd checkout.
    const order = await this.prisma.$transaction(
      async (tx) => {
        const created = await tx.order.create({
          data: {
            sellerId, customerId, buyerName: customer?.name || dto.name || 'Customer', buyerPhone: customer?.phone || dto.phone || null,
            address, itemsAmount, commissionAmount, shippingCharge, totalAmount,
            status: method === 'online' ? 'PendingPayment' : 'Paid',
            discountAmount: amounts.discount,
            couponCode: coupon ? coupon.code : null,
            paymentId,
            items: { create: rows },
          },
          include: { items: true },
        });
        /*
         * Stock only comes off once the money is real.
         *
         * A COD order is confirmed the moment it is placed, so its items leave
         * the catalogue here. An online order is not. It used to decrement
         * stock as a reservation, so a buyer who closed the UPI page — or
         * cancelled — quietly took items out of the seller's stock, and the
         * seller watched their count fall for orders that were never paid.
         * Online orders decrement in payments.service settle(), when the
         * gateway confirms the payment.
         */
        if (method === 'cod') {
          for (const r of rows) {
            await tx.product.update({ where: { id: r.productId }, data: { quantity: { decrement: r.quantity } } });
          }
        }

        // Redemption is recorded inside the same transaction as the order, so
        // a coupon can never be counted as used against an order that failed —
        // nor used twice past its limit by two simultaneous checkouts.
        if (coupon && amounts.discount > 0) {
          const { count } = await tx.coupon.updateMany({
            where: {
              id: coupon.id,
              // Re-check the cap at write time; the read above may be stale.
              ...(coupon.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (count === 0) throw new BadRequestException('That code has just been fully redeemed.');
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id, sellerId, customerId,
              orderId: created.id, amount: amounts.discount,
            },
          });
        }
        return created;
      },
      { timeout: 20000, maxWait: 15000 },
    );

    if (method === 'online') {
      // The seller is told once the payment lands (PaymentsService.settle), not
      // now — an order someone abandons at the UPI page is not a sale.
      //
      // If the gateway can't open a session the order is still returned, unpaid
      // and holding its stock, so the buyer can retry from the checkout page
      // instead of losing their cart to a transient gateway error.
      try {
        const payment = await this.payments.startPayment(order.id, user, dto.returnUrl);
        return { ...order, payment };
      } catch (e: any) {
        return { ...order, payment: null, paymentError: e?.message || 'We could not start the payment.' };
      }
    }

    await this.prisma.notification.create({
      data: {
        sellerId, type: 'new_order', title: 'New order 🎉',
        body: `${customer?.name || 'A customer'} placed an order worth ₹${totalAmount.toLocaleString('en-IN')}.`,
        link: '/seller/orders',
      },
    }).catch(() => { /* never fail a placed order over a notification */ });

    /*
     * The buyer's copy of a cash-on-delivery order: the same itemised bill as
     * a paid receipt, but headed with what is still owed rather than what was
     * charged. Online orders get theirs from payments.service, once the money
     * is confirmed.
     */
    if (customer?.email) {
      const store = await this.prisma.seller.findUnique({
        where: { id: sellerId },
        select: { storeName: true, username: true, contactEmail: true, user: { select: { email: true } } },
      });
      const base = (process.env.PUBLIC_WEB_URL || '').replace(/\/$/, '');
      const mail = orderReceiptEmail(order, {
        storeName: store?.storeName,
        storeContact: store?.contactEmail || store?.user?.email || null,
        ordersUrl: base && store?.username ? `${base}/s/${store.username}/orders` : null,
      });
      await sendMail(customer.email, mail.subject, mail.html, mail.text)
        .catch(() => { /* a receipt must never undo a placed order */ });
    }

    return order;
  }

  async getOrders(user: any) {
    const { customerId, sellerId } = this.assertCustomer(user);
    const [orders, seller] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      /*
       * Attached to each order so a buyer who needs to cancel or return knows
       * who to reach — every channel the seller published, not just email and
       * phone. WhatsApp is the one most Indian shoppers actually use, and it
       * was being collected in the seller's profile and never passed on.
       */
      this.prisma.seller.findUnique({
        where: { id: sellerId },
        select: {
          storeName: true, contactEmail: true, contactPhone: true, whatsapp: true, instagram: true,
          // Last resort. Most stores have published nothing at all, and a buyer
          // who needs to cancel is then left with no route whatsoever — worse
          // than showing the address the seller signed up with, which is a
          // business address in all but name.
          user: { select: { email: true } },
        },
      }),
    ]);

    // Which of these has already been rated, so the list can ask for a review
    // exactly once rather than offering a form that would be refused.
    const reviews = await this.prisma.review.findMany({
      where: { orderId: { in: orders.map((o) => o.id) } },
      select: { orderId: true, rating: true, comment: true, createdAt: true },
    });
    const byOrder = new Map(reviews.map((r) => [r.orderId, r]));

    return orders.map((o) => ({
      ...o,
      seller,
      review: byOrder.get(o.id) || null,
      // Delivered goods, not yet rated — the only state where we ask.
      canReview: ['Delivered', 'Completed'].includes(o.status) && !byOrder.has(o.id),
    }));
  }

  /**
   * Buyer cancels their own order.
   *
   * Stock is only returned when the goods haven't reached the customer — once an
   * order is Delivered or Completed the items are physically gone, so putting
   * them back would oversell the catalogue.
   */
  /**
   * Ask the store to cancel an order.
   *
   * Buyers no longer cancel orders themselves. A seller may have already
   * packed or posted the parcel, and the outcome a buyer actually wants —
   * cancelled, or a different size, or a changed address — is usually a
   * conversation rather than a button. This carries their message to the
   * store's inbox and also drops it in their console, so the request survives
   * mail being down or an address going stale.
   */
  async requestCancellation(user: any, orderId: string, message: string) {
    const { customerId } = this.assertCustomer(user);
    const text = String(message || '').trim();
    if (!text) throw new BadRequestException('Please write a short message for the store.');
    if (text.length > 1000) throw new BadRequestException('Please keep your message under 1000 characters.');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (['Cancelled', 'Refunded'].includes(order.status)) {
      throw new BadRequestException('This order is already cancelled.');
    }

    const [seller, customer] = await Promise.all([
      this.prisma.seller.findUnique({
        where: { id: order.sellerId },
        select: { storeName: true, contactEmail: true, user: { select: { email: true } } },
      }),
      this.prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, email: true } }),
    ]);

    // The console copy goes in first: it is the one that cannot bounce.
    await this.prisma.notification.create({
      data: {
        sellerId: order.sellerId,
        type: 'cancel_request',
        title: 'Cancellation requested ✕',
        body: `${customer?.name || 'A customer'} asked to cancel #${order.id.slice(-6).toUpperCase()}: ${text.slice(0, 200)}`,
        link: '/seller/orders',
      },
    }).catch(() => { /* a notification must never sink the request */ });

    const to = seller?.contactEmail || seller?.user?.email;
    let emailed = false;
    if (to) {
      const m = cancelRequestEmail(order, seller?.storeName, { name: customer?.name, email: customer?.email }, text);
      emailed = await sendMail(to, m.subject, m.html, m.text).catch(() => false);
    }

    return { sent: true, emailed, store: seller?.storeName || null };
  }

  async cancelOrder(user: any, orderId: string, reason?: string) {
    const { customerId } = this.assertCustomer(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'Cancelled') throw new BadRequestException('This order is already cancelled.');
    /*
     * Self-cancelling stops at dispatch, and this is where that becomes true.
     * The endpoint accepted any status but Cancelled, so a Delivered — even
     * Completed — order could be cancelled by the buyer after they had the
     * goods, reversing the seller's earnings for something already shipped.
     */
    if (!BUYER_CANCELLABLE.includes(order.status)) {
      throw new BadRequestException(
        order.status === 'Shipped'
          ? 'This order has already been dispatched — please contact the store to arrange a return.'
          : `An order that is ${order.status.toLowerCase()} can no longer be cancelled here. Please contact the store to arrange a return or refund.`,
      );
    }

    /*
     * Stock is only given back if it was ever taken: an unpaid online order
     * never decremented it, and goods already with the customer are gone.
     */
    const restock = !['Delivered', 'Completed', 'PendingPayment'].includes(order.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (restock) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'Cancelled',
          cancelledBy: 'buyer',
          cancelReason: String(reason || '').trim().slice(0, 300) || null,
        },
        include: { items: true },
      });
    }, { timeout: 20000, maxWait: 15000 });

    // Surface it in the seller's console immediately.
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } });
    await this.prisma.notification.create({
      data: {
        sellerId: order.sellerId,
        type: 'order_cancelled',
        title: 'Order cancelled ✕',
        body: `${customer?.name || 'A customer'} cancelled order #${orderId.slice(-6).toUpperCase()} (₹${(order.totalAmount || 0).toLocaleString('en-IN')}).`
          + (String(reason || '').trim() ? ` Reason: ${String(reason).trim().slice(0, 200)}` : ''),
        link: '/seller/orders',
      },
    }).catch(() => { /* never fail the cancellation over a notification */ });

    return updated;
  }
}
