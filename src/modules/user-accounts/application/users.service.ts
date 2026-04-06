import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../infrastructure/typeorm/users.repository.js';
import { AuthService } from './auth.service.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import {
  CreateUserParams,
  PasswordRecoveryInfoModel,
  RegisterUserParams,
  UserViewModel,
} from '../types/users.types.js';
import { authConfig } from '../../../config/auth.config.js';
import {
  EmailAlreadyExistsDomainException,
  LoginAlreadyExistsDomainException,
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

  async isLoginExists(login: string): Promise<boolean> {
    return await this.usersRepository.isLoginExists(login);
  }

  async isEmailExists(email: string): Promise<boolean> {
    return await this.usersRepository.isEmailExists(email);
  }
}
