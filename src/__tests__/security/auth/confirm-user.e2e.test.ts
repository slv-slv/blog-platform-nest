import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../../app.module.js';
import { appSetup } from '../../../setup/app.setup.js';
import { HTTP_STATUS } from '../../utils/http-status.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';

describe('CONFIRM USER', () => {
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

  async function getUserOrThrow(email: string) {
    const user = await usersRepository.findUser(email);
    expect(user).not.toBeNull();
    return user!;
  }

  it('should not confirm not existing user', async () => {
    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: '0d56a34c-9eaf-473f-842c-309ab6c2c9df' })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should not confirm user with expired code', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUser = await getUserOrThrow(user.email);
    expect(insertedUser.confirmation.code).toBeTruthy();

    await usersRepository.updateConfirmationCode({
      email: user.email,
      code: insertedUser.confirmation.code!,
      expiration: new Date(Date.now() - 60_000),
    });

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser.confirmation.code })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });

  it('should confirm user with valid code', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUser = await getUserOrThrow(user.email);

    await usersRepository.updateConfirmationCode({
      email: user.email,
      code: insertedUser.confirmation.code!,
      expiration: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser.confirmation.code })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    const confirmedUser = await getUserOrThrow(user.email);
    expect(confirmedUser.confirmation.isConfirmed).toBeTruthy();
    expect(confirmedUser.confirmation.expiration).toBeNull();
  });

  it('should not confirm already confirmed user', async () => {
    const user = { login: 'NewUser', email: 'some.email@gmail.com', password: 'somepassword' };
    await request(httpServer).post('/auth/registration').send(user).expect(HTTP_STATUS.NO_CONTENT_204);

    const insertedUser = await getUserOrThrow(user.email);

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser.confirmation.code })
      .expect(HTTP_STATUS.NO_CONTENT_204);

    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: insertedUser.confirmation.code })
      .expect(HTTP_STATUS.BAD_REQUEST_400);
  });
});
