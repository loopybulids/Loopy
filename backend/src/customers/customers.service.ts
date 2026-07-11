import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

function parse(s: string): any[] { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }
function shape(p: any) { return { ...p, images: parse(p.images), variants: parse(p.variants), sizes: parse(p.sizes) }; }

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private commissionPct = Number(process.env.COMMISSION_PERCENT || 5);
  private shippingFlat = Number(process.env.SHIPPING_FLAT || 60);

  private async verifySupabase(token: string): Promise<{ email: string; name: string }> {
    const base = process.env.SUPABASE_URL;
    const apikey = process.env.SUPABASE_ANON_KEY;
    if (!base || !apikey) throw new UnauthorizedException('Auth not configured');
    let u: any;
    try {
      const res = await fetch(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey } });
      if (!res.ok) throw new Error(String(res.status));
      u = await res.json();
    } catch { throw new UnauthorizedException('Invalid session'); }
    const email = (u?.email || '').toLowerCase().trim();
    if (!email) throw new UnauthorizedException('No email on account');
    return { email, name: u?.user_metadata?.full_name || u?.user_metadata?.name || email.split('@')[0] };
  }

  // Sign in / sign up a shopper for a specific store; notify the seller on first signup.
  async authSupabase(username: string, token: string) {
    const seller = await this.prisma.seller.findUnique({ where: { username }, select: { id: true } });
    if (!seller) throw new NotFoundException('Store not found');
    const { email, name } = await this.verifySupabase(token);

    let customer = await this.prisma.customer.findUnique({ where: { sellerId_email: { sellerId: seller.id, email } } });
    let isNew = false;
    if (!customer) {
      customer = await this.prisma.customer.create({ data: { sellerId: seller.id, email, name } });
      isNew = true;
      await this.prisma.notification.create({
        data: { sellerId: seller.id, type: 'new_customer', title: 'New customer 👋', body: `${name} (${email}) signed up on your store.`, link: '/seller/customers' },
      });
    }
    const jwtToken = await this.jwt.signAsync({ sub: customer.id, role: 'customer', sellerId: seller.id });
    return { accessToken: jwtToken, customer: { id: customer.id, name: customer.name, email: customer.email }, isNew };
  }

  private assertCustomer(user: any) {
    if (!user || user.role !== 'customer') throw new ForbiddenException('Sign in to continue');
    return { customerId: user.userId as string, sellerId: user.sellerId as string };
  }

  async me(user: any) {
    const { customerId } = this.assertCustomer(user);
    return this.prisma.customer.findUnique({ where: { id: customerId }, include: { addresses: { orderBy: { isDefault: 'desc' } } } });
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

  // ── checkout ──
  async checkout(user: any, dto: any) {
    const { customerId, sellerId } = this.assertCustomer(user);
    if (!dto.items?.length) throw new BadRequestException('Your cart is empty');
    const ids = [...new Set(dto.items.map((i: any) => i.productId))];
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
    const commissionAmount = Math.round((itemsAmount * this.commissionPct) / 100);
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { shippingFee: true } });
    const shippingCharge = seller?.shippingFee != null ? seller.shippingFee : this.shippingFlat;
    const totalAmount = itemsAmount + shippingCharge;
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sellerId, customerId, buyerName: customer?.name || dto.name || 'Customer', buyerPhone: customer?.phone || dto.phone || null,
          address, itemsAmount, commissionAmount, shippingCharge, totalAmount, status: 'Paid',
          paymentId: 'pay_stub_' + Math.random().toString(36).slice(2, 10),
          items: { create: rows },
        },
        include: { items: true },
      });
      for (const r of rows) await tx.product.update({ where: { id: r.productId }, data: { quantity: { decrement: r.quantity } } });
      await tx.notification.create({
        data: { sellerId, type: 'new_order', title: 'New order 🎉', body: `${customer?.name || 'A customer'} placed an order worth ₹${totalAmount.toLocaleString('en-IN')}.`, link: '/seller/orders' },
      });
      return order;
    });
  }
}
