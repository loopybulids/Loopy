import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma, with the first-query penalty paid at boot instead of by a user.
 *
 * Measured against this project's Neon instance from India:
 *
 *   SELECT 1  #1   2669ms     ← TCP + TLS + Neon compute waking from suspend
 *   SELECT 1  #2    304ms     ← steady state: the round trip to us-east-2
 *   SELECT 1  #3    278ms
 *
 * `$connect()` alone does not absorb that: it opens a connection, but the
 * compute only spins up when a statement actually arrives. So the first real
 * request after a restart — or after Neon suspends an idle branch — waited
 * ~2.6s, which is most of why the app felt dead locally while production,
 * whose traffic keeps the compute warm and which sits beside the database,
 * felt instant.
 *
 * Running one throwaway statement here moves that cost to startup.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Prisma');
  private keepAlive?: ReturnType<typeof setInterval>;

  async onModuleInit() {
    const t0 = Date.now();
    await this.$connect();

    // Wake the compute now, so the first user request doesn't.
    try {
      await this.$queryRaw`SELECT 1`;
      this.log.log(`database ready in ${Date.now() - t0}ms`);
    } catch (e: any) {
      // A failed warm-up is not fatal — the app should still start and let
      // individual requests report the real error.
      this.log.warn(`warm-up query failed (${e?.message || e}); continuing`);
    }

    /**
     * Optional keep-alive, off unless DB_KEEPALIVE_MS is set.
     *
     * Neon suspends an idle compute, and every wake costs ~2.6s. Pinging keeps
     * it up — but a compute that never sleeps consumes compute hours
     * continuously, which will exhaust a free Neon allowance. Enable it only
     * for local development sessions, never in production.
     */
    const every = Number(process.env.DB_KEEPALIVE_MS || 0);
    if (every >= 30_000) {
      this.keepAlive = setInterval(() => {
        this.$queryRaw`SELECT 1`.catch(() => {});
      }, every);
      // Don't hold the process open on shutdown.
      this.keepAlive.unref?.();
      this.log.log(`keep-alive every ${Math.round(every / 1000)}s — uses Neon compute hours`);
    }
  }

  async onModuleDestroy() {
    if (this.keepAlive) clearInterval(this.keepAlive);
    await this.$disconnect();
  }
}
