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

describe('PASSWORD RECOVERY REQUEST', () => {
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

  it('should return 400 if invalid email is sent', async () => {
    await request(httpServer)
      .post('/auth/password-recovery')
      .send({ email: 'invalid^ email@gmail.com' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    await request(httpServer)
      .post('/auth/password-recovery')
      .send({ email: '  ' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should return 204 if not registered email is sent', async () => {
    await request(httpServer)
      .post('/auth/password-recovery')
      .send({ email: 'slvsl@vk.com' })
      .expect(HTTP_STATUS.NO_CONTENT_204);
  });

  it('should return 204 and set recovery code if registered email is sent', async () => {
    const user = {
      login: 'NewUser',
      email: 'slvsl@vk.com',
      password: 'somepassword',
    };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    await request(httpServer)
      .post('/auth/password-recovery')
      .send({ email: user.email })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUserResult = await pool.query(
      `
        SELECT recovery_code, recovery_expiration
        FROM users
        WHERE email = $1
      `,
      [user.email],
    );
    const insertedUser = insertedUserResult.rows[0] ?? null;
    expect(insertedUser?.recovery_code).toBeTruthy();
    expect(insertedUser?.recovery_expiration).toBeTruthy();
  });
});
