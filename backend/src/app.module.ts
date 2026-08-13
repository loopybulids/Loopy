import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SellersModule } from './sellers/sellers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    /**
     * Global rate limit. Without it, sign-in and the 6-digit signup code can be
     * brute-forced at network speed — a 6-digit code is only a million guesses.
     *
     * Two windows: a burst allowance for normal browsing, and a slower ceiling
     * that makes sustained guessing impractical. Applied to everything rather
     * than just auth, so scraping the storefront API is also bounded.
     */
    ThrottlerModule.forRoot([
      { name: 'burst', ttl: 10_000, limit: 40 },
      { name: 'sustained', ttl: 60_000, limit: 150 },
    ]),
    PrismaModule,
    AuthModule,
    SellersModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
    CustomersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
