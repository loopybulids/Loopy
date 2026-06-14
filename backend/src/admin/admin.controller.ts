import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  stats(@Req() req: any) {
    return this.admin.stats(req.user);
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
