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

describe('UPDATE POST VIA POSTS CONTROLLER', () => {
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
    const response = await request(httpServer)
      .post('/posts')
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
        blogId,
      })
      .expect(HTTP_STATUS.CREATED_201);

    return (response.body as { id: string }).id;
  }

  it('should return 204 and update post', async () => {
    const blogId = await createBlog();
    const postId = await createPost(blogId);

    await request(httpServer)
      .put(`/posts/${postId}`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Updated title',
        shortDescription: 'Updated short description',
        content: 'Updated long enough post content',
        blogId,
      })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer).get(`/posts/${postId}`).expect(HTTP_STATUS.OK_200);
    expect(response.body).toHaveProperty('title', 'Updated title');
  });

  it('should return 401 without basic auth', async () => {
    const blogId = await createBlog();
    const postId = await createPost(blogId);

    await request(httpServer)
      .put(`/posts/${postId}`)
      .send({
        title: 'Updated title',
        shortDescription: 'Updated short description',
        content: 'Updated long enough post content',
        blogId,
      })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if blog does not exist', async () => {
    const blogId = await createBlog();
    const postId = await createPost(blogId);

    await request(httpServer)
      .put(`/posts/${postId}`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Updated title',
        shortDescription: 'Updated short description',
        content: 'Updated long enough post content',
        blogId: '999999',
      })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 404 if post does not exist', async () => {
    const blogId = await createBlog();

    await request(httpServer)
      .put('/posts/999999')
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Updated title',
        shortDescription: 'Updated short description',
        content: 'Updated long enough post content',
        blogId,
      })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 400 if body has incorrect values', async () => {
    const blogId = await createBlog();
    const postId = await createPost(blogId);

    const response = await request(httpServer)
      .put(`/posts/${postId}`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'T'.repeat(31),
        shortDescription: '',
        content: '',
        blogId: '',
      })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body).toHaveProperty('errorsMessages');
    expect(response.body.errorsMessages.length).toBeGreaterThan(0);
  });
});
