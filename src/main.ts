import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SETTINGS } from './settings.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(SETTINGS.PORT);
}

bootstrap();
