import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @Post('orders/:id/:action')
  orderAction(@Req() req: any, @Param('id') id: string, @Param('action') action: string) {
    return this.admin.orderAction(req.user, id, action);
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
