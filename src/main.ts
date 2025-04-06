import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SETTINGS } from './settings.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(SETTINGS.PORT);
}

bootstrap();
