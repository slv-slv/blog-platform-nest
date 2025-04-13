import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SETTINGS } from './settings.js';
import { ValidationPipe } from '@nestjs/common';
import { appSetup } from './setup/app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app);

  await app.listen(SETTINGS.PORT);
}

bootstrap();
