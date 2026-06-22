import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API versioning per PRD §9.5
  app.setGlobalPrefix('api/v1');

  // strict input validation (PRD §12)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // In dev, reflect any origin so the app works from localhost AND the LAN IP
  // (e.g. http://192.168.x.x:3000). Set CORS_ORIGIN to lock this down in prod.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🟣  Loopy API running on http://localhost:${port}/api/v1`);
}
bootstrap();
