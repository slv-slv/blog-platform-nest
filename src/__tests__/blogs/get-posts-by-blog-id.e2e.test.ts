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
import { assertPaginatedResponse } from '../utils/assert-paginated-response.js';

describe('GET POSTS BY BLOG ID', () => {
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

  async function createPost(blogId: string, i: number) {
    await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: `Title ${i}`,
        shortDescription: `Short description ${i}`,
        content: `Long enough content ${i}`,
      })
      .expect(HTTP_STATUS.CREATED_201);
  }

  it('should return paginated posts for blog', async () => {
    const blogId = await createBlog();
    await createPost(blogId, 1);
    await createPost(blogId, 2);

    const response = await request(httpServer).get(`/blogs/${blogId}/posts`).expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 1, totalCount: 2, itemsLength: 2 });
    expect(response.body.items[0]).toHaveProperty('blogId', blogId);
    expect(response.body.items[0]).toHaveProperty('blogName', 'BlogName');
    expect(response.body.items[0]).toHaveProperty('extendedLikesInfo');
  });

  it('should return empty list if blog has no posts', async () => {
    const blogId = await createBlog();

    const response = await request(httpServer).get(`/blogs/${blogId}/posts`).expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 0, totalCount: 0, itemsLength: 0 });
  });

  it('should return 404 if blog is not found', async () => {
    await request(httpServer).get('/blogs/999999/posts').expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
