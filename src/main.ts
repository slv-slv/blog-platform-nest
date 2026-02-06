import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { appSetup } from './setup/app.setup.js';
import { coreConfig } from './config/core.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const core = app.get<ConfigType<typeof coreConfig>>(coreConfig.KEY);

  appSetup(app);

  await app.listen(core.port);
}

bootstrap();
