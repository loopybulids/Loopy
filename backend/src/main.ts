// Load .env BEFORE any other import evaluates. Feature modules call
// JwtModule.register({ secret: process.env.JWT_SECRET }) at import time, which
// runs before ConfigModule.forRoot() — so without this, tokens get SIGNED with
// the fallback secret but VERIFIED with the real .env secret → every guarded
// route 401s. Preloading env here makes both use the same secret.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow larger JSON bodies — product/store media is sent as base64 data-URLs.
  // (Default Express limit is 100kb.) Note: on Vercel the platform caps at ~4.5MB.
  // Payment webhooks are signed over the exact bytes sent, so those routes keep
  // a copy of the raw body. Only those: the rest of the API accepts 25MB image
  // uploads, and a second copy of every one of them would double the memory.
  const keepRawBody = (req: any, _res: any, buf: Buffer) => {
    if (req.url?.includes('/payments/')) req.rawBody = buf;
  };
  app.use(json({ limit: '25mb', verify: keepRawBody }));
  app.use(urlencoded({ extended: true, limit: '25mb', verify: keepRawBody }));

  /**
   * Log every request: method, path, status, duration.
   *
   * Nest logs its bootstrap (RouterExplorer, "application successfully
   * started") and then nothing — so a silent terminal looked like "the
   * frontend isn't calling the API" when in fact nothing was ever going to be
   * printed. This makes the truth visible.
   *
   * Timings matter here specifically: every query is a round trip to Neon in
   * us-east-2, so anything over ~1.2s is worth noticing rather than guessing
   * at. Set REQUEST_LOG=off to silence it.
   */
  if (process.env.REQUEST_LOG !== 'off') {
    const logger = new Logger('Request');
    app.use((req: any, res: any, next: any) => {
      const started = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - started;
        const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
        // A slow or failing request should stand out in a busy terminal.
        if (res.statusCode >= 500) logger.error(line);
        else if (res.statusCode >= 400) logger.warn(line);
        else if (ms > 1200) logger.warn(`${line}  ← slow`);
        else logger.log(line);
      });
      next();
    });
  }

  

  // API versioning per PRD §9.5
  app.setGlobalPrefix('api/v1');

  // strict input validation (PRD §12)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // In dev, reflect any origin so the app works from localhost AND the LAN IP
  // (e.g. http://192.168.x.x:3000). Set CORS_ORIGIN to lock this down in prod.
  app.enableCors({
      origin: process.env.CORS_ORIGIN 
        ? [...process.env.CORS_ORIGIN.split(','), /\.vercel\.app$/, /localhost/]
        : true,
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🟣  Loopy API running on http://localhost:${port}/api/v1`);
}
bootstrap();

