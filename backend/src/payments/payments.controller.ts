import { Body, Controller, Headers, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Open (or re-open) the UPI payment for an unpaid order. Returns the hosted checkout URL. */
  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/pay')
  pay(@Req() req: any, @Param('id') id: string, @Body() body: { returnUrl?: string }) {
    return this.payments.startPayment(id, req.user, body?.returnUrl);
  }

  /** Has this order been paid? Checked with the gateway; polled by the buyer after checkout. */
  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/verify-payment')
  verify(@Req() req: any, @Param('id') id: string) {
    return this.payments.settle(id, { user: req.user, source: 'return' });
  }

  /**
   * FamGateway's webhook. Public, signature-checked, and exempt from the
   * global rate limit so a burst of payments is never refused.
   */
  @SkipThrottle()
  @HttpCode(200)
  @Post('payments/famgateway/webhook')
  webhook(@Req() req: any, @Headers('x-famgateway-signature') signature: string | undefined, @Body() body: any) {
    return this.payments.handleWebhook(req.rawBody, signature, body);
  }
}
