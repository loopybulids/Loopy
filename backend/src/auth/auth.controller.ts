import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { EmailLoginDto, RegisterDto, RequestOtpDto, VerifyOtpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // ── phone/OTP (buyers + demo seller) ──
  @Throttle({ sustained: { ttl: 60_000, limit: 8 } })
  @Post('login')
  login(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Throttle({ sustained: { ttl: 60_000, limit: 8 } })
  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code, dto.name);
  }

  // ── email/password (seller SaaS) ──
  @Throttle({ sustained: { ttl: 60_000, limit: 8 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Throttle({ sustained: { ttl: 60_000, limit: 8 } })
  @Post('login-email')
  loginEmail(@Body() dto: EmailLoginDto) {
    return this.auth.loginEmail(dto.email, dto.password);
  }

  // ── Google Sign-In (ID token from Google Identity Services) ──
  @Post('google')
  google(@Body() body: { token: string }) {
    return this.auth.loginWithGoogle(body?.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() body: { password: string }) {
    return this.auth.changePassword(req.user.userId, body.password);
  }
}
