import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';

describe('REGISTER USER', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication<App>['getHttpServer']>;
  let usersRepository: UsersRepository;

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
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register new user', async () => {
    const newUser = {
      login: 'NewUser',
      password: 'NewPassword',
      email: 'slvsl@vk.com',
    };

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUser = await usersRepository.findUser(newUser.email);

    expect(insertedUser).not.toBeNull();
    expect(insertedUser).toHaveProperty('id');
    expect(insertedUser).toHaveProperty('login', newUser.login);
    expect(insertedUser).toHaveProperty('email', newUser.email);
    expect(insertedUser).toHaveProperty('hash');
    expect(insertedUser).toHaveProperty('createdAt');
    expect(insertedUser?.confirmation.isConfirmed).toBeFalsy();
    expect(insertedUser?.confirmation.code).toBeTruthy();
    expect(insertedUser?.confirmation.expiration).toBeTruthy();
    expect(insertedUser?.passwordRecovery.code).toBeNull();
    expect(insertedUser?.passwordRecovery.expiration).toBeNull();
  });

  it('should not register already existing user', async () => {
    const newUser = {
      login: 'NewUser',
      password: 'NewPassword',
      email: 'slvsl@vk.com',
    };

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer).post('/auth/registration').send(newUser).expect(HTTP_STATUS.BAD_REQUEST_400);
  });
});
