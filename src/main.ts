import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { appSetup } from './setup/app.setup.js';
import { CoreConfig } from './core/core.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const coreConfig = app.get(CoreConfig);

  appSetup(app);

  await app.listen(coreConfig.port);
}

bootstrap();
