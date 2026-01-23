import { Inject, Injectable } from '@nestjs/common';
import {
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
  UserViewType,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfirmationInfo, PasswordRecoveryInfo, User } from './users.entities.js';
import { Like, Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly userEntityRepo: Repository<User>) {}

  async findUser(loginOrEmail: string): Promise<UserType | null> {
    const likeTerm = `%${loginOrEmail}%`;
    const user = await this.userEntityRepo.findOne({
      relations: { confirmation: true, passwordRecovery: true },
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) return null;

    return user.toDto();
  }

  async getLogin(id: string): Promise<string | null> {
    const user = await this.userEntityRepo.findOne({
      select: { login: true },
      where: { id: Number.parseInt(id) },
    });

    if (!user) return null;
    return user.login;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
    const user = await this.userEntityRepo.findOne({
      select: { confirmation: true },
      where: { confirmation: { code } },
    });

    if (!user) return null;

    return user.confirmation;
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
    const user = await this.userEntityRepo.findOne({
      select: { passwordRecovery: true },
      where: { passwordRecovery: { code } },
    });

    if (!user) return null;

    return user.passwordRecovery;
  }

  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: Date,
    confirmation: ConfirmationInfoType,
    passwordRecovery: PasswordRecoveryInfoType,
  ): Promise<UserViewType> {
    const confirmationEntity = new ConfirmationInfo();
    confirmationEntity.isConfirmed = confirmation.isConfirmed;
    confirmationEntity.code = confirmation.code!;
    confirmationEntity.expiration = confirmation.expiration!;

    const passwordRecoveryEntity = new PasswordRecoveryInfo();
    passwordRecoveryEntity.code = passwordRecovery.code!;
    passwordRecoveryEntity.expiration = passwordRecovery.expiration!;

    const user = this.userEntityRepo.create({
      login,
      email,
      hash,
      createdAt,
      confirmation: confirmationEntity,
      passwordRecovery: passwordRecoveryEntity,
    });

    const savedUser = await this.userEntityRepo.save(user);
    return savedUser.toViewType();
  }

  async updateConfirmationCode(email: string, code: string, expiration: Date): Promise<void> {
    await this.userEntityRepo.update(
      { email },
      {
        confirmation: {
          code,
          expiration,
        },
      },
    );
  }

  async updateRecoveryCode(email: string, code: string, expiration: Date): Promise<boolean> {
    const updateResult = await this.userEntityRepo.update(
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
    await this.userEntityRepo.update({ passwordRecovery: { code: recoveryCode } }, { hash });
  }

  async confirmUser(code: string): Promise<void> {
    await this.userEntityRepo.update(
      {
        confirmation: {
          code,
        },
      },
      { confirmation: { isConfirmed: true, expiration: undefined } }, // TypeOrm не разрешает присвоить null nullable полю
    );
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleteResult = await this.userEntityRepo.softDelete({ id: Number.parseInt(id) });
    return deleteResult.affected! > 0;
  }
}
