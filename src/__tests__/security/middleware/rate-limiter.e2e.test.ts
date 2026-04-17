import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../modules/notifications/email/email.service.js';

describe('IP-THROTTLER', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendConfirmationCode: () => {}, sendRecoveryCode: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    appSetup(app);
    await app.init();

    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep returning 401 for repeated invalid login requests', async () => {
    for (let i = 0; i < 6; i += 1) {
      await request(httpServer)
        .post('/auth/login')
        .send({ loginOrEmail: 'login', password: 'password' })
        .expect(HTTP_STATUS.UNAUTHORIZED_401);
    }
  });
});
