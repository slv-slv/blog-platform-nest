import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { authConfig } from '../../config/auth.config.js';
import { appSetup } from '../../setup/app.setup.js';
import { HTTP_STATUS } from '../utils/http-status.js';
import { EmailService } from '../../modules/notifications/email/email.service.js';

describe('GET BLOG SUPERADMIN', () => {
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
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);

    return (response.body as { id: string }).id;
  }

  it('should return 200 and return blog by id for superadmin', async () => {
    const blogId = await createBlog();

    const response = await request(httpServer)
      .get(`/sa/blogs/${blogId}`)
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.OK_200);

    expect(response.body).toHaveProperty('id', blogId);
    expect(response.body).toHaveProperty('name', 'BlogName');
  });

  it('should return 401 without basic auth', async () => {
    const blogId = await createBlog();
    await request(httpServer).get(`/sa/blogs/${blogId}`).expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if blog is not found', async () => {
    await request(httpServer)
      .get('/sa/blogs/999999')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
