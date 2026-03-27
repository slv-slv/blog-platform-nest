import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../infrastructure/sql/users.repository.js';
import { AuthService } from './auth.service.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import {
  ConfirmationInfoModel,
  CreateUserParams,
  PasswordRecoveryInfoModel,
  RegisterUserParams,
  UserViewModel,
} from '../types/users.types.js';
import { authConfig } from '../../../config/auth.config.js';
import {
  ConfirmationCodeExpiredDomainException,
  EmailAlreadyConfirmedDomainException,
  EmailAlreadyExistsDomainException,
  LoginAlreadyExistsDomainException,
  RecoveryCodeExpiredDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {}
  async createUser(params: CreateUserParams): Promise<UserViewModel> {
    const {
      login,
      email,
      password,
      confirmation = {
        isConfirmed: true,
        code: null,
        expiration: null,
      },
      passwordRecovery = { code: null, expiration: null },
    } = params;

    if (await this.isLoginExists(login)) throw new LoginAlreadyExistsDomainException();
    if (await this.isEmailExists(email)) throw new EmailAlreadyExistsDomainException();

    const hash = await this.authService.hashPassword(password);
    const createdAt = new Date();

    const newUser = await this.usersRepository.createUser({
      login,
      email,
      hash,
      createdAt,
      confirmation,
      passwordRecovery,
    });

    return newUser;
  }

  async registerUser(params: RegisterUserParams): Promise<UserViewModel> {
    const { login, email, password } = params;
    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + this.auth.confirmationCodeExpiresIn);

    const confirmation = {
      isConfirmed: false,
      code,
      expiration,
    };

    const passwordRecovery: PasswordRecoveryInfoModel = { code: null, expiration: null };

    await this.emailService.sendConfirmationCode(email, code);

    return await this.createUser({ login, email, password, confirmation, passwordRecovery });
  }

  async resendConfirmationCode(email: string): Promise<void> {
    await this.usersRepository.findUser(email);

    if (await this.isConfirmed(email)) {
      throw new EmailAlreadyConfirmedDomainException();
    }

    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + this.auth.confirmationCodeExpiresIn);

    await this.emailService.sendConfirmationCode(email, code);

    await this.usersRepository.updateConfirmationCode({ email, code, expiration });
  }

  async sendRecoveryCode(email: string): Promise<void> {
    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + this.auth.recoveryCodeExpiresIn);

    const result = await this.usersRepository.updateRecoveryCode({ email, code, expiration });

    if (!result) {
      return; // Чтобы контроллер выбросил 204 статус, даже если такого email нет в БД
    }

    await this.emailService.sendRecoveryCode(email, code);
  }

  async confirmUser(code: string): Promise<void> {
    const confirmationInfo = await this.usersRepository.getConfirmationInfo(code);

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

    const expirationDate = passwordRecoveryInfo.expiration!;
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new RecoveryCodeExpiredDomainException();
    }

    const hash = await this.authService.hashPassword(newPassword);
    await this.usersRepository.updatePassword(recoveryCode, hash);
  }

  async deleteUser(id: string): Promise<void> {
    await this.usersRepository.deleteUser(id);
  }

  async isLoginExists(login: string): Promise<boolean> {
    return await this.usersRepository.isLoginExists(login);
  }

  async isEmailExists(email: string): Promise<boolean> {
    return await this.usersRepository.isEmailExists(email);
  }

  async isConfirmed(email: string): Promise<boolean> {
    return await this.usersRepository.isConfirmed(email);
  }
}
