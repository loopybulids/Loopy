import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  // `from` / `to` are IST days (YYYY-MM-DD), or from=all — see common/date-range.
  @Get('command')
  command(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.command(req.user, from, to);
  }

  @Get('notifications')
  notifications(@Req() req: any) {
    return this.admin.notifications(req.user);
  }

  /**
   * A CSV file for a period: orders | summary | payouts | sellers. Sent as a
   * file rather than JSON so it opens straight into a spreadsheet; every call
   * is audit-logged in the service.
   */
  @Get('export/:dataset')
  async exportData(
    @Req() req: any,
    @Param('dataset') dataset: string,
    @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const out = await this.admin.exportData(req.user, dataset, from, to);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return out.csv;
  }

  @Get('orders')
  orders(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.orders(req.user, q, status, from, to);
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
  /** Contact-form messages and seller reports. */
  @Get('support/inbox')
  supportInbox(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.supportInbox(req.user, from, to);
  }

  @Post('support/:id/:action')
  supportDecide(@Req() req: any, @Param('id') id: string, @Param('action') action: 'resolve' | 'reopen') {
    return this.admin.setSupportResolved(req.user, id, action);
  }

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

  /**
   * Release an order's money to the seller, or put it back on hold. Both move
   * a seller's balance, so version + Idempotency-Key are enforced in the service.
   */
  @Post('orders/:id/funds/:action')
  fundsAction(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: 'release' | 'hold',
    @Body() body: any,
    @Headers('idempotency-key') idem?: string,
  ) {
    return this.admin.setFundsRelease(req.user, id, action, {
      expectedVersion: body?.expectedVersion,
      idempotencyKey: idem || body?.idempotencyKey,
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
  finance(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.finance(req.user, from, to);
  }

  @Get('analytics')
  analytics(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.analytics(req.user, from, to);
  }

  /** Site traffic, read back from Google Analytics — see common/ga. */
  @Get('traffic')
  traffic(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.traffic(req.user, from, to);
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
