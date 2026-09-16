/**
 * Vercel serverless entry for the NestJS API.
 *
 * We load the *compiled* AppModule from ../dist at RUNTIME (via a require with a
 * computed path so esbuild can't inline/strip it). The compiled JS keeps the
 * decorator metadata Nest's DI needs — importing from ../src would have esbuild
 * strip it, crashing the app at bootstrap (FUNCTION_INVOCATION_FAILED).
 *
 * `npm run build` (nest build) produces dist; vercel.json includes dist/** in
 * the function bundle.
 */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
// Static import of the COMPILED app. `npm run build` (vercel buildCommand) makes
// dist before the function is bundled, so esbuild resolves this, keeps the
// decorator metadata (compiled JS), AND traces/bundles all node_modules deps
// (@nestjs/config, prisma, etc.). A runtime require() can't be traced → those
// deps go missing ("Cannot find module '@nestjs/config'").
// @ts-ignore — resolved from build output at deploy time
import { AppModule } from '../dist/app.module';

let cached: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  /*
   * Payment webhooks are signed over the exact bytes sent, so those routes keep
   * a copy of the raw body — the signature cannot be recomputed from parsed
   * JSON. This entry file bootstraps Nest itself and does not run main.ts, so
   * the same rule has to be repeated here or FamGateway webhooks would be
   * rejected as unsigned in production while working locally.
   */
  const keepRawBody = (req: any, _res: any, buf: Buffer) => {
    if (req.url?.includes('/payments/')) req.rawBody = buf;
  };
  app.use(express.json({ limit: '4mb', verify: keepRawBody }));
  app.use(express.urlencoded({ extended: true, limit: '4mb', verify: keepRawBody }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  // CORS is handled by vercel.json edge headers (applies even if a route errors).

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight immediately to bypass bootstrap potential crashes
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    if (!cached) cached = await bootstrap();
    return cached(req, res);
  } catch (err) {
    console.error('Fatal Bootstrap Error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error during bootstrap', 
      details: err?.message || String(err),
      stack: err?.stack
    });
  }
}
