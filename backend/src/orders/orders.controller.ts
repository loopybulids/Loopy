import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerGuard } from '../auth/seller.guard';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.orders.checkout(dto);
  }

  // Seller records a manual order (e.g. from a DM) — marks Paid + decrements stock.
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post('manual')
  manual(@Req() req: any, @Body() dto: any) {
    return this.orders.createManual(req.user.sellerId, dto);
  }

  // Stubbed payment confirmation (stands in for the Razorpay webhook).
  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Req() req: any) {
    return this.orders.confirmPayment(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.orders.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req: any) {
    return this.orders.transition(id, req.user.sellerId, 'Accepted');
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post(':id/revert')
  revert(@Param('id') id: string, @Req() req: any) {
    return this.orders.revertStatus(id, req.user.sellerId);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post(':id/reject')
  reject(@Param('id') id: string, @Req() req: any, @Body() body: { reason?: string }) {
    return this.orders.rejectOrder(id, req.user.sellerId, body?.reason);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post(':id/ship')
  ship(@Param('id') id: string, @Req() req: any, @Body() body: { courier?: string; awbNumber?: string }) {
    return this.orders.transition(id, req.user.sellerId, 'Shipped', body?.courier, body?.awbNumber);
  }

  // Stands in for the Shiprocket "delivered" webhook — the seller marks it from
  // their order queue. Guarded: this used to be fully open, which let anyone who
  // knew an order id mark it delivered.
  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  deliver(@Param('id') id: string, @Req() req: any) {
    return this.orders.markDelivered(id, req.user?.sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Req() req: any) {
    return this.orders.confirmDelivery(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  review(@Param('id') id: string, @Req() req: any, @Body() body: { rating: number; comment?: string }) {
    return this.orders.addReview(id, Number(body.rating) || 5, body.comment, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dispute')
  dispute(@Param('id') id: string, @Req() req: any, @Body() body: { issueType?: string; description?: string }) {
    return this.orders.openDispute(id, body.issueType || 'Not as described', body.description, req.user);
  }
}
