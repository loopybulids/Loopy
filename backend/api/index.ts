/**
 * Vercel serverless entry for the NestJS API.
 *
 * Vercel runs functions, not a long-lived `app.listen()` server, so we create
 * the Nest app once (cached across warm invocations) and hand each request to
 * the underlying Express instance. Importing from ../src lets Vercel bundle the
 * whole app into the function in one pass (the previous ../dist approach failed
 * because dist isn't bundled into the function at runtime).
 */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from '../src/app.module';

let cached: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
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
