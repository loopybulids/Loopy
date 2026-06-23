import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { EmailLoginDto, RegisterDto, RequestOtpDto, VerifyOtpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // ── phone/OTP (buyers + demo seller) ──
  @Post('login')
  login(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code, dto.name);
  }

  // ── email/password (seller SaaS) ──
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login-email')
  loginEmail(@Body() dto: EmailLoginDto) {
    return this.auth.loginEmail(dto.email, dto.password);
  }

  // ── Supabase session exchange (Google / email OTP) ──
  @Post('supabase')
  supabase(@Body() body: { token: string }) {
    return this.auth.loginWithSupabase(body?.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() body: { password: string }) {
    return this.auth.changePassword(req.user.userId, body.password);
  }
}
