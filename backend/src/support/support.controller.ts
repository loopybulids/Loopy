import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerGuard } from '../auth/seller.guard';
import { ContactDto, SellerReportDto } from './dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private support: SupportService) {}

  /**
   * The public contact form.
   *
   * Throttled well below the global allowance: this is an unauthenticated
   * endpoint that writes a record and sends email, which is a spam relay if
   * left open at browsing speed. Three a minute and ten an hour is generous
   * for a person with a question and useless to anyone with a list.
   */
  @Throttle({ burst: { ttl: 60_000, limit: 3 }, sustained: { ttl: 3_600_000, limit: 10 } })
  @Post('contact')
  contact(@Body() dto: ContactDto) {
    return this.support.contact(dto);
  }

  /** A seller reporting a bug or a problem with the platform. */
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Throttle({ burst: { ttl: 60_000, limit: 5 }, sustained: { ttl: 3_600_000, limit: 20 } })
  @Post('seller')
  sellerReport(@Req() req: any, @Body() dto: SellerReportDto) {
    return this.support.sellerReport(req.user.sellerId, dto);
  }

  /** What this seller has reported, and what has been done about it. */
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('seller')
  mySubmissions(@Req() req: any) {
    return this.support.mySubmissions(req.user.sellerId);
  }
}
