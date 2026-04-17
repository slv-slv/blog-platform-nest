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

describe('CREATE COMMENT', () => {
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
    await app.close();
  });

  it('should return 201 and return created comment', async () => {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser',
        email: 'example@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user = userResponse.body as { id: string; login: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const accessToken = loginResponse.body.accessToken as string;

    const blogResponse = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://www.example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const blog = blogResponse.body as { id: string };

    const postResponse = await request(httpServer)
      .post(`/sa/blogs/${blog.id}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const post = postResponse.body as { id: string };

    const response = await request(httpServer)
      .post(`/posts/${post.id}/comments`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.CREATED_201);

    expect(Object.keys(response.body)).toHaveLength(5);
    expect(response.body.commentatorInfo.userId).toBe(user.id);
  });

  it('should return 401 if no access token has been sent', async () => {
    const blogResponse = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://www.example.com',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const blog = blogResponse.body as { id: string };

    const postResponse = await request(httpServer)
      .post(`/sa/blogs/${blog.id}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const post = postResponse.body as { id: string };

    await request(httpServer)
      .post(`/posts/${post.id}/comments`)
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if the post is not found', async () => {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser',
        email: 'example@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user = userResponse.body as { login: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: user.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const accessToken = loginResponse.body.accessToken as string;

    await request(httpServer)
      .post('/posts/999999/comments')
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
