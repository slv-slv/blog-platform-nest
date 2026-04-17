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
import { assertPaginatedResponse } from '../utils/assert-paginated-response.js';

describe('GET POSTS BY BLOG ID SUPERADMIN', () => {
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

  async function createPost(blogId: string) {
    await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.CREATED_201);
  }

  it('should return 200 and posts for blog', async () => {
    const blogId = await createBlog();
    await createPost(blogId);

    const response = await request(httpServer)
      .get(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 1, totalCount: 1, itemsLength: 1 });
    expect(response.body.items[0]).toHaveProperty('blogId', blogId);
  });

  it('should return 401 without basic auth', async () => {
    const blogId = await createBlog();
    await request(httpServer).get(`/sa/blogs/${blogId}/posts`).expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if blog is not found', async () => {
    await request(httpServer)
      .get('/sa/blogs/999999/posts')
      .set('Authorization', adminAuthHeader)
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
