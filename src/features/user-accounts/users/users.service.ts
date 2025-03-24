import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CONFIRMATION_STATUS, ConfirmationInfo, PasswordRecoveryInfo, UserType } from './users.types.js';
import { UsersRepository } from './users.repository.js';
import { UsersQueryRepository } from './users.query-repository.js';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}
  async createUser(
    login: string,
    email: string,
    password: string,
    confirmation: ConfirmationInfo = {
      status: CONFIRMATION_STATUS.CONFIRMED,
      code: null,
      expiration: null,
    },
    passwordRecovery: PasswordRecoveryInfo = { code: null, expiration: null },
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

  // async registerUser(login: string, email: string, password: string): Promise<Result<UserType | null>> {
  //   const code = crypto.randomUUID();

  //   const currentDate = new Date();
  //   const hours = currentDate.getHours();
  //   const expiration = new Date(
  //     currentDate.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME),
  //   ).toISOString();

  //   const confirmation = {
  //     status: CONFIRMATION_STATUS.NOT_CONFIRMED,
  //     code,
  //     expiration,
  //   };

  //   const passwordRecovery: PasswordRecoveryInfo = { code: null, expiration: null };

  //   // await emailService.sendConfirmationCode(email, code);

  //   return await this.createUser(login, email, password, confirmation, passwordRecovery);
  // }

  // async sendConfirmationCode(email: string): Promise<Result<null>> {
  //   if (!(await this.usersRepo.findUser(email))) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'Incorrect email', field: 'email' }],
  //       data: null,
  //     };
  //   }

  //   if (await this.isConfirmed(email)) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'Email already confirmed', field: 'email' }],
  //       data: null,
  //     };
  //   }

  //   const code = crypto.randomUUID();

  //   const currentDate = new Date();
  //   const hours = currentDate.getHours();
  //   const expiration = new Date(
  //     currentDate.setHours(hours + SETTINGS.CONFIRMATION_CODE_LIFETIME),
  //   ).toISOString();

  //   await this.usersRepo.updateConfirmationCode(email, code, expiration);

  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };

  //   // await emailService.sendConfirmationCode(email, code);
  // }

  // async sendRecoveryCode(email: string): Promise<Result<null>> {
  //   const code = crypto.randomUUID();

  //   const currentDate = new Date();
  //   const hours = currentDate.getHours();
  //   const expiration = new Date(currentDate.setHours(hours + SETTINGS.RECOVERY_CODE_LIFETIME)).toISOString();

  //   const result = await this.usersRepo.updateRecoveryCode(email, code, expiration);

  //   if (!result) {
  //     return {
  //       status: RESULT_STATUS.NOT_FOUND,
  //       errorMessage: 'Not found',
  //       extensions: [{ message: 'User not found', field: 'id' }],
  //       data: null,
  //     };
  //   }

  //   // await emailService.sendRecoveryCode(email, code);

  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };
  // }

  // async confirmUser(code: string): Promise<Result<null>> {
  //   const confirmationInfo = await this.usersQueryRepo.getConfirmationInfo(code);
  //   if (!confirmationInfo) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'Invalid confirmation code', field: 'code' }],
  //       data: null,
  //     };
  //   }

  //   if (confirmationInfo.status === CONFIRMATION_STATUS.CONFIRMED) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'Email already confirmed', field: 'code' }],
  //       data: null,
  //     };
  //   }

  //   const expirationDate = new Date(confirmationInfo.expiration!);
  //   const currentDate = new Date();

  //   if (expirationDate < currentDate) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'The confirmation code has expired', field: 'code' }],
  //       data: null,
  //     };
  //   }

  //   await this.usersRepo.confirmUser(code);

  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };
  // }

  // async updatePassword(recoveryCode: string, newPassword: string): Promise<Result<null>> {
  //   const passwordRecoveryInfo = await this.usersQueryRepo.getPasswordRecoveryInfo(recoveryCode);

  //   if (!passwordRecoveryInfo) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'Invalid recovery code', field: 'recoveryCode' }],
  //       data: null,
  //     };
  //   }

  //   const expirationDate = new Date(passwordRecoveryInfo.expiration!);
  //   const currentDate = new Date();

  //   if (expirationDate < currentDate) {
  //     return {
  //       status: RESULT_STATUS.BAD_REQUEST,
  //       errorMessage: 'Bad Request',
  //       extensions: [{ message: 'The recovery code has expired', field: 'recoveryCode' }],
  //       data: null,
  //     };
  //   }

  //   const hash = await this.authService.hashPassword(newPassword);
  //   await this.usersRepo.updatePassword(recoveryCode, hash);

  //   return {
  //     status: RESULT_STATUS.NO_CONTENT,
  //     data: null,
  //   };
  // }

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
