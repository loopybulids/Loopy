import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('command')
  command(@Req() req: any) {
    return this.admin.command(req.user);
  }

  @Get('orders')
  orders(@Req() req: any, @Query('q') q?: string, @Query('status') status?: string) {
    return this.admin.orders(req.user, q, status);
  }

  @Get('orders/:id')
  orderDetail(@Req() req: any, @Param('id') id: string) {
    return this.admin.orderDetail(req.user, id);
  }

  /**
   * `expectedVersion` is the order version the operator was looking at, and
   * `Idempotency-Key` makes a retry safe. Both are enforced in the service —
   * see common/money-actions for why neither is optional.
   */
  @Post('orders/:id/action/:action')
  orderAction(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() body: any,
    @Headers('idempotency-key') idem?: string,
  ) {
    return this.admin.orderAction(req.user, id, action, {
      expectedVersion: body?.expectedVersion,
      idempotencyKey: idem || body?.idempotencyKey,
    });
  }

  @Post('orders/:id/refund-state')
  setRefundState(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
    @Headers('idempotency-key') idem?: string,
  ) {
    return this.admin.setRefundState(req.user, id, body?.to, {
      expectedVersion: body?.expectedVersion,
      idempotencyKey: idem || body?.idempotencyKey,
    });
  }

  // Every review, hidden ones included — see reviews().
  @Get('reviews')
  reviews(@Req() req: any, @Query('filter') filter?: string) {
    return this.admin.reviews(req.user, filter);
  }

  // The withdrawal queue — its own screen, see payouts().
  @Get('payouts')
  payouts(@Req() req: any) {
    return this.admin.payouts(req.user);
  }

  /**
   * Decide a seller's withdrawal. `expectedVersion` + Idempotency-Key are
   * enforced in the service — this pays real money.
   */
  @Post('payouts/:id/:action')
  payoutAction(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'reject',
    @Body() body: any,
    @Headers('idempotency-key') idem?: string,
  ) {
    return this.admin.payoutAction(req.user, id, action, {
      expectedVersion: body?.expectedVersion,
      idempotencyKey: idem || body?.idempotencyKey,
      note: body?.note,
    });
  }

  @Get('orders/:id/audit')
  orderAudit(@Req() req: any, @Param('id') id: string) {
    return this.admin.orderAudit(req.user, id);
  }

  @Get('customers')
  customers(@Req() req: any, @Query('q') q?: string) {
    return this.admin.customers(req.user, q);
  }

  @Get('customers/:key')
  customerDetail(@Req() req: any, @Param('key') key: string) {
    return this.admin.customerDetail(req.user, key);
  }

  @Get('finance')
  finance(@Req() req: any) {
    return this.admin.finance(req.user);
  }

  @Get('analytics')
  analytics(@Req() req: any) {
    return this.admin.analytics(req.user);
  }

  @Get('sellers/:id/detail')
  sellerDetail(@Req() req: any, @Param('id') id: string) {
    return this.admin.sellerDetail(req.user, id);
  }

  @Post('sellers/:id/impersonate')
  impersonate(@Req() req: any, @Param('id') id: string) {
    return this.admin.impersonate(req.user, id);
  }

  @Get('stats')
  stats(@Req() req: any) {
    return this.admin.stats(req.user);
  }

  @Get('overview')
  overview(@Req() req: any) {
    return this.admin.overview(req.user);
  }

  @Get('sellers')
  sellers(@Req() req: any) {
    return this.admin.sellers(req.user);
  }

  @Post('sellers/:id/approve')
  approve(@Req() req: any, @Param('id') id: string) {
    return this.admin.setKyc(req.user, id, 'approved');
  }

  @Post('sellers/:id/reject')
  reject(@Req() req: any, @Param('id') id: string) {
    return this.admin.setKyc(req.user, id, 'rejected');
  }

  @Get('disputes')
  disputes(@Req() req: any) {
    return this.admin.disputes(req.user);
  }

  @Post('disputes/:id/resolve')
  resolve(@Req() req: any, @Param('id') id: string, @Body() body: { resolution: 'refunded' | 'released' }) {
    return this.admin.resolveDispute(req.user, id, body.resolution || 'refunded');
  }
}
