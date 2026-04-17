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

describe('GET COMMENTS FOR POST', () => {
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

  async function createUserAndToken(login: string, email: string) {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({ login, email, password: 'somepassword' })
      .expect(HTTP_STATUS.CREATED_201);
    const createdUser = userResponse.body as { login: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: createdUser.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);

    return loginResponse.body.accessToken as string;
  }

  async function createPost() {
    const blogResponse = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const blogId = (blogResponse.body as { id: string }).id;

    const postResponse = await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.CREATED_201);

    return (postResponse.body as { id: string }).id;
  }

  it('should return paginated comments for post', async () => {
    const postId = await createPost();
    const token = await createUserAndToken('UserOne', 'userone@gmail.com');

    await request(httpServer)
      .post(`/posts/${postId}/comments`)
      .auth(token, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.CREATED_201);

    const response = await request(httpServer).get(`/posts/${postId}/comments`).expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 1, totalCount: 1, itemsLength: 1 });
    expect(response.body.items[0]).toHaveProperty('content', 'This comment has enough length');
    expect(response.body.items[0]).toHaveProperty('likesInfo');
  });

  it('should return empty list if post has no comments', async () => {
    const postId = await createPost();

    const response = await request(httpServer).get(`/posts/${postId}/comments`).expect(HTTP_STATUS.OK_200);

    assertPaginatedResponse({ body: response.body, pagesCount: 0, totalCount: 0, itemsLength: 0 });
  });

  it('should return 404 if post is not found', async () => {
    await request(httpServer).get('/posts/999999/comments').expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
