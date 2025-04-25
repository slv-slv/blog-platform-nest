import { INestApplication } from '@nestjs/common';
import { pipesSetup } from './pipes.setup.js';
import cookieParser from 'cookie-parser';

export function appSetup(app: INestApplication) {
  app.enableCors();
  app.use(cookieParser());
  pipesSetup(app);
}
