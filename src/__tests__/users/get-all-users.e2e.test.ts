import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { appSetup } from '../../setup/app.setup.js';
import { HTTP_STATUS } from '../utils/http-status.js';

describe('GET ALL USERS', () => {
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

  it('should return an array of users', async () => {
    for (let i = 0; i < 10; i += 1) {
      await request(httpServer)
        .post('/sa/users')
        .set('Authorization', adminAuthHeader)
        .send({
          login: `NewUser${i}`,
          password: `somepassword${i}`,
          email: `example${i}@gmail.com`,
        })
        .expect(HTTP_STATUS.CREATED_201);
    }

    const response = await request(httpServer)
      .get('/sa/users')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.OK_200);

    expect(Object.keys(response.body)).toHaveLength(5);
    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(response.body).toHaveProperty('totalCount');
    expect(response.body).toHaveProperty('items');
    expect(response.body.items).toHaveLength(10);
  });

  it('should return 401 if credentials are incorrect', async () => {
    await request(httpServer).get('/sa/users').expect(HTTP_STATUS.UNAUTHORIZED_401);
  });
});
