import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class CustomersController {
  constructor(private customers: CustomersService) {}

  // Public — shopper signs in / signs up for a store.
  @Post('stores/:username/customer-auth/google')
  authGoogle(@Param('username') username: string, @Body() body: { token: string }) {
    return this.customers.authGoogle(username, body?.token);
  }

  // Signup is two steps: register emails a 6-digit code, verify creates the account.
  @Post('stores/:username/customer-auth/register')
  authRegister(@Param('username') username: string, @Body() body: any) {
    return this.customers.registerCustomer(username, body);
  }

  @Post('stores/:username/customer-auth/verify')
  authVerify(@Param('username') username: string, @Body() body: any) {
    return this.customers.verifySignup(username, body?.email, body?.code);
  }

  @Post('stores/:username/customer-auth/login')
  authLogin(@Param('username') username: string, @Body() body: any) {
    return this.customers.loginCustomer(username, body?.email, body?.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/me')
  me(@Req() req: any) { return this.customers.me(req.user); }

  @UseGuards(JwtAuthGuard)
  @Put('customer/me')
  updateMe(@Req() req: any, @Body() body: any) { return this.customers.updateMe(req.user, body); }

  @UseGuards(JwtAuthGuard)
  @Get('customer/wishlist')
  wishlist(@Req() req: any) { return this.customers.getWishlist(req.user); }

  @UseGuards(JwtAuthGuard)
  @Get('customer/wishlist/ids')
  wishlistIds(@Req() req: any) { return this.customers.wishlistIds(req.user); }

  @UseGuards(JwtAuthGuard)
  @Post('customer/wishlist/:productId')
  addWishlist(@Req() req: any, @Param('productId') productId: string) { return this.customers.addWishlist(req.user, productId); }

  @UseGuards(JwtAuthGuard)
  @Delete('customer/wishlist/:productId')
  removeWishlist(@Req() req: any, @Param('productId') productId: string) { return this.customers.removeWishlist(req.user, productId); }

  @UseGuards(JwtAuthGuard)
  @Get('customer/addresses')
  addresses(@Req() req: any) { return this.customers.getAddresses(req.user); }

  @UseGuards(JwtAuthGuard)
  @Post('customer/addresses')
  addAddress(@Req() req: any, @Body() body: any) { return this.customers.addAddress(req.user, body); }

  @UseGuards(JwtAuthGuard)
  @Post('customer/checkout')
  checkout(@Req() req: any, @Body() body: any) { return this.customers.checkout(req.user, body); }

  @UseGuards(JwtAuthGuard)
  @Get('customer/orders')
  orders(@Req() req: any) { return this.customers.getOrders(req.user); }
}
