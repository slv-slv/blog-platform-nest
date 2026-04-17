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

describe('GET POST', () => {
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

  async function createPost() {
    const blogResponse = await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'BlogName',
        description: 'Blog description',
        websiteUrl: 'https://www.example.com',
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

    return postResponse.body as { id: string };
  }

  it('should return 200 and return post by id', async () => {
    const post = await createPost();

    const response = await request(httpServer).get(`/posts/${post.id}`).expect(HTTP_STATUS.OK_200);

    expect(Object.keys(response.body)).toHaveLength(8);
    expect(response.body).toHaveProperty('id', post.id);
    expect(response.body).toHaveProperty('title', 'Post title');
    expect(response.body).toHaveProperty('shortDescription', 'Post short description');
    expect(response.body).toHaveProperty('content', 'Long enough post content');
    expect(response.body).toHaveProperty('blogName', 'BlogName');
    expect(response.body).toHaveProperty('extendedLikesInfo');
  });

  it('should return 404 if post is not found', async () => {
    await request(httpServer).get('/posts/999999').expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
