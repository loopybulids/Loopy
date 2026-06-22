/**
 * Vercel serverless entry for the NestJS API.
 *
 * Vercel runs functions, not a long-lived `app.listen()` server, so instead of
 * booting in main.ts we create the Nest app once (cached across warm
 * invocations) and hand each request to the underlying Express instance.
 *
 * We import the *compiled* AppModule from ../dist (built by `npm run build`)
 * because Vercel bundles functions with esbuild, which doesn't emit the
 * decorator metadata Nest's DI needs — the pre-compiled JS already has it.
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// @ts-ignore — resolved from the build output at deploy time
import { AppModule } from '../dist/app.module';

let cached: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  });
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!cached) cached = await bootstrap();
  return cached(req, res);
}
