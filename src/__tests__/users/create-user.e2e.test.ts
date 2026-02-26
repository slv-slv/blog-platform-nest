import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { appSetup } from '../../setup/app.setup.js';
import { HTTP_STATUS } from '../utils/http-status.js';

describe('CREATE USER', () => {
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

    const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
    adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin should create a new user and return user object', async () => {
    const newUser = {
      login: 'NewUser',
      password: 'qwerty123',
      email: 'example@example.com',
    };

    const response = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send(newUser)
      .expect(HTTP_STATUS.CREATED_201);

    expect(Object.keys(response.body)).toHaveLength(4);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('login', newUser.login);
    expect(response.body).toHaveProperty('email', newUser.email);
    expect(response.body).toHaveProperty('createdAt');
    expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
  });
});
