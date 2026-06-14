import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

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
}
