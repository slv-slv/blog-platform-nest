import { INestApplication } from '@nestjs/common';
import { pipesSetup } from './pipes.setup.js';

export function appSetup(app: INestApplication) {
  app.enableCors();
  pipesSetup(app);
}
