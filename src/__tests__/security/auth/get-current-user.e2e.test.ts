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

describe('GET CURRENT USER', () => {
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

  it('should return 401 status code if no token sent', async () => {
    await request(httpServer).get('/auth/me').expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 401 status code for not existing user', async () => {
    const createUserResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NotExists',
        email: 'deleted.user@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);

    const user = createUserResponse.body as { id: string; login: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const accessToken = loginResponse.body.accessToken as string;

    await request(httpServer)
      .delete(`/sa/users/${user.id}`)
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .get('/auth/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return existing user if valid token sent', async () => {
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

    expect(response.body).toEqual({
      email: user.email,
      login: user.login,
      userId: user.id,
    });
  });
});
