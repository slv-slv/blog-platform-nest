import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schemas.js';
import { Model } from 'mongoose';
import {
  ConfirmationInfoType,
  CurrentUserType,
  PasswordRecoveryInfoType,
  UsersPaginatedType,
  UserViewType,
} from '../../types/users.types.js';
import { ObjectId } from 'mongodb';
import { PagingParamsType } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async getAllUsers(
    searchLoginTerm: string | null,
    searchEmailTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<UsersPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    let filter = {};
    const loginFilter = searchLoginTerm ? { login: { $regex: searchLoginTerm, $options: 'i' } } : {};
    const emailFilter = searchEmailTerm ? { email: { $regex: searchEmailTerm, $options: 'i' } } : {};

    if (searchEmailTerm && searchLoginTerm) {
      filter = { $or: [loginFilter, emailFilter] };
    } else if (searchEmailTerm) {
      filter = emailFilter;
    } else if (searchLoginTerm) {
      filter = loginFilter;
    }

    const totalCount = await this.model.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);

    const usersWithObjectId = await this.model
      .find(filter, { hash: 0 })
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const users = usersWithObjectId.map((user) => {
      return {
        id: user._id.toString(),
        login: user.login,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users,
    };
  }

  async findUser(loginOrEmail: string): Promise<UserViewType | null> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter, { hash: 0 }).lean();
    if (!user) {
      return null;
    }
    const { _id, login, email, createdAt } = user;
    const id = _id.toString();
    return { id, login, email, createdAt: createdAt.toISOString() };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
    const _id = new ObjectId(userId);
    const user = await this.model.findOne({ _id }, { email: 1, login: 1 }).lean();
    if (!user) {
      return null;
    }
    const { email, login } = user;
    return { email, login, userId };
  }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter, { _id: 0, 'confirmation.isConfirmed': 1 }).lean();
    if (!user) {
      return false;
    }
    return user.confirmation.isConfirmed;
  }

  async isLoginExists(login: string): Promise<boolean> {
    const loginCount = await this.model.countDocuments({ login });
    return loginCount > 0;
  }

  async isEmailExists(email: string): Promise<boolean> {
    const emailCount = await this.model.countDocuments({ email });
    return emailCount > 0;
  }

  async getPasswordHash(loginOrEmail: string): Promise<string | null> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter, { _id: 0, hash: 1 }).lean();
    if (!user) {
      return null;
    }
    return user.hash;
  }
}
