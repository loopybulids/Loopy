import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerGuard } from '../auth/seller.guard';

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
  // Lightweight brand lookup for storefront sub-pages (no catalogue payload).
  @Get(':username/brand')
  brand(@Param('username') username: string) {
    return this.sellers.getBrand(username);
  }

  @Post(':username/visit')
  recordVisit(@Param('username') username: string, @Body() body: { session?: string; source?: string; referrer?: string }) {
    return this.sellers.recordVisit(username, body?.session, body?.source, body?.referrer);
  }

  // Authenticated seller — dashboard analytics (sales + traffic + live users)
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/analytics')
  analytics(@Req() req: any) {
    return this.sellers.getAnalytics(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/onboarding')
  onboarding(@Req() req: any) {
    return this.sellers.getOnboarding(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/reviews')
  reviews(@Req() req: any) {
    return this.sellers.getReviews(req.user.sellerId);
  }

  // Hide a review from the storefront. It is not deleted — see hideReview.
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/reviews/:id/hide')
  hideReview(@Req() req: any, @Param('id') id: string, @Body() body: { hidden?: boolean; reason?: string }) {
    return this.sellers.hideReview(req.user.sellerId, id, body?.hidden !== false, body?.reason);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/reviews/:id/respond')
  respondReview(@Req() req: any, @Param('id') id: string, @Body() body: { response: string }) {
    return this.sellers.respondReview(req.user.sellerId, id, body?.response || '');
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/notifications')
  notifications(@Req() req: any) {
    return this.sellers.getNotifications(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/notifications/read')
  readNotifications(@Req() req: any) {
    return this.sellers.markNotificationsRead(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/customers')
  myCustomers(@Req() req: any) {
    return this.sellers.getCustomers(req.user.sellerId);
  }

  // ── collections: seller-curated groups of their own products ──
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/collections')
  collections(@Req() req: any) {
    return this.sellers.getCollections(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/collections')
  createCollection(@Req() req: any, @Body() body: any) {
    return this.sellers.createCollection(req.user.sellerId, body);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put('me/collections/:id')
  updateCollection(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.sellers.updateCollection(req.user.sellerId, id, body);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Delete('me/collections/:id')
  deleteCollection(@Req() req: any, @Param('id') id: string) {
    return this.sellers.deleteCollection(req.user.sellerId, id);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/coupons')
  coupons(@Req() req: any) {
    return this.sellers.getCoupons(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/coupons')
  createCoupon(@Req() req: any, @Body() body: any) {
    return this.sellers.createCoupon(req.user.sellerId, body);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put('me/coupons/:id')
  updateCoupon(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.sellers.updateCoupon(req.user.sellerId, id, body);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Delete('me/coupons/:id')
  deleteCoupon(@Req() req: any, @Param('id') id: string) {
    return this.sellers.deleteCoupon(req.user.sellerId, id);
  }

  // Authenticated seller — own profile
  // Everything the dashboard needs, in one round trip instead of four.
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/dashboard')
  dashboard(@Req() req: any) {
    return this.sellers.getDashboard(req.user.sellerId);
  }

  // The console shell's own needs — deliberately tiny, called on every page.
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/summary')
  summary(@Req() req: any) {
    return this.sellers.getSummary(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/profile')
  getMe(@Req() req: any) {
    return this.sellers.getMe(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put('me/profile')
  saveProfile(@Req() req: any, @Body() body: any) {
    return this.sellers.updateProfile(req.user.sellerId, body);
  }

  // Authenticated seller — own orders queue
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/orders')
  getOrders(@Req() req: any) {
    return this.sellers.getSellerOrders(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/products')
  getProducts(@Req() req: any) {
    return this.sellers.getProducts(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/wallet')
  getWallet(@Req() req: any) {
    return this.sellers.getWallet(req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('me/payouts')
  payout(@Req() req: any) {
    return this.sellers.requestPayout(req.user.sellerId);
  }

  /**
   * The seller's own data as a CSV file: orders | summary | payouts | products.
   * `from` / `to` are IST days (YYYY-MM-DD), or from=all.
   */
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get('me/export/:dataset')
  async exportData(
    @Req() req: any,
    @Param('dataset') dataset: string,
    @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const out = await this.sellers.exportData(req.user.sellerId, dataset, from, to);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return out.csv;
  }

  // Authenticated seller — save storefront builder config
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put('me/store-config')
  saveStoreConfig(@Req() req: any, @Body() body: any) {
    return this.sellers.updateStoreConfig(req.user.sellerId, body?.config ?? body);
  }
}
