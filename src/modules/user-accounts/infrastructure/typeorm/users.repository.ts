import { Inject, Injectable } from '@nestjs/common';
import {
  ConfirmationInfoType,
  CreateUserRepoParams,
  PasswordRecoveryInfoType,
  UpdateConfirmationCodeParams,
  UpdateRecoveryCodeParams,
  UserType,
  UserViewType,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfirmationInfo, PasswordRecoveryInfo, User } from './users.entities.js';
import { Like, Repository } from 'typeorm';
import {
  ConfirmationCodeInvalidDomainException,
  IncorrectEmailDomainException,
  RecoveryCodeInvalidDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly userEntityRepository: Repository<User>) {}

  async findUser(loginOrEmail: string): Promise<UserType> {
    const likeTerm = `%${loginOrEmail}%`;
    const user = await this.userEntityRepository.findOne({
      relations: { confirmation: true, passwordRecovery: true },
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) {
      throw new IncorrectEmailDomainException();
    }

    return user.toDto();
  }

  async getLogin(id: string): Promise<string> {
    const user = await this.userEntityRepository.findOne({
      select: { login: true },
      where: { id: Number.parseInt(id) },
    });

    if (!user) {
      throw new UnauthorizedDomainException();
    }

    return user.login;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType> {
    const user = await this.userEntityRepository.findOne({
      select: { confirmation: true },
      where: { confirmation: { code } },
    });

    if (!user) {
      throw new ConfirmationCodeInvalidDomainException();
    }

    return user.confirmation;
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType> {
    const user = await this.userEntityRepository.findOne({
      select: { passwordRecovery: true },
      where: { passwordRecovery: { code } },
    });

    if (!user) {
      throw new RecoveryCodeInvalidDomainException();
    }

    return user.passwordRecovery;
  }

  async createUser(params: CreateUserRepoParams): Promise<UserViewType> {
    const { login, email, hash, createdAt, confirmation, passwordRecovery } = params;
    const confirmationEntity = new ConfirmationInfo();
    confirmationEntity.isConfirmed = confirmation.isConfirmed;
    confirmationEntity.code = confirmation.code!;
    confirmationEntity.expiration = confirmation.expiration!;

    const passwordRecoveryEntity = new PasswordRecoveryInfo();
    passwordRecoveryEntity.code = passwordRecovery.code!;
    passwordRecoveryEntity.expiration = passwordRecovery.expiration!;

    const user = this.userEntityRepository.create({
      login,
      email,
      hash,
      createdAt,
      confirmation: confirmationEntity,
      passwordRecovery: passwordRecoveryEntity,
    });

    const savedUser = await this.userEntityRepository.save(user);
    return savedUser.toViewType();
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
      { confirmation: { isConfirmed: true, expiration: undefined } }, // TypeOrm не разрешает присвоить null nullable полю
    );
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleteResult = await this.userEntityRepository.softDelete({ id: Number.parseInt(id) });
    return deleteResult.affected! > 0;
  }
}
