import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sellers')
export class SellersController {
  constructor(private sellers: SellersService) {}

  // Public storefront (PRD §11 /s/[sellerUsername])
  @Get(':username')
  getStore(@Param('username') username: string) {
    return this.sellers.getStore(username);
  }

  // Authenticated seller — own profile
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMe(@Req() req: any) {
    return this.sellers.getMe(req.user.sellerId);
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
}
