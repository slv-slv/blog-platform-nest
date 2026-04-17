import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import setCookieParser from 'set-cookie-parser';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../modules/notifications/email/email.service.js';

function extractRefreshToken(setCookieHeader: string | string[] | undefined): string {
  const parsedCookies = setCookieParser.parse(setCookieHeader ?? []);
  const refreshToken = parsedCookies.find((cookie) => cookie.name === 'refreshToken')?.value;

  if (!refreshToken) {
    throw new Error('refreshToken cookie is missing');
  }

  return refreshToken;
}

describe('REFRESH-TOKEN', () => {
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

  it('should return 401 if no token sent', async () => {
    await request(httpServer).post('/auth/refresh-token').expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 401 for not existing session', async () => {
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
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);

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

  it('should return 401 if an invalid token is sent', async () => {
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
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);
    const invalidToken = `${refreshToken}broken`;

    await request(httpServer)
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${invalidToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return new pair of tokens and create new session', async () => {
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
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await request(httpServer)
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.accessToken).toBeTruthy();

    const newRefreshToken = extractRefreshToken(response.headers['set-cookie']);
    const devicesResponse = await request(httpServer)
      .get('/security/devices')
      .set('Cookie', `refreshToken=${newRefreshToken}`)
      .expect(HTTP_STATUS.OK_200);

    expect(devicesResponse.body).toHaveLength(1);
    expect(devicesResponse.body[0]).toHaveProperty('deviceId');
  });

  it('should return 401 when a rotated refresh token is reused', async () => {
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
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);

    await request(httpServer)
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.OK_200);

    await request(httpServer)
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });
});
