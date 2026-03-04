import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';

describe('LOGIN', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
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
    const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
    adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 status code if login or password has incorrect value', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 12345 })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.email, password: ' ' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: 12345, password: user.password })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: '  ', password: user.password })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should return 401 status code if credentials are wrong', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'somepassword1' })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: 'unknownUser', password: user.password })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 401 status code if user is not confirmed', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: user.password })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return valid access token for confirmed user', async () => {
    const createUserResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser',
        email: 'example@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user = createUserResponse.body as { id: string; login: string; email: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const accessToken = loginResponse.body.accessToken as string;

    const response = await request(httpServer)
      .get('/auth/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.userId).toBe(user.id);
    expect(response.body.login).toBe(user.login);
    expect(response.body.email).toBe(user.email);
  });

  it('should return valid refresh token in cookie and create session', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: user.password })
      .expect(HTTP_STATUS.OK_200);
    const loginSetCookieHeader = loginResponse.headers['set-cookie'];
    const loginSetCookies = Array.isArray(loginSetCookieHeader)
      ? loginSetCookieHeader
      : loginSetCookieHeader
        ? [loginSetCookieHeader]
        : [];
    const refreshTokenCookie = loginSetCookies.find((cookie) => cookie.startsWith('refreshToken='));
    if (!refreshTokenCookie) {
      throw new Error('refreshToken cookie is missing');
    }
    const refreshToken = refreshTokenCookie.split(';')[0].replace('refreshToken=', '');

    const response = await request(httpServer)
      .get('/security/devices')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.OK_200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('deviceId');
  });
});
