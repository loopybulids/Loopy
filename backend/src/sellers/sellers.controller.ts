import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sellers')
export class SellersController {
  constructor(private sellers: SellersService) {}

  // Public discover — list all approved stores for the Shop page
  @Get()
  discover() {
    return this.sellers.discover();
  }

  // Public storefront (PRD §11 /s/[sellerUsername])
  @Get(':username')
  getStore(@Param('username') username: string) {
    return this.sellers.getStore(username);
  }

  // Public — record a storefront page view (traffic analytics)
  @Post(':username/visit')
  recordVisit(@Param('username') username: string, @Body() body: { session?: string; source?: string; referrer?: string }) {
    return this.sellers.recordVisit(username, body?.session, body?.source, body?.referrer);
  }

  // Authenticated seller — dashboard analytics (sales + traffic + live users)
  @UseGuards(JwtAuthGuard)
  @Get('me/analytics')
  analytics(@Req() req: any) {
    return this.sellers.getAnalytics(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/onboarding')
  onboarding(@Req() req: any) {
    return this.sellers.getOnboarding(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/reviews')
  reviews(@Req() req: any) {
    return this.sellers.getReviews(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/reviews/:id/respond')
  respondReview(@Req() req: any, @Param('id') id: string, @Body() body: { response: string }) {
    return this.sellers.respondReview(req.user.sellerId, id, body?.response || '');
  }

  // Authenticated seller — own profile
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMe(@Req() req: any) {
    return this.sellers.getMe(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  saveProfile(@Req() req: any, @Body() body: any) {
    return this.sellers.updateProfile(req.user.sellerId, body);
  }

  // Authenticated seller — own orders queue
  @UseGuards(JwtAuthGuard)
  @Get('me/orders')
  getOrders(@Req() req: any) {
    return this.sellers.getSellerOrders(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/products')
  getProducts(@Req() req: any) {
    return this.sellers.getProducts(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/wallet')
  getWallet(@Req() req: any) {
    return this.sellers.getWallet(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/payouts')
  payout(@Req() req: any) {
    return this.sellers.requestPayout(req.user.sellerId);
  }

  // Authenticated seller — save storefront builder config
  @UseGuards(JwtAuthGuard)
  @Put('me/store-config')
  saveStoreConfig(@Req() req: any, @Body() body: any) {
    return this.sellers.updateStoreConfig(req.user.sellerId, body?.config ?? body);
  }
}
