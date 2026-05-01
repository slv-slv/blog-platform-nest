import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module.js';
import { EmailService } from '../../modules/notifications/email/email.service.js';

export type IntegrationTestApp = {
  app: INestApplication;
  dataSource: DataSource;
};

const emailServiceMock: Pick<EmailService, 'sendConfirmationCode' | 'sendRecoveryCode'> = {
  sendConfirmationCode: async () => {},
  sendRecoveryCode: async () => {},
};

export async function createIntegrationTestApp(): Promise<IntegrationTestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(emailServiceMock)
    .compile();

  const app = moduleRef.createNestApplication<INestApplication>();
  await app.init();

  const dataSource = app.get(DataSource);

  return {
    app,
    dataSource,
  };
}
