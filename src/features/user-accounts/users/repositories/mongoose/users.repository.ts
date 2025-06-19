import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schemas.js';
import {
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
  UserViewType,
} from '../../types/users.types.js';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async findUser(loginOrEmail: string): Promise<UserType | null> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter).lean();
    if (!user) {
      return null;
    }
    const { _id, login, email, hash, createdAt, confirmation, passwordRecovery } = user;
    const id = _id.toString();
    return { id, login, email, hash, createdAt, confirmation, passwordRecovery };
  }

  async getLogin(id: string): Promise<string | null> {
    const _id = new ObjectId(id);
    const user = await this.model.findById(_id, { login: 1 }).lean();
    if (!user) return null;
    return user.login;
  }

  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: string,
    confirmation: ConfirmationInfoType,
    passwordRecovery: PasswordRecoveryInfoType,
  ): Promise<UserViewType> {
    const _id = new ObjectId();
    const newUser = { _id, login, email, hash, createdAt, confirmation, passwordRecovery };
    await this.model.insertOne(newUser);
    const id = _id.toString();
    return { id, login, email, createdAt };
  }

  async updateConfirmationCode(email: string, code: string, expiration: string): Promise<void> {
    await this.model.updateOne(
      { email },
      { $set: { 'confirmation.code': code, 'confirmation.expiration': expiration } },
    );
  }

  async updateRecoveryCode(email: string, code: string, expiration: string): Promise<boolean> {
    const updateResult = await this.model.updateOne(
      { email },
      { $set: { 'passwordRecovery.code': code, 'passwordRecovery.expiration': expiration } },
    );

    return updateResult.modifiedCount > 0;
  }

  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.model.updateOne(
      { 'passwordRecovery.code': recoveryCode },
      { $set: { hash, 'passwordRecovery.code': null, 'passwordRecovery.expiration': null } },
    );
  }

  async confirmUser(code: string): Promise<void> {
    await this.model.updateOne(
      { 'confirmation.code': code },
      { $set: { 'confirmation.isConfirmed': true, 'confirmation.expiration': null } },
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
