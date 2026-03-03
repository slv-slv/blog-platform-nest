import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Pool } from 'pg';
import { AppModule } from '../../../app.module.js';
import { PG_POOL } from '../../../common/constants.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';

describe('CONFIRM USER', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let pool: Pool;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('should not confirm not existing user', async () => {
    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: '0d56a34c-9eaf-473f-842c-309ab6c2c9df' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should not confirm user with expired code', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUserResult = await pool.query(`SELECT confirmation_code FROM users WHERE email = $1`, [
      user.email,
    ]);
    const insertedUser = insertedUserResult.rows[0] ?? null;
    expect(insertedUser?.confirmation_code).toBeTruthy();

    const expiredAt = new Date(Date.now() - 60_000).toISOString();
    await pool.query(`UPDATE users SET confirmation_expiration = $1 WHERE email = $2`, [
      expiredAt,
      user.email,
    ]);

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser!.confirmation_code })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should confirm user with valid code', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUserResult = await pool.query(`SELECT confirmation_code FROM users WHERE email = $1`, [
      user.email,
    ]);
    const insertedUser = insertedUserResult.rows[0] ?? null;
    const validTo = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await pool.query(`UPDATE users SET confirmation_expiration = $1 WHERE email = $2`, [validTo, user.email]);

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser!.confirmation_code })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const confirmedUserResult = await pool.query(
      `
        SELECT is_confirmed, confirmation_expiration
        FROM users
        WHERE email = $1
      `,
      [user.email],
    );
    const confirmedUser = confirmedUserResult.rows[0] ?? null;
    expect(confirmedUser?.is_confirmed).toBeTruthy();
    expect(confirmedUser?.confirmation_expiration).toBeNull();
  });

  it('should not confirm already confirmed user', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUserResult = await pool.query(`SELECT confirmation_code FROM users WHERE email = $1`, [
      user.email,
    ]);
    const insertedUser = insertedUserResult.rows[0] ?? null;

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser!.confirmation_code })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser!.confirmation_code })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });
});
