import { INestApplication } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { authConfig } from '../../../config/auth.config.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';

describe('RESEND CONFIRMATION', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let usersRepository: UsersRepository;
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

    httpServer = app.getHttpServer();
    usersRepository = app.get(UsersRepository);
    const auth = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);
    adminAuthHeader = `Basic ${auth.adminCredentialsBase64.replaceAll(`'`, '')}`;
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not resend code for not existing user', async () => {
    await request(httpServer)
      .post('/auth/registration-email-resending')
      .send({ email: 'unknown@mail.io' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should not resend code for confirmed user', async () => {
    await request(httpServer)
      .post('/sa/users')
      .set('Authorization', adminAuthHeader)
      .send({
        login: 'NewUser',
        email: 'slvsl@vk.com',
        password: 'somepassword',
      })
      .expect(HTTP_STATUS.CREATED_201);

    await request(httpServer)
      .post('/auth/registration-email-resending')
      .send({ email: 'slvsl@vk.com' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should resend code for not confirmed user', async () => {
    const user = { login: 'NewUser', email: 'slvsl@vk.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const beforeResend = await usersRepository.findUser(user.email);
    expect(beforeResend).not.toBeNull();

    await request(httpServer)
      .post('/auth/registration-email-resending')
      .send({ email: user.email })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const afterResend = await usersRepository.findUser(user.email);
    expect(afterResend).not.toBeNull();
    expect(afterResend?.confirmation.isConfirmed).toBe(false);
    expect(afterResend?.confirmation.code).toBeTruthy();
    expect(afterResend?.confirmation.code).not.toBe(beforeResend?.confirmation.code);
  });
});
