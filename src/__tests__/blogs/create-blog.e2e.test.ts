import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { appSetup } from '../../setup/app.setup.js';
import { HTTP_STATUS } from '../utils/http-status.js';
import { EmailService } from '../../notifications/email/email.service.js';

describe('CREATE BLOG', () => {
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

    const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
    adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return 201 and return created blog', async () => {
    const response = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'Tech Blog',
        description: 'A short description for blog tests',
        websiteUrl: 'https://example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);

    expect(Object.keys(response.body)).toHaveLength(6);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Tech Blog');
    expect(response.body).toHaveProperty('description', 'A short description for blog tests');
    expect(response.body).toHaveProperty('websiteUrl', 'https://example.com');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('isMembership', false);
  });

  it('should return 401 if credentials are incorrect', async () => {
    await request(httpServer)
      .post('/sa/blogs')
      .send({
        name: 'Tech Blog',
        description: 'A short description for blog tests',
        websiteUrl: 'https://example.com',
      })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 400 if body has incorrect values', async () => {
    const response = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: '',
        description: '',
        websiteUrl: 'invalid-url',
      })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body).toHaveProperty('errorsMessages');
    expect(response.body.errorsMessages).toHaveLength(3);
  });
});
