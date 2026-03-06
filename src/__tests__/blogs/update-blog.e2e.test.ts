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

describe('UPDATE BLOG', () => {
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

  async function createBlog() {
    const response = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'Tech Blog',
        description: 'A short description for blog tests',
        websiteUrl: 'https://example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);

    return (response.body as { id: string }).id;
  }

  it('should return 204 and update blog', async () => {
    const blogId = await createBlog();

    await request(httpServer)
      .put(`/sa/blogs/${blogId}`)
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'UpdatedBlog',
        description: 'Updated description for blog tests',
        websiteUrl: 'https://updated-example.com',
      })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer).get(`/blogs/${blogId}`).expect(HTTP_STATUS.OK_200);

    expect(response.body).toHaveProperty('name', 'UpdatedBlog');
    expect(response.body).toHaveProperty('description', 'Updated description for blog tests');
    expect(response.body).toHaveProperty('websiteUrl', 'https://updated-example.com');
  });

  it('should return 401 if credentials are incorrect', async () => {
    const blogId = await createBlog();

    await request(httpServer)
      .put(`/sa/blogs/${blogId}`)
      .send({
        name: 'UpdatedBlog',
        description: 'Updated description for blog tests',
        websiteUrl: 'https://updated-example.com',
      })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if blog does not exist', async () => {
    await request(httpServer)
      .put('/sa/blogs/999999')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'UpdatedBlog',
        description: 'Updated description for blog tests',
        websiteUrl: 'https://updated-example.com',
      })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 400 if body has incorrect values', async () => {
    const blogId = await createBlog();

    const response = await request(httpServer)
      .put(`/sa/blogs/${blogId}`)
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'N'.repeat(16),
        description: 'Updated description for blog tests',
        websiteUrl: 'not-url',
      })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body).toHaveProperty('errorsMessages');
    expect(response.body.errorsMessages).toHaveLength(2);
  });
});
