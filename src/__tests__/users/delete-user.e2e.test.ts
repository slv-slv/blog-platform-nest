import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { appSetup } from '../../setup/app.setup.js';
import { HTTP_STATUS } from '../utils/http-status.js';

describe('DELETE USER', () => {
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

  it('should return 204 and delete user by id', async () => {
    const user01Response = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser01',
        email: 'example01@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user01 = user01Response.body as { id: string };

    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser02',
        email: 'example02@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);

    let response = await request(httpServer)
      .get('/sa/users')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.OK_200);
    expect(response.body.items).toHaveLength(2);

    await request(httpServer)
      .delete(`/sa/users/${user01.id}`)
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.NO_CONTENT_204);

    response = await request(httpServer)
      .get('/sa/users')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.OK_200);
    expect(response.body.items).toHaveLength(1);
  });

  it('should return 404 if user does not exist', async () => {
    await request(httpServer)
      .delete('/sa/users/999999')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 401 if credentials are incorrect', async () => {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser03',
        email: 'example03@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user = userResponse.body as { id: string };

    await request(httpServer).delete(`/sa/users/${user.id}`).expect(HTTP_STATUS.UNAUTHORIZED_401);
  });
});
