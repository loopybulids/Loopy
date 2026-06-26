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
  const errors = [];
  for (const c of candidates) {
    try {
      const m = require(c.join('/'));
      if (m?.AppModule) return m.AppModule;
    } catch (err) {
      errors.push(`Failed to load ${c.join('/')}: ${err.message}`);
    }
  }
  throw new Error('AppModule not found in dist — did `npm run build` run? Details: ' + errors.join(' | '));
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
      origin: process.env.CORS_ORIGIN 
        ? [...process.env.CORS_ORIGIN.split(','), /\.vercel\.app$/, /localhost/]
        : true,
    credentials: true,
  });
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
