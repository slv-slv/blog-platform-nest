import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';

describe('GET-ACTIVE-DEVICES', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let adminAuthHeader = '';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('should return 401 if no refresh token sent', async () => {
    await request(httpServer).get('/security/devices').expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return array of active devices of user', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

    await request(httpServer)
      .post('/auth/login')
      .set('User-Agent', 'Nokia 1100')
      .send({ loginOrEmail: user.login, password: user.password })
      .expect(HTTP_STATUS.OK_200);
    await request(httpServer)
      .post('/auth/login')
      .set('User-Agent', 'Nokia 1101')
      .send({ loginOrEmail: user.login, password: user.password })
      .expect(HTTP_STATUS.OK_200);
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .set('User-Agent', 'Siemens SX1')
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

    expect(response.body).toHaveLength(3);
    expect(Object.keys(response.body[0])).toHaveLength(4);
    expect(response.body[0]).toHaveProperty('ip');
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('lastActiveDate');
    expect(response.body[0]).toHaveProperty('deviceId');
  });
});
