import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SETTINGS } from './settings.js';

const app = await NestFactory.create(AppModule);

await app.listen(SETTINGS.PORT);
