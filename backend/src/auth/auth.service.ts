import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto';
import { verifyGoogleIdToken } from './google-verify';

// In MVP scaffold OTPs live in memory. In production this is Redis with a
// short TTL (PRD §12 Auth). A master code keeps local demos friction-free.
const MASTER_CODE = '0000';

@Injectable()
export class AuthService {
  private otps = new Map<string, string>();

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async requestOtp(phone: string) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    this.otps.set(phone, code);
    // In production this is sent over SMS/WhatsApp; here we return it for dev.
    return { sent: true, devCode: code, hint: `Use ${code} or master code ${MASTER_CODE}` };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const expected = this.otps.get(phone);
    if (code !== MASTER_CODE && code !== expected) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    this.otps.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, name: name || 'Buyer', role: 'buyer' },
      });
    }

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      sellerId: seller?.id || null,
    });

    return {
      accessToken: token,
      user: { id: user.id, name: user.name, role: user.role, sellerId: seller?.id || null },
    };
  }

  // ───────── email + password seller auth (PRD §Authentication) ─────────

  private slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'store';
  }

  private async uniqueUsername(base: string) {
    let candidate = this.slugify(base);
    let n = 0;
    // eslint-disable-next-line no-constant-condition
    while (await this.prisma.seller.findUnique({ where: { username: candidate } })) {
      n += 1;
      candidate = `${this.slugify(base)}${n}`;
    }
    return candidate;
  }

  private async issueSession(userId: string, name: string | null, role: string, sellerId: string | null) {
    const token = await this.jwt.signAsync({ sub: userId, role, sellerId });
    return { accessToken: token, user: { id: userId, name, role, sellerId } };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const username = await this.uniqueUsername(dto.username || dto.storeName);
    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: { email, name: dto.name, password: hash, role: 'seller' },
    });

    const seller = await this.prisma.seller.create({
      data: {
        userId: user.id,
        storeName: dto.storeName,
        username,
        kycStatus: 'approved', // auto-approved in MVP so the store is usable immediately
      },
    });

    return this.issueSession(user.id, user.name, user.role, seller.id);
  }

  async changePassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new ConflictException('Password must be at least 6 characters');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
    return { ok: true };
  }

  /**
   * Exchange a Google ID token (from "Continue with Google" on the seller
   * console) for a Loopy JWT, creating the seller account on first sign-in.
   *
   * An existing admin signing in with Google keeps their admin role — we only
   * provision a store for accounts that aren't already something else.
   */
  async loginWithGoogle(idToken: string) {
    const { email, name } = await verifyGoogleIdToken(idToken);

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email, name, role: 'seller' } });
    } else if (!user.name) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    if (user.role === 'admin') {
      return this.issueSession(user.id, user.name, user.role, null);
    }

    let seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) {
      const username = await this.uniqueUsername(name || email);
      seller = await this.prisma.seller.create({
        data: { userId: user.id, storeName: name || 'My Store', username, kycStatus: 'approved' },
      });
      // A buyer who later opens a store becomes a seller.
      if (user.role !== 'seller') {
        user = await this.prisma.user.update({ where: { id: user.id }, data: { role: 'seller' } });
      }
    }

    return this.issueSession(user.id, user.name, user.role, seller.id);
  }

  async loginEmail(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.password) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    return this.issueSession(user.id, user.name, user.role, seller?.id || null);
  }
}
