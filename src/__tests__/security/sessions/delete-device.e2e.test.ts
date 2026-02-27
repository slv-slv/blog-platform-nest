import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';

describe('DELETE DEVICE', () => {
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

  it('should return 401 if refresh token is missing', async () => {
    await request(httpServer)
      .delete(`/security/devices/${crypto.randomUUID()}`)
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 403 if user tries to delete device of another user', async () => {
    const userA = { login: 'UserA', email: 'userA@gmail.com', password: 'somepassword' };
    const userB = { login: 'UserB', email: 'userB@gmail.com', password: 'somepassword' };

    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(userA)
      .expect(HTTP_STATUS.CREATED_201);
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(userB)
      .expect(HTTP_STATUS.CREATED_201);

    const loginAResponse = await request(httpServer)
      .post('/auth/login')
      .set('User-Agent', 'Device A')
      .send({ loginOrEmail: userA.login, password: userA.password })
      .expect(HTTP_STATUS.OK_200);
    const loginASetCookieHeader = loginAResponse.headers['set-cookie'];
    const loginASetCookies = Array.isArray(loginASetCookieHeader)
      ? loginASetCookieHeader
      : loginASetCookieHeader
        ? [loginASetCookieHeader]
        : [];
    const tokenACookie = loginASetCookies.find((cookie) => cookie.startsWith('refreshToken='));
    if (!tokenACookie) {
      throw new Error('refreshToken cookie is missing');
    }
    const tokenA = tokenACookie.split(';')[0].replace('refreshToken=', '');

    const loginBResponse = await request(httpServer)
      .post('/auth/login')
      .set('User-Agent', 'Device B')
      .send({ loginOrEmail: userB.login, password: userB.password })
      .expect(HTTP_STATUS.OK_200);
    const loginBSetCookieHeader = loginBResponse.headers['set-cookie'];
    const loginBSetCookies = Array.isArray(loginBSetCookieHeader)
      ? loginBSetCookieHeader
      : loginBSetCookieHeader
        ? [loginBSetCookieHeader]
        : [];
    const tokenBCookie = loginBSetCookies.find((cookie) => cookie.startsWith('refreshToken='));
    if (!tokenBCookie) {
      throw new Error('refreshToken cookie is missing');
    }
    const tokenB = tokenBCookie.split(';')[0].replace('refreshToken=', '');

    const devicesResponse = await request(httpServer)
      .get('/security/devices')
      .set('Cookie', `refreshToken=${tokenB}`)
      .expect(HTTP_STATUS.OK_200);
    const deviceIdB = (devicesResponse.body as { deviceId: string }[])[0].deviceId;

    await request(httpServer)
      .delete(`/security/devices/${deviceIdB}`)
      .set('Cookie', `refreshToken=${tokenA}`)
      .expect(HTTP_STATUS.FORBIDDEN_403);
  });

  it('should return 404 if device does not exist', async () => {
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

    await request(httpServer)
      .delete(`/security/devices/${crypto.randomUUID()}`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 204 and delete own device', async () => {
    const user = { login: 'NewUser', email: 'example@gmail.com', password: 'somepassword' };
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(user)
      .expect(HTTP_STATUS.CREATED_201);

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
    const devicesResponse = await request(httpServer)
      .get('/security/devices')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.OK_200);
    const currentDeviceId = (devicesResponse.body as { deviceId: string }[])[0].deviceId;

    await request(httpServer)
      .delete(`/security/devices/${currentDeviceId}`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });
});
