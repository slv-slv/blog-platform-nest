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

describe('GET ALL BLOGS', () => {
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

  async function createBlog(name: string) {
    await request(httpServer)
      .post('/sa/blogs')
      .set('Authorization', adminAuthHeader)
      .send({
        name,
        description: `Description for ${name}`,
        websiteUrl: `https://${name.toLowerCase()}.example.com`,
      })
      .expect(HTTP_STATUS.CREATED_201);
  }

  it('should return paginated blogs', async () => {
    await createBlog('BlogOne');
    await createBlog('BlogTwo');
    await createBlog('BlogThree');

    const response = await request(httpServer).get('/blogs').expect(HTTP_STATUS.OK_200);

    expect(Object.keys(response.body)).toHaveLength(5);
    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(response.body).toHaveProperty('totalCount', 3);
    expect(response.body).toHaveProperty('items');
    expect(response.body.items).toHaveLength(3);

    expect(response.body.items[0]).toHaveProperty('id');
    expect(response.body.items[0]).toHaveProperty('name');
    expect(response.body.items[0]).toHaveProperty('description');
    expect(response.body.items[0]).toHaveProperty('websiteUrl');
    expect(response.body.items[0]).toHaveProperty('createdAt');
    expect(response.body.items[0]).toHaveProperty('isMembership', false);
  });

  it('should return filtered blogs by searchNameTerm', async () => {
    await createBlog('NestBlog');
    await createBlog('NodeBlog');

    const response = await request(httpServer)
      .get('/blogs')
      .query({ searchNameTerm: 'Nest' })
      .expect(HTTP_STATUS.OK_200);

    expect(response.body.totalCount).toBe(1);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toHaveProperty('name', 'NestBlog');
  });

  it('should return empty list if there are no blogs', async () => {
    const response = await request(httpServer).get('/blogs').expect(HTTP_STATUS.OK_200);

    expect(response.body.totalCount).toBe(0);
    expect(response.body.items).toHaveLength(0);
  });
});
