import { Injectable } from '@nestjs/common';
import {
  ConfirmationInfoModel,
  CreateUserRepoParams,
  PasswordRecoveryInfoModel,
  UpdateConfirmationCodeParams,
  UpdateRecoveryCodeParams,
  UserModel,
  UserViewModel,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import {
  ConfirmationCodeInvalidDomainException,
  RecoveryCodeInvalidDomainException,
  UnauthorizedDomainException,
  UserNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly userEntityRepository: Repository<User>) {}

  async findUser(loginOrEmail: string): Promise<UserModel | null> {
    const user = await this.userEntityRepository.findOne({
      relations: { confirmation: true, passwordRecovery: true },
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });

    if (!user) {
      return null;
    }

    return user.toModel();
  }

  async getLogin(id: string): Promise<string> {
    if (!isPositiveIntegerString(id)) {
      throw new UnauthorizedDomainException();
    }

    const user = await this.userEntityRepository.findOne({
      select: { login: true },
      where: { id: +id },
    });

    if (!user) {
      throw new UnauthorizedDomainException();
    }

    return user.login;
  }

  async isLoginExists(login: string): Promise<boolean> {
    const user = await this.userEntityRepository.findOne({
      select: { id: true },
      where: { login },
    });

    return !!user;
  }

  async isEmailExists(email: string): Promise<boolean> {
    const user = await this.userEntityRepository.findOne({
      select: { id: true },
      where: { email },
    });

    return !!user;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoModel> {
    const user = await this.userEntityRepository.findOne({
      select: { confirmation: true },
      where: { confirmation: { code } },
    });

    if (!user) {
      throw new ConfirmationCodeInvalidDomainException();
    }

    return user.confirmation;
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoModel> {
    const user = await this.userEntityRepository.findOne({
      select: { passwordRecovery: true },
      where: { passwordRecovery: { code } },
    });

    if (!user) {
      throw new RecoveryCodeInvalidDomainException();
    }

    return user.passwordRecovery;
  }

  async createUser(params: CreateUserRepoParams): Promise<UserViewModel> {
    const { login, email, hash, createdAt, confirmation, passwordRecovery } = params;
    const result = await this.userEntityRepository.insert({
      login,
      email,
      hash,
      createdAt,
      confirmation,
      passwordRecovery,
    });
    const identifier = result.identifiers[0] as { id: number };
    const id = identifier.id.toString();

    return { id, login, email, createdAt: createdAt.toISOString() };
  }

  async updateConfirmationCode(params: UpdateConfirmationCodeParams): Promise<void> {
    const { email, code, expiration } = params;
    await this.userEntityRepository.update(
      { email },
      {
        confirmation: {
          code,
          expiration,
        },
      },
    );
  }

  async updateRecoveryCode(params: UpdateRecoveryCodeParams): Promise<boolean> {
    const { email, code, expiration } = params;
    const updateResult = await this.userEntityRepository.update(
      { email },
      {
        passwordRecovery: {
          code,
          expiration,
        },
      },
    );

    return updateResult.affected! > 0;
  }

  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.userEntityRepository.update({ passwordRecovery: { code: recoveryCode } }, { hash });
  }

  async confirmUser(code: string): Promise<void> {
    await this.userEntityRepository.update(
      {
        confirmation: {
          code,
        },
      },
      { confirmation: { isConfirmed: true, expiration: null } },
    );
  }

  async deleteUser(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new UserNotFoundDomainException();
    }

    const deleteResult = await this.userEntityRepository.softDelete({ id: +id });

    if (deleteResult.affected === 0) {
      throw new UserNotFoundDomainException();
    }
  }
}
