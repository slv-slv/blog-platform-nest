import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schemas.js';
import {
  ConfirmationInfoModel,
  CreateUserRepoParams,
  PasswordRecoveryInfoModel,
  UpdateConfirmationCodeParams,
  UpdateRecoveryCodeParams,
  UserModel,
  UserViewModel,
} from '../../types/users.types.js';
import { ObjectId } from 'mongodb';
import {
  ConfirmationCodeInvalidDomainException,
  IncorrectEmailDomainException,
  RecoveryCodeInvalidDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async findUser(loginOrEmail: string): Promise<UserModel> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter).lean();
    if (!user) {
      throw new IncorrectEmailDomainException();
    }
    const { _id, login, email, hash, createdAt, confirmation, passwordRecovery } = user;
    const id = _id.toString();
    return { id, login, email, hash, createdAt, confirmation, passwordRecovery };
  }

  async getLogin(id: string): Promise<string> {
    if (!ObjectId.isValid(id)) {
      throw new UnauthorizedDomainException();
    }

    const _id = new ObjectId(id);
    const user = await this.model.findById(_id, { login: 1 }).lean();
    if (!user) {
      throw new UnauthorizedDomainException();
    }

    return user.login;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoModel> {
    const user = await this.model.findOne({ 'confirmation.code': code }, { confirmation: 1 }).lean();
    if (!user) {
      throw new ConfirmationCodeInvalidDomainException();
    }
    return user.confirmation;
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoModel> {
    const user = await this.model.findOne({ 'passwordRecovery.code': code }, { passwordRecovery: 1 }).lean();
    if (!user) {
      throw new RecoveryCodeInvalidDomainException();
    }
    return user.passwordRecovery;
  }

  async createUser(params: CreateUserRepoParams): Promise<UserViewModel> {
    const { login, email, hash, createdAt, confirmation, passwordRecovery } = params;
    const newUser = { login, email, hash, createdAt, confirmation, passwordRecovery };
    const insertedUser = await this.model.create(newUser as any);
    const id = insertedUser._id.toString();
    return { id, login, email, createdAt: createdAt.toISOString() };
  }

  async updateConfirmationCode(params: UpdateConfirmationCodeParams): Promise<void> {
    const { email, code, expiration } = params;
    await this.model.updateOne(
      { email },
      { $set: { 'confirmation.code': code, 'confirmation.expiration': expiration } },
      { runValidators: true },
    );
  }

  async updateRecoveryCode(params: UpdateRecoveryCodeParams): Promise<boolean> {
    const { email, code, expiration } = params;
    const updateResult = await this.model.updateOne(
      { email },
      { $set: { 'passwordRecovery.code': code, 'passwordRecovery.expiration': expiration } },
      { runValidators: true },
    );

    return updateResult.modifiedCount > 0;
  }

  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.model.updateOne(
      { 'passwordRecovery.code': recoveryCode },
      { $set: { hash, 'passwordRecovery.code': null, 'passwordRecovery.expiration': null } },
      { runValidators: true },
    );
  }

  async confirmUser(code: string): Promise<void> {
    await this.model.updateOne(
      { 'confirmation.code': code },
      { $set: { 'confirmation.isConfirmed': true, 'confirmation.expiration': null } },
      { runValidators: true },
    );
    // return updateResult.modifiedCount > 0; // Будет false если пользователь не найден или уже подтвержден
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const deleteResult = await this.model.deleteOne({ _id });
    return deleteResult.deletedCount > 0;
  }
}
