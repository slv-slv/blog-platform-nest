import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { EmailService } from '../../modules/notifications/email/email.service.js';
import { appSetup } from '../../setup/app.setup.js';

export type E2eTestApp = {
  app: INestApplication<App>;
  httpServer: App;
  adminAuthHeader: string;
};

const emailServiceMock: Pick<EmailService, 'sendConfirmationCode' | 'sendRecoveryCode'> = {
  sendConfirmationCode: async () => {},
  sendRecoveryCode: async () => {},
};

export async function createE2eTestApp(): Promise<E2eTestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(emailServiceMock)
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  appSetup(app);
  await app.init();

  const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
  const adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
  const httpServer = app.getHttpServer();

  return {
    app,
    httpServer,
    adminAuthHeader,
  };
}
