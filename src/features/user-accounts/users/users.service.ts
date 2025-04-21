import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONFIRMATION_STATUS,
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
} from './users.types.js';
import { UsersRepository } from './users.repository.js';
import { UsersQueryRepository } from './users.query-repository.js';
import { AuthService } from '../auth/auth.service.js';
import { SETTINGS } from '../../../settings.js';
import { EmailService } from '../../../notifications/email/email.service.js';

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
      status: CONFIRMATION_STATUS.CONFIRMED,
      code: null,
      expiration: null,
    },
    passwordRecovery: PasswordRecoveryInfoType = { code: null, expiration: null },
  ): Promise<UserType> {
    if (!(await this.isLoginUnique(login))) throw new BadRequestException('Login already exists');
    if (!(await this.isEmailUnique(email))) throw new BadRequestException('Email already exists');

    const hash = await this.authService.hashPassword(password);
    const createdAt = new Date().toISOString();

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

  async registerUser(login: string, email: string, password: string): Promise<UserType> {
    const code = crypto.randomUUID();

    const currentDate = new Date();
    const hours = currentDate.getHours();
    currentDate.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME);
    const expiration = currentDate.toISOString();

    const confirmation = {
      status: CONFIRMATION_STATUS.NOT_CONFIRMED,
      code,
      expiration,
    };

    const passwordRecovery: PasswordRecoveryInfoType = { code: null, expiration: null };

    await this.emailService.sendConfirmationCode(email, code);

    return await this.createUser(login, email, password, confirmation, passwordRecovery);
  }

  async resendConfirmationCode(email: string): Promise<void> {
    if (!(await this.usersRepository.findUser(email))) {
      throw new BadRequestException('Incorrect email');
    }

    if (await this.isConfirmed(email)) {
      throw new BadRequestException('Email already confirmed');
    }

    const code = crypto.randomUUID();

    const currentDate = new Date();
    const hours = currentDate.getHours();
    currentDate.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME);
    const expiration = currentDate.toISOString();

    await this.usersRepository.updateConfirmationCode(email, code, expiration);
    await this.emailService.sendConfirmationCode(email, code);
  }

  async sendRecoveryCode(email: string): Promise<void> {
    const code = crypto.randomUUID();

    const currentDate = new Date();
    const hours = currentDate.getHours();
    currentDate.setHours(hours + SETTINGS.RECOVERY_CODE_LIFETIME);
    const expiration = currentDate.toISOString();

    const result = await this.usersRepository.updateRecoveryCode(email, code, expiration);

    if (!result) {
      return; // Чтобы контроллер выбросил 204 статус, даже если такого email нет в БД
    }

    await this.emailService.sendRecoveryCode(email, code);
  }

  async confirmUser(code: string): Promise<void> {
    const confirmationInfo = await this.usersQueryRepository.getConfirmationInfo(code);
    if (!confirmationInfo) {
      throw new BadRequestException('Invalid confirmation code');
    }

    if (confirmationInfo.status === CONFIRMATION_STATUS.CONFIRMED) {
      throw new BadRequestException('Email already confirmed');
    }

    const expirationDate = new Date(confirmationInfo.expiration!);
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new BadRequestException('The confirmation code has expired');
    }

    await this.usersRepository.confirmUser(code);
  }

  async updatePassword(recoveryCode: string, newPassword: string): Promise<void> {
    const passwordRecoveryInfo = await this.usersQueryRepository.getPasswordRecoveryInfo(recoveryCode);

    if (!passwordRecoveryInfo) {
      throw new BadRequestException('Invalid recovery code');
    }

    const expirationDate = new Date(passwordRecoveryInfo.expiration!);
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new BadRequestException('The recovery code has expired');
    }

    const hash = await this.authService.hashPassword(newPassword);
    await this.usersRepository.updatePassword(recoveryCode, hash);
  }

  async deleteUser(id: string): Promise<void> {
    const isDeleted = await this.usersRepository.deleteUser(id);
    if (!isDeleted) throw new NotFoundException('User not found');
  }

  async isLoginUnique(login: string): Promise<boolean> {
    return await this.usersQueryRepository.isLoginUnique(login);
  }

  async isEmailUnique(email: string): Promise<boolean> {
    return await this.usersQueryRepository.isEmailUnique(email);
  }

  async isConfirmed(email: string): Promise<boolean> {
    return await this.usersQueryRepository.isConfirmed(email);
  }
}
