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

describe('POST LIKE STATUS', () => {
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

  async function preparePost() {
    const ownerResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'OwnerUser',
        email: 'owner@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const owner = ownerResponse.body as { login: string };

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: owner.login, password: 'somepassword' })
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

    return { ownerToken: accessToken, postId: post.id };
  }

  it('should return 401 if no access token has been sent', async () => {
    const { postId } = await preparePost();

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .send({ likeStatus: 'Like' })
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
      .put('/posts/999999/like-status')
      .auth(accessToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NOT_FOUND_404);
  });

  it('should return 400 if body has incorrect values', async () => {
    const { ownerToken, postId } = await preparePost();

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'SuperLike' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should return 204 and change like status', async () => {
    const { ownerToken, postId } = await preparePost();

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer)
      .get(`/posts/${postId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.likesCount).toBe(1);
    expect(response.body.extendedLikesInfo.myStatus).toBe('Like');
  });

  it('should not increase number of likes if same user likes again', async () => {
    const { ownerToken, postId } = await preparePost();

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer)
      .get(`/posts/${postId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.likesCount).toBe(1);
  });

  it('should increase number of likes when another user likes', async () => {
    const { ownerToken, postId } = await preparePost();

    const anotherUserResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'AnotherUsr',
        email: 'another@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const anotherUser = anotherUserResponse.body as { login: string };
    const anotherLoginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: anotherUser.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const anotherToken = anotherLoginResponse.body.accessToken as string;

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(anotherToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer)
      .get(`/posts/${postId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.likesCount).toBe(2);
    expect(response.body.extendedLikesInfo.dislikesCount).toBe(0);
    expect(response.body.extendedLikesInfo.myStatus).toBe('Like');
  });

  it('should display only last 3 likes when 4 likes are set', async () => {
    const { ownerToken, postId } = await preparePost();

    const usersResponses = await Promise.all([
      request(httpServer)
        .post('/sa/users')
        .set('Authorization', adminAuthHeader)
        .send({ login: 'User2', email: 'user2@gmail.com', password: 'somepassword' })
        .expect(HTTP_STATUS.CREATED_201),
      request(httpServer)
        .post('/sa/users')
        .set('Authorization', adminAuthHeader)
        .send({ login: 'User3', email: 'user3@gmail.com', password: 'somepassword' })
        .expect(HTTP_STATUS.CREATED_201),
      request(httpServer)
        .post('/sa/users')
        .set('Authorization', adminAuthHeader)
        .send({ login: 'User4', email: 'user4@gmail.com', password: 'somepassword' })
        .expect(HTTP_STATUS.CREATED_201),
    ]);
    const users = usersResponses.map((response) => response.body as { login: string });

    const tokenResponses = await Promise.all(
      users.map((user) =>
        request(httpServer)
          .post('/auth/login')
          .send({ loginOrEmail: user.login, password: 'somepassword' })
          .expect(HTTP_STATUS.OK_200),
      ),
    );
    const tokens = tokenResponses.map((response) => response.body.accessToken as string);

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    for (const token of tokens) {
      await request(httpServer)
        .put(`/posts/${postId}/like-status`)
        .auth(token, { type: 'bearer' })
        .send({ likeStatus: 'Like' })
        .expect(HTTP_STATUS.NO_CONTENT_204);
    }

    const response = await request(httpServer)
      .get(`/posts/${postId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.likesCount).toBe(4);
    expect(response.body.extendedLikesInfo.dislikesCount).toBe(0);
    expect(response.body.extendedLikesInfo.newestLikes).toHaveLength(3);
  });

  it('should change status from like to dislike', async () => {
    const { ownerToken, postId } = await preparePost();

    const anotherUserResponse = await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'AnotherUsr',
        email: 'another@gmail.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);
    const anotherUser = anotherUserResponse.body as { login: string };
    const anotherLoginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ loginOrEmail: anotherUser.login, password: 'somepassword' })
      .expect(HTTP_STATUS.OK_200);
    const anotherToken = anotherLoginResponse.body.accessToken as string;

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(anotherToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Dislike' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer)
      .get(`/posts/${postId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.likesCount).toBe(1);
    expect(response.body.extendedLikesInfo.dislikesCount).toBe(1);
    expect(response.body.extendedLikesInfo.myStatus).toBe('Dislike');
  });

  it('should show status None to unauthorized user', async () => {
    const { ownerToken, postId } = await preparePost();

    await request(httpServer)
      .put(`/posts/${postId}/like-status`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ likeStatus: 'Like' })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const response = await request(httpServer).get(`/posts/${postId}`).expect(HTTP_STATUS.OK_200);

    expect(response.body.extendedLikesInfo.myStatus).toBe('None');
  });
});
