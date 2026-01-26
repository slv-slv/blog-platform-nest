import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/sql/users.repository.js';
import { UsersQueryRepository } from '../infrastructure/sql/users.query-repository.js';
import { AuthService } from './auth.service.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { ConfirmationInfoType, PasswordRecoveryInfoType, UserViewType } from '../types/users.types.js';
import { SETTINGS } from '../../../settings.js';
import {
  ConfirmationCodeExpiredDomainException,
  ConfirmationCodeInvalidDomainException,
  EmailAlreadyConfirmedDomainException,
  EmailAlreadyExistsDomainException,
  IncorrectEmailDomainException,
  LoginAlreadyExistsDomainException,
  RecoveryCodeExpiredDomainException,
  RecoveryCodeInvalidDomainException,
  UserNotFoundDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

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
    if (await this.isLoginExists(login)) throw new LoginAlreadyExistsDomainException();
    if (await this.isEmailExists(email)) throw new EmailAlreadyExistsDomainException();

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
      throw new IncorrectEmailDomainException();
      // return;
    }

    if (await this.isConfirmed(email)) {
      throw new EmailAlreadyConfirmedDomainException();
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
      throw new ConfirmationCodeInvalidDomainException();
    }

    if (confirmationInfo.isConfirmed) {
      throw new EmailAlreadyConfirmedDomainException();
    }

    const expirationDate = new Date(confirmationInfo.expiration!);
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new ConfirmationCodeExpiredDomainException();
    }

    await this.usersRepository.confirmUser(code);
  }

  async updatePassword(recoveryCode: string, newPassword: string): Promise<void> {
    const passwordRecoveryInfo = await this.usersRepository.getPasswordRecoveryInfo(recoveryCode);

    if (!passwordRecoveryInfo) {
      throw new RecoveryCodeInvalidDomainException();
    }

    const expirationDate = passwordRecoveryInfo.expiration!;
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new RecoveryCodeExpiredDomainException();
    }

    const hash = await this.authService.hashPassword(newPassword);
    await this.usersRepository.updatePassword(recoveryCode, hash);
  }

  async deleteUser(id: string): Promise<void> {
    const isDeleted = await this.usersRepository.deleteUser(id);
    if (!isDeleted) throw new UserNotFoundDomainException();
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
