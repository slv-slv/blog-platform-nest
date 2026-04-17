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

describe('CREATE POST', () => {
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

  it('should return 201 and return created post', async () => {
    const blogId = await createBlog();

    const response = await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.CREATED_201);

    expect(Object.keys(response.body)).toHaveLength(8);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', 'Post title');
    expect(response.body).toHaveProperty('shortDescription', 'Post short description');
    expect(response.body).toHaveProperty('content', 'Long enough post content');
    expect(response.body).toHaveProperty('blogId', blogId);
    expect(response.body).toHaveProperty('blogName', 'BlogName');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('extendedLikesInfo');
    expect(response.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    });
  });

  it('should return 401 if credentials are incorrect', async () => {
    const blogId = await createBlog();

    await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 404 if blog does not exist', async () => {
    await request(httpServer)
      .post('/sa/blogs/999999/posts')
      .set('Authorization', adminAuthHeader)
      .send({
        title: 'Post title',
        shortDescription: 'Post short description',
        content: 'Long enough post content',
      })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 400 if body has incorrect values', async () => {
    const blogId = await createBlog();

    const response = await request(httpServer)
      .post(`/sa/blogs/${blogId}/posts`)
      .set('Authorization', adminAuthHeader)
      .send({
        title: '',
        shortDescription: '',
        content: '',
      })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body).toHaveProperty('errorsMessages');
    expect(response.body.errorsMessages).toHaveLength(3);
  });
});
