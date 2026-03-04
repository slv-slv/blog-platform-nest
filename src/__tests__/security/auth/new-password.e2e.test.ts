import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Pool } from 'pg';
import { AppModule } from '../../../app.module.js';
import { PG_POOL } from '../../../common/constants.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';

describe('PASSWORD RECOVERY CONFIRMATION', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let pool: Pool;
  let adminAuthHeader = '';

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
    pool = app.get<Pool>(PG_POOL);
    const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
    adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 204 if correct recovery code is sent', async () => {
    const user = {
      login: 'NewUser',
      email: 'some.email@gmail.com',
      password: 'somepassword',
    };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    const recoveryCode = crypto.randomUUID();
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await pool.query(`UPDATE users SET recovery_code = $1, recovery_expiration = $2 WHERE email = $3`, [
      recoveryCode,
      futureDate,
      user.email,
    ]);

    await request(httpServer)
      .post('/auth/new-password')
      .send({ newPassword: 'newpassword', recoveryCode })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'newpassword' })
      .expect(HTTP_STATUS.OK_200);
  });

  it('should return 400 if password has incorrect value', async () => {
    await request(httpServer)
      .post('/auth/new-password')
      .send({ newPassword: 'pass', recoveryCode: crypto.randomUUID() })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should return 400 if recovery code is incorrect', async () => {
    await request(httpServer)
      .post('/auth/new-password')
      .send({ newPassword: 'newpassword', recoveryCode: crypto.randomUUID() })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should return 400 if recovery code is expired', async () => {
    const user = {
      login: 'NewUser',
      email: 'some.email@gmail.com',
      password: 'somepassword',
    };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    const recoveryCode = crypto.randomUUID();
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await pool.query(`UPDATE users SET recovery_code = $1, recovery_expiration = $2 WHERE email = $3`, [
      recoveryCode,
      pastDate,
      user.email,
    ]);

    await request(httpServer)
      .post('/auth/new-password')
      .send({ newPassword: 'newpassword', recoveryCode })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });
});
