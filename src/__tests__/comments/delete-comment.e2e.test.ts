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

describe('DELETE COMMENT', () => {
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

  async function createCommentByUser(login: string, email: string) {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login,
        email,
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const user = userResponse.body as { login: string };

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
        websiteUrl: 'https://example.com',
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

    const commentResponse = await request(httpServer)
      .post(`/posts/${post.id}/comments`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.CREATED_201);

    return {
      token: accessToken,
      commentId: commentResponse.body.id as string,
    };
  }

  it('should return 204 and delete own comment', async () => {
    const owner = await createCommentByUser('UserOne', 'userone@gmail.com');

    await request(httpServer)
      .delete(`/comments/${owner.commentId}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer).get(`/comments/${owner.commentId}`).expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 401 if no access token has been sent', async () => {
    const owner = await createCommentByUser('UserOne', 'userone@gmail.com');

    await request(httpServer).delete(`/comments/${owner.commentId}`).expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it("should return 403 if user tries to delete another user's comment", async () => {
    const owner = await createCommentByUser('UserOne', 'userone@gmail.com');
    const another = await createCommentByUser('UserTwo', 'usertwo@gmail.com');

    await request(httpServer)
      .delete(`/comments/${owner.commentId}`)
      .auth(another.token, { type: 'bearer' })
      .expect(HTTP_STATUS.FORBIDDEN_403);
  });

  it('should return 404 if comment is not found', async () => {
    const owner = await createCommentByUser('UserOne', 'userone@gmail.com');

    await request(httpServer)
      .delete('/comments/999999')
      .auth(owner.token, { type: 'bearer' })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
