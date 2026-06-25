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

// Computed paths defeat esbuild's static resolution → kept as runtime requires.
// dist layout differs (dist/app.module vs dist/src/app.module) depending on what
// .ts files exist, so try both.
function loadAppModule(): any {
  const candidates = [['..', 'dist', 'src', 'app.module'], ['..', 'dist', 'app.module']];
  for (const c of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require(c.join('/'));
      if (m?.AppModule) return m.AppModule;
    } catch { /* try next */ }
  }
  throw new Error('AppModule not found in dist — did `npm run build` run?');
}
const AppModule = loadAppModule();

let cached: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true, limit: '4mb' }));
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
