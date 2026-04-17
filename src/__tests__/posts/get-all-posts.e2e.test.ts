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

describe('GET ALL POSTS', () => {
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
    const blogResponse = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://www.example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);

    return (blogResponse.body as { id: string }).id;
  }

  it('should return paginated posts', async () => {
    const blogId = await createBlog();

    for (let i = 0; i < 3; i += 1) {
      await request(httpServer)
        .post(`/sa/blogs/${blogId}/posts`)
        .set('Authorization', adminAuthHeader)
        .send({
          title: `Post title ${i}`,
          shortDescription: `Short description ${i}`,
          content: `Long enough post content ${i}`,
        })
        .expect(HTTP_STATUS.CREATED_201);
    }

    const response = await request(httpServer).get('/posts').expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 1, totalCount: 3, itemsLength: 3 });

    expect(response.body.items[0]).toHaveProperty('id');
    expect(response.body.items[0]).toHaveProperty('title');
    expect(response.body.items[0]).toHaveProperty('shortDescription');
    expect(response.body.items[0]).toHaveProperty('content');
    expect(response.body.items[0]).toHaveProperty('blogId', blogId);
    expect(response.body.items[0]).toHaveProperty('blogName', 'BlogName');
    expect(response.body.items[0]).toHaveProperty('createdAt');
    expect(response.body.items[0]).toHaveProperty('extendedLikesInfo');
  });

  it('should return empty list if there are no posts', async () => {
    const response = await request(httpServer).get('/posts').expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 0, totalCount: 0, itemsLength: 0 });
  });
});
