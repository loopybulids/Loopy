import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Proves the caller is a seller, not merely signed in.
 *
 * `JwtAuthGuard` only establishes that a token is valid. Customer tokens are
 * minted with the `sellerId` of the store they shop at — the session has to be
 * scoped to a store — so every route that trusted `req.user.sellerId` was
 * handing a shopper the keys to that store's console: its wallet, orders,
 * customer list, coupons, store config, and `POST me/payouts`.
 *
 * Use alongside JwtAuthGuard on anything that acts as a seller:
 *
 *   @UseGuards(JwtAuthGuard, SellerGuard)
 */
@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest()?.user;
    // Admins impersonate by being issued a genuine seller token, so this
    // deliberately checks the role rather than allowing an admin bypass.
    if (user?.role !== 'seller' || !user?.sellerId) {
      throw new ForbiddenException('This action is only available to sellers.');
    }
    return true;
  }
}
