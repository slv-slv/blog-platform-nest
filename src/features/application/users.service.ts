import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/typeorm/users.repository.js';
import { UsersQueryRepository } from '../infrastructure/typeorm/users.query-repository.js';
import { AuthService } from '../../03-auth/application/auth.service.js';
import { EmailService } from '../../../../notifications/email/email.service.js';
import { ConfirmationInfoType, PasswordRecoveryInfoType, UserViewType } from '../types/users.types.js';
import { SETTINGS } from '../../../../settings.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}
  async createUser(
    login: string,
    email: string,
    password: string,
    confirmation: ConfirmationInfoType = {
      isConfirmed: true,
      code: null,
      expiration: null,
    },
    passwordRecovery: PasswordRecoveryInfoType = { code: null, expiration: null },
  ): Promise<UserViewType> {
    if (await this.isLoginExists(login))
      throw new BadRequestException({
        errorsMessages: [{ message: 'Login already exists', field: 'login' }],
      });
    if (await this.isEmailExists(email))
      throw new BadRequestException({
        errorsMessages: [{ message: 'Email already exists', field: 'email' }],
      });

    const hash = await this.authService.hashPassword(password);
    const createdAt = new Date();

    const newUser = await this.usersRepository.createUser(
      login,
      email,
      hash,
      createdAt,
      confirmation,
      passwordRecovery,
    );

    return newUser;
  }

  async registerUser(login: string, email: string, password: string): Promise<UserViewType> {
    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME);

    const confirmation = {
      isConfirmed: false,
      code,
      expiration,
    };

    const passwordRecovery: PasswordRecoveryInfoType = { code: null, expiration: null };

    await this.emailService.sendConfirmationCode(email, code);

    return await this.createUser(login, email, password, confirmation, passwordRecovery);
  }

  async resendConfirmationCode(email: string): Promise<void> {
    if (!(await this.usersRepository.findUser(email))) {
      throw new BadRequestException({ errorsMessages: [{ message: 'Incorrect email', field: 'email' }] });
      // return;
    }

    if (await this.isConfirmed(email)) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Email already confirmed', field: 'email' }],
      });
    }

    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME);

    await this.emailService.sendConfirmationCode(email, code);

    await this.usersRepository.updateConfirmationCode(email, code, expiration);
  }

  async sendRecoveryCode(email: string): Promise<void> {
    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + SETTINGS.RECOVERY_CODE_LIFETIME);

    const result = await this.usersRepository.updateRecoveryCode(email, code, expiration);

    if (!result) {
      return; // Чтобы контроллер выбросил 204 статус, даже если такого email нет в БД
    }

    await this.emailService.sendRecoveryCode(email, code);
  }

  async confirmUser(code: string): Promise<void> {
    const confirmationInfo = await this.usersRepository.getConfirmationInfo(code);
    if (!confirmationInfo) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Invalid confirmation code', field: 'code' }],
      });
    }

    if (confirmationInfo.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Email already confirmed', field: 'code' }],
      });
    }

    const expirationDate = new Date(confirmationInfo.expiration!);
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'The confirmation code has expired', field: 'code' }],
      });
    }

    await this.usersRepository.confirmUser(code);
  }

  async updatePassword(recoveryCode: string, newPassword: string): Promise<void> {
    const passwordRecoveryInfo = await this.usersRepository.getPasswordRecoveryInfo(recoveryCode);

    if (!passwordRecoveryInfo) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Invalid recovery code', field: 'code' }],
      });
    }

    const expirationDate = passwordRecoveryInfo.expiration!;
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'The recovery code has expired', field: 'code' }],
      });
    }

    const hash = await this.authService.hashPassword(newPassword);
    await this.usersRepository.updatePassword(recoveryCode, hash);
  }

  async deleteUser(id: string): Promise<void> {
    const isDeleted = await this.usersRepository.deleteUser(id);
    if (!isDeleted) throw new NotFoundException('User not found');
  }

  async isLoginExists(login: string): Promise<boolean> {
    return await this.usersQueryRepository.isLoginExists(login);
  }

  async isEmailExists(email: string): Promise<boolean> {
    return await this.usersQueryRepository.isEmailExists(email);
  }

  async isConfirmed(email: string): Promise<boolean> {
    return await this.usersQueryRepository.isConfirmed(email);
  }
}
