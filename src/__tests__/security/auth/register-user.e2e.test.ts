import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Pool } from 'pg';
import { AppModule } from '../../../app.module.js';
import { PG_POOL } from '../../../common/constants.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';

describe('REGISTER USER', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let pool: Pool;

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
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register new user', async () => {
    const newUser = {
      login: 'NewUser',
      password: 'NewPassword',
      email: 'slvsl@vk.com',
    };

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.NO_CONTENT_204);

    const result = await pool.query(
      `
        SELECT
          id,
          login,
          email,
          hash,
          created_at,
          is_confirmed,
          confirmation_code,
          confirmation_expiration,
          recovery_code,
          recovery_expiration
        FROM users
        WHERE email = $1
      `,
      [newUser.email],
    );
    const insertedUser = result.rows[0] ?? null;

    expect(insertedUser).not.toBeNull();
    expect(insertedUser).toHaveProperty('id');
    expect(insertedUser).toHaveProperty('login', newUser.login);
    expect(insertedUser).toHaveProperty('email', newUser.email);
    expect(insertedUser).toHaveProperty('hash');
    expect(insertedUser).toHaveProperty('created_at');
    expect(insertedUser?.is_confirmed).toBeFalsy();
    expect(insertedUser?.confirmation_code).toBeTruthy();
    expect(insertedUser?.confirmation_expiration).toBeTruthy();
    expect(insertedUser?.recovery_code).toBeNull();
    expect(insertedUser?.recovery_expiration).toBeNull();
  });

  it('should not register already existing user', async () => {
    const newUser = {
      login: 'NewUser',
      password: 'NewPassword',
      email: 'slvsl@vk.com',
    };

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.BAD_REQUEST_400);
  });
});
