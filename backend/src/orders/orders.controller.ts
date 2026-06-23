import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.orders.checkout(dto);
  }

  // Seller records a manual order (e.g. from a DM) — marks Paid + decrements stock.
  @UseGuards(JwtAuthGuard)
  @Post('manual')
  manual(@Req() req: any, @Body() dto: any) {
    return this.orders.createManual(req.user.sellerId, dto);
  }

  // Stubbed payment confirmation (stands in for the Razorpay webhook).
  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.orders.confirmPayment(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req: any) {
    return this.orders.transition(id, req.user.sellerId, 'Accepted');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/ship')
  ship(@Param('id') id: string, @Req() req: any) {
    return this.orders.transition(id, req.user.sellerId, 'Shipped');
  }

  // Stub for the Shiprocket delivered webhook (open for demo convenience).
  @Post(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.orders.markDelivered(id);
  }

  @Post(':id/confirm-delivery')
  confirmDelivery(@Param('id') id: string) {
    return this.orders.confirmDelivery(id);
  }

  @Post(':id/reviews')
  review(@Param('id') id: string, @Body() body: { rating: number; comment?: string }) {
    return this.orders.addReview(id, Number(body.rating) || 5, body.comment);
  }

  @Post(':id/dispute')
  dispute(@Param('id') id: string, @Body() body: { issueType?: string; description?: string }) {
    return this.orders.openDispute(id, body.issueType || 'Not as described', body.description);
  }
}
