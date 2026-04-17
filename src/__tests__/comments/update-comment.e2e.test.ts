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

describe('UPDATE COMMENT', () => {
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

  async function createCommentByUser(userLogin: string, email: string) {
    const userResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: userLogin,
        email,
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

    const createdComment = await request(httpServer)
      .post(`/posts/${post.id}/comments`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.CREATED_201);

    return { accessToken, commentId: createdComment.body.id as string, userId: user.id };
  }

  it('should return 204 and update comment', async () => {
    const { accessToken, commentId } = await createCommentByUser('NewUser', 'example@gmail.com');
    const updatedContent = 'Updated comment content is still long';

    await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: updatedContent })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer).get(`/comments/${commentId}`).expect(HTTP_STATUS.OK_200);

    expect(response.body.content).toBe(updatedContent);
  });

  it('should return 400 if content is too short', async () => {
    const { accessToken, commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    const response = await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'short' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body.errorsMessages).toBeDefined();
    expect(response.body.errorsMessages[0].field).toBe('content');
  });

  it('should return 400 if content is too long', async () => {
    const { accessToken, commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    const response = await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'a'.repeat(301) })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body.errorsMessages).toBeDefined();
    expect(response.body.errorsMessages[0].field).toBe('content');
  });

  it('should return 400 if content is empty', async () => {
    const { accessToken, commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    const response = await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ content: '' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body.errorsMessages).toBeDefined();
    expect(response.body.errorsMessages[0].field).toBe('content');
  });

  it('should return 400 if content is missing', async () => {
    const { accessToken, commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    const response = await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({})
      .expect(HTTP_STATUS.BAD_REQUEST_400);

    expect(response.body.errorsMessages).toBeDefined();
    expect(response.body.errorsMessages[0].field).toBe('content');
  });

  it('should return 401 if no access token has been sent', async () => {
    const { commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    await request(httpServer)
      .put(`/comments/${commentId}`)
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it('should return 401 if access token is invalid', async () => {
    const { commentId } = await createCommentByUser('NewUser', 'example@gmail.com');

    await request(httpServer)
      .put(`/comments/${commentId}`)
      .auth('invalid.token.here', { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.UNAUTHORIZED_401);
  });

  it("should return 403 if user tries to update another user's comment", async () => {
    const owner = await createCommentByUser('OwnerUser', 'owner@gmail.com');

    const anotherUserResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'AnotherUsr',
        email: 'another@gmail.com',
        password: 'anotherpassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const anotherUser = anotherUserResponse.body as { login: string };
    const anotherLoginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: anotherUser.login, password: 'anotherpassword' })
      .expect(HTTP_STATUS.OK_200);
    const anotherToken = anotherLoginResponse.body.accessToken as string;

    await request(httpServer)
      .put(`/comments/${owner.commentId}`)
      .auth(anotherToken, { type: 'bearer' })
      .send({ content: 'Trying to update someone else comment' })
      .expect(HTTP_STATUS.FORBIDDEN_403);
  });

  it('should return 404 if the comment is not found', async () => {
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
      .put('/comments/999999')
      .auth(accessToken, { type: 'bearer' })
      .send({ content: 'This comment has enough length' })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });
});
